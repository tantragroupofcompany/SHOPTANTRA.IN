/**
 * Executive sign-in security tests.
 *
 * Run: node scripts/test-executive-auth.cjs
 *
 * Pure-logic tests over the shipped auth helpers. No database, no running server
 * and no real password is involved, so this runs anywhere and can be pointed at
 * a production build. The two TypeScript helpers under test are transpiled
 * in-memory with the project's own TypeScript compiler, so the test always
 * exercises the real shipped source rather than a copy of it.
 *
 * COVERED
 *  1. The 2026 usernames are the current generation, and exactly one account
 *     exists per executive role.
 *  2. Every 2027 username is retired and can no longer be a valid username.
 *  3. Password verification: real bcrypt hash matches, wrong password does not,
 *     the plaintext fallback is unavailable on the executive path, and neither
 *     inert sentinel can ever authenticate.
 *  4. Role -> dashboard mapping, and that a session role can never be widened
 *     beyond the three executive roles.
 *  5. JWT secret handling, including the refusal to fall back in production.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const Module = require('module');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

/**
 * Transpile a project .ts file to CommonJS in memory and evaluate it, so the
 * test runs against the real source with no build step and no temp files.
 */
function loadTsModule(relPath, stubs = {}) {
  const filePath = path.join(root, relPath);
  const source = fs.readFileSync(filePath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      resolveJsonModule: true,
    },
    fileName: filePath,
  });

  const moduleObj = { exports: {} };

  // A require() that understands bare specifiers used as stubs, and that maps a
  // relative specifier onto the real file on disk (adding the .ts extension that
  // plain CommonJS resolution would not try).
  const localRequire = (request) => {
    if (Object.prototype.hasOwnProperty.call(stubs, request)) return stubs[request];
    if (request.startsWith('.')) {
      const base = path.resolve(path.dirname(filePath), request);
      for (const ext of ['', '.ts', '.tsx', '/index.ts', '.json']) {
        const candidate = base + ext;
        if (!fs.existsSync(candidate)) continue;
        // A .json dependency is data, not code: read it rather than transpiling it.
        if (ext === '' || ext === '.json') {
          if (!candidate.endsWith('.json')) return require(candidate);
          return JSON.parse(fs.readFileSync(candidate, 'utf8'));
        }
        return loadTsModule(path.relative(root, candidate), stubs);
      }
    }
    return require(request);
  };
  localRequire.resolve = (request) => require.resolve(request);

  const fn = new Function('exports', 'require', 'module', '__filename', '__dirname', outputText);
  fn(moduleObj.exports, localRequire, moduleObj, filePath, path.dirname(filePath));
  return moduleObj.exports;
}

// --- Load the modules under test -------------------------------------------
const { identities, retiredUsernames } = require(
  path.join(root, 'src/lib/executives.json')
);

const executives = loadTsModule('src/lib/executives.ts');
const corporateAuth = loadTsModule('src/lib/corporateAuth.ts', { jose: {} });
const authUtils = loadTsModule('src/lib/authUtils.ts', {
  bcryptjs: require('bcryptjs'),
  './databaseUrl': { describeCredentialPlaceholders: () => ({}) },
});

const { verifyPassword } = authUtils;
const bcrypt = require('bcryptjs');

let passed = 0;
let failed = 0;
function check(name, fn) {
  try {
    fn();
    console.log('  PASS  ' + name);
    passed++;
  } catch (e) {
    console.log('  FAIL  ' + name);
    console.log('        ' + (e && e.message));
    failed++;
  }
}

console.log('\nEXECUTIVE SIGN-IN SECURITY TESTS\n');

// --- 1. Current usernames ----------------------------------------------------
console.log('[1] Current credential generation');
check('founder_2026 is the FOUNDER username', () => {
  assert.strictEqual(identities.find((i) => i.role === 'FOUNDER').username, 'founder_2026');
});
check('chairman_2026 is the CHAIRMAN username', () => {
  assert.strictEqual(identities.find((i) => i.role === 'CHAIRMAN').username, 'chairman_2026');
});
check('ceo_2026 is the CEO_MD username', () => {
  assert.strictEqual(identities.find((i) => i.role === 'CEO_MD').username, 'ceo_2026');
});
check('exactly three executives are configured', () => {
  assert.strictEqual(identities.length, 3);
});
check('executive roles are unique (no duplicate accounts)', () => {
  const roles = identities.map((i) => i.role);
  assert.strictEqual(new Set(roles).size, roles.length);
});
check('emails are unique', () => {
  const emails = identities.map((i) => i.email);
  assert.strictEqual(new Set(emails).size, emails.length);
});
check('no literal password is stored beside the identities', () => {
  const raw = JSON.stringify(identities).replace(/"passwordEnvKey":/g, '"key":');
  assert.ok(!/"password"\s*:/.test(raw), 'a literal password must never be stored here');
});
check('every executive reads its password from a named env var', () => {
  for (const i of identities) assert.ok(/^EXECUTIVE_[A-Z]+_PASSWORD$/.test(i.passwordEnvKey), i.role);
});
check('executives.ts re-exports the same identities it was given', () => {
  assert.deepStrictEqual(executives.EXECUTIVE_IDENTITIES, identities);
});
check('executives.ts re-exports the same retired list', () => {
  assert.deepStrictEqual(executives.RETIRED_EXECUTIVE_USERNAMES, retiredUsernames);
});

// --- 2. Retired usernames ----------------------------------------------------
console.log('\n[2] Retired 2027 credentials');
for (const old of ['founder_2027', 'chairman_2027', 'ceo_2027']) {
  check(old + ' is retired', () => {
    assert.ok(retiredUsernames.includes(old), old + ' must be retired');
    assert.strictEqual(executives.isRetiredExecutiveUsername(old), true);
  });
  check(old + ' is NOT a current username', () => {
    assert.ok(!identities.some((i) => i.username === old), old + ' must not be current');
  });
}
check('a current username is not reported as retired', () => {
  for (const i of identities) {
    assert.strictEqual(executives.isRetiredExecutiveUsername(i.username), false, i.username);
  }
});
check('retired list is lowercase (the login route lowercases input first)', () => {
  for (const old of retiredUsernames) assert.strictEqual(old, old.toLowerCase().trim());
});

// --- 3. Password verification ------------------------------------------------
console.log('\n[3] Password verification (executive path)');
const TEST_PW = 'unit-test-only-not-a-real-password';

check('a correct password verifies against its bcrypt hash', () => {
  const hash = bcrypt.hashSync(TEST_PW, 10);
  assert.strictEqual(verifyPassword(TEST_PW, hash, { allowPlaintext: false }), true);
});
check('a wrong password does not verify', () => {
  const hash = bcrypt.hashSync(TEST_PW, 10);
  assert.strictEqual(verifyPassword('wrong-password', hash, { allowPlaintext: false }), false);
});
check('one executive password does not verify against another executive hash', () => {
  const h1 = bcrypt.hashSync('alpha-passphrase', 10);
  const h2 = bcrypt.hashSync('beta-passphrase', 10);
  assert.strictEqual(verifyPassword('alpha-passphrase', h1, { allowPlaintext: false }), true);
  assert.strictEqual(verifyPassword('beta-passphrase', h1, { allowPlaintext: false }), false);
  assert.strictEqual(verifyPassword('alpha-passphrase', h2, { allowPlaintext: false }), false);
});
check('plaintext fallback is DISABLED on the executive path', () => {
  assert.strictEqual(
    verifyPassword('stored-in-plaintext', 'stored-in-plaintext', { allowPlaintext: false }),
    false,
    'an executive row must never be matched by string equality'
  );
});
check('plaintext fallback still works for legacy buyer/seller rows', () => {
  assert.strictEqual(verifyPassword('legacy-pw', 'legacy-pw'), true);
});
for (const sentinel of ['!retired-credential-disabled', '!no-credential-until-provisioned']) {
  check('sentinel ' + JSON.stringify(sentinel) + ' can never authenticate', () => {
    assert.strictEqual(verifyPassword(sentinel, sentinel, { allowPlaintext: false }), false);
    assert.strictEqual(verifyPassword(sentinel, sentinel), false);
    assert.strictEqual(verifyPassword('anything', sentinel, { allowPlaintext: false }), false);
    assert.strictEqual(verifyPassword('anything', sentinel), false);
  });
}
check('an empty stored value never authenticates', () => {
  assert.strictEqual(verifyPassword('', '', { allowPlaintext: false }), false);
  assert.strictEqual(verifyPassword('x', '', { allowPlaintext: false }), false);
});
check('pbkdf2 hashes still verify', () => {
  const salt = require('crypto').randomBytes(16).toString('hex');
  const hash = require('crypto').pbkdf2Sync('pbkdf2-pw', salt, 1000, 64, 'sha512').toString('hex');
  assert.strictEqual(verifyPassword('pbkdf2-pw', salt + ':' + hash, { allowPlaintext: false }), true);
  assert.strictEqual(verifyPassword('nope', salt + ':' + hash, { allowPlaintext: false }), false);
});
check('hashes are salted (two hashes of one password differ)', () => {
  assert.notStrictEqual(bcrypt.hashSync(TEST_PW, 10), bcrypt.hashSync(TEST_PW, 10));
});

// --- 4. Role boundaries ------------------------------------------------------
console.log('\n[4] Role boundaries and dashboards');
check('FOUNDER -> /founder/dashboard', () => {
  assert.strictEqual(corporateAuth.getCorporateRoleDashboard('FOUNDER'), '/founder/dashboard');
});
check('CHAIRMAN -> /chairman/dashboard', () => {
  assert.strictEqual(corporateAuth.getCorporateRoleDashboard('CHAIRMAN'), '/chairman/dashboard');
});
check('CEO_MD -> /ceo/dashboard', () => {
  assert.strictEqual(corporateAuth.getCorporateRoleDashboard('CEO_MD'), '/ceo/dashboard');
});
check('no executive USERNAME is also a ROLE name (login looks up by username only)', () => {
  // normalizeCorporateRole() is a canonicaliser: it maps a stored role value such
  // as 'ceo' onto CEO_MD. It is deliberately permissive, and the login route uses
  // it only AFTER a row has been found by username, to canonicalise that row's
  // role. It is never used to look an account up.
  //
  // The guarantee that matters is therefore: no executive username can be
  // confused with a role name, so "type your role name to sign in" can never
  // resolve to an account.
  const roleNames = ['FOUNDER', 'CHAIRMAN', 'CEO_MD', 'CEO', 'MD'];
  for (const i of identities) {
    assert.ok(
      !roleNames.includes(i.username.toUpperCase()),
      i.username + ' must not double as a role name'
    );
  }
});
check('legacy CEO and MD aliases collapse to CEO_MD, not to a new role', () => {
  assert.strictEqual(corporateAuth.normalizeCorporateRole('ceo'), 'CEO_MD');
  assert.strictEqual(corporateAuth.normalizeCorporateRole('MD'), 'CEO_MD');
});
check('a non-executive role never normalises to an executive role', () => {
  for (const r of ['BUYER', 'SELLER', 'ADMIN', 'SUPER_ADMIN', 'USER', '']) {
    assert.strictEqual(corporateAuth.normalizeCorporateRole(r), null, r);
  }
});
check('case and spacing tricks cannot widen the role set', () => {
  for (const r of [' founder ', 'FOUNDER', 'FoUnDeR']) {
    const n = corporateAuth.normalizeCorporateRole(r);
    assert.ok(['FOUNDER', 'CEO_MD', 'CHAIRMAN'].includes(n), r);
  }
});
check('exactly three corporate roles exist', () => {
  assert.deepStrictEqual([...corporateAuth.CORPORATE_ROLES], ['FOUNDER', 'CEO_MD', 'CHAIRMAN']);
});
check('each role maps to a distinct dashboard', () => {
  const targets = ['FOUNDER', 'CHAIRMAN', 'CEO_MD'].map(corporateAuth.getCorporateRoleDashboard);
  assert.strictEqual(new Set(targets).size, 3);
});

// --- 5. JWT secret handling --------------------------------------------------
console.log('\n[5] JWT secret handling');
check('production refuses the development fallback secret', () => {
  const prev = process.env.JWT_SECRET;
  const prevEnv = process.env.NODE_ENV;
  delete process.env.JWT_SECRET;
  process.env.NODE_ENV = 'production';
  try {
    assert.throws(
      () => corporateAuth.getJwtSecretString(),
      /JWT_SECRET is not configured/,
      'production must fail loudly rather than sign with a publicly-known key'
    );
  } finally {
    if (prevEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prevEnv;
    if (prev === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = prev;
  }
});
check('a configured JWT_SECRET is used', () => {
  const prev = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'configured-secret-for-test';
  try {
    assert.strictEqual(corporateAuth.getJwtSecretString(), 'configured-secret-for-test');
  } finally {
    if (prev === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = prev;
  }
});

// --- Summary -----------------------------------------------------------------
console.log('\n----------------------------------------');
console.log('  passed: ' + passed + '   failed: ' + failed);
console.log('----------------------------------------\n');
process.exit(failed === 0 ? 0 : 1);
