/**
 * PHASE 3 - Corporate Login + Corporate Dashboard access-control matrix.
 *
 * Run: node scripts/test-corporate-access.cjs
 *
 * WHAT THIS SUITE PROVES (A-K)
 *  A. Anonymous requests to /api/corporate/* and /api/founder/* get 401.
 *  B. Invalid / expired / forged (wrong secret) / alg:none tokens get 401.
 *  C. Malformed or missing-field login bodies get 400, never 500.
 *  D. /api/corporate/verify enforces signature + role + DB account state.
 *  E. A valid SELLER session gets 403 on corporate APIs.
 *  F. A valid BUYER session gets 403 on corporate APIs.
 *  G. A valid FOUNDER/CEO_MD/CHAIRMAN session is authorized (dashboard 200).
 *  H. Bad logins (unknown user, wrong password) return ONE generic 401 body.
 *  I. Valid login returns 200 + HttpOnly cookies; disabled account 403;
 *     non-executive 403; DB outage 503; retired usernames 401.
 *  J. Logout clears both cookies and the next API call is 401 again.
 *  K. No anonymous request can produce a 200 carrying company data.
 *
 * HOW
 * The real route handlers and the real middleware are transpiled in-memory
 * with the project's own TypeScript compiler and executed against real
 * NextRequest objects, real jose-signed JWTs and real bcrypt hashes. The only
 * substitution is the database: a programmable in-memory Prisma stand-in, so
 * no production row is ever read or written and no credential is required.
 * Interactive login with the live production database is therefore the one
 * thing this suite CANNOT do - it is CREDENTIAL BLOCKED by design.
 *
 * No hardcoded passwords. No network. No state left behind.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

// --- Environment MUST be set before any module under test is loaded ---------
process.env.JWT_SECRET = process.env.JWT_SECRET || 'phase3-access-test-secret-not-a-real-secret';
// Seeding must never run from a test: the bootstrap password variables are
// removed so ensureExecutiveAccounts() skips every account silently.
for (const k of [
  'EXECUTIVE_FOUNDER_PASSWORD',
  'EXECUTIVE_CEO_PASSWORD',
  'EXECUTIVE_CHAIRMAN_PASSWORD',
]) delete process.env[k];

const { NextRequest, NextResponse } = require('next/server');
const { SignJWT } = require('jose');
const bcrypt = require('bcryptjs');

const SECRET_TEXT = process.env.JWT_SECRET;
const SECRET_BYTES = new TextEncoder().encode(SECRET_TEXT);

/**
 * Transpile a project .ts file to CommonJS in memory and evaluate it, so the
 * test runs against the real shipped source with no build step and no temp
 * files. `stubs` is keyed by the EXACT require() specifier and wins for both
 * bare and relative requests, and is inherited by nested loads.
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
  const localRequire = (request) => {
    if (Object.prototype.hasOwnProperty.call(stubs, request)) return stubs[request];
    if (request.startsWith('.')) {
      const base = path.resolve(path.dirname(filePath), request);
      for (const ext of ['', '.ts', '.tsx', '/index.ts', '.json']) {
        const candidate = base + ext;
        if (!fs.existsSync(candidate)) continue;
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

// --- Programmable database stand-in -----------------------------------------
// `hooks` lets each test decide what the user table answers. Setting
// `hooks.throwing` simulates a database outage. Every other delegate returns
// the neutral value an empty development database would produce.
const hooks = {
  userFindUnique: async () => null,
  userFindFirst: async () => null,
  throwing: null,
};

function wrapOp(fn) {
  return async (...args) => {
    if (hooks.throwing) throw hooks.throwing;
    return fn(...args);
  };
}

function userDelegate() {
  return {
    findUnique: wrapOp((...a) => hooks.userFindUnique(...a)),
    findFirst: wrapOp((...a) => hooks.userFindFirst(...a)),
    findMany: wrapOp(async () => []),
    count: wrapOp(async () => 0),
    create: wrapOp(async (args) => ({ id: 'stub-user', ...((args && args.data) || {}) })),
    upsert: wrapOp(async (args) => ({ id: 'stub-user', ...((args && args.create) || {}) })),
    update: wrapOp(async (args) => ({ id: 'stub-user', ...((args && args.data) || {}) })),
    delete: wrapOp(async () => ({ id: 'stub-user' })),
  };
}

function neutralModel() {
  return {
    count: async () => 0,
    aggregate: async () => ({ _sum: {}, _count: {}, _avg: {} }),
    groupBy: async () => [],
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (args) => ({ id: 'stub', ...((args && args.data) || {}) }),
    upsert: async (args) => ({ id: 'stub', ...((args && args.create) || {}) }),
    update: async (args) => ({ id: 'stub', ...((args && args.data) || {}) }),
    updateMany: async () => ({ count: 0 }),
    delete: async () => ({}),
    deleteMany: async () => ({ count: 0 }),
  };
}

const prismaStub = new Proxy({}, {
  get(_t, prop) {
    if (typeof prop === 'symbol') return undefined;
    if (prop === 'user') return userDelegate();
    if (typeof prop === 'string' && prop.startsWith('$queryRaw')) return async () => [];
    if (typeof prop === 'string' && prop.startsWith('$executeRaw')) return async () => 0;
    if (prop === '$transaction') {
      return async (fn) => (typeof fn === 'function' ? fn(prismaStub) : []);
    }
    return neutralModel();
  },
});

// Stub keys are matched against the EXACT require() specifier at every level.
const DB_STUBS = {
  '../../../../lib/prisma': { prisma: prismaStub },
  './prisma': { prisma: prismaStub },
  '../lib/prisma': { prisma: prismaStub },
  '../../../../lib/dbBootstrap': { ensureSchema: async () => {} },
  './dbBootstrap': { ensureSchema: async () => {} },
  '../lib/dbBootstrap': { ensureSchema: async () => {} },
  './databaseUrl': { describeCredentialPlaceholders: () => ({}) },
};

// --- Token helpers (real jose signatures, test-only secret) -------------------
async function signToken(payload, opts = {}) {
  const { secret = SECRET_BYTES, expiresIn = 3600 } = opts;
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(typeof secret === 'string' ? new TextEncoder().encode(secret) : secret);
}

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

/** A structurally valid token with alg:none and an empty signature. */
function algNoneToken(payload) {
  return `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url(payload)}.`;
}

const CORP_TOKEN = { userId: 'user_test_1', email: 'founder@example.com', username: 'founder_2026', role: 'FOUNDER', type: 'corporate' };
const CEO_TOKEN = { userId: 'user_test_2', email: 'ceo@example.com', username: 'ceo_2026', role: 'CEO_MD', type: 'corporate' };
const CHAIRMAN_TOKEN = { userId: 'user_test_3', email: 'chairman@example.com', username: 'chairman_2026', role: 'CHAIRMAN', type: 'corporate' };
const SELLER_TOKEN = { userId: 'seller_1', role: 'SELLER', type: 'seller' };
const BUYER_TOKEN = { userId: 'cust_1', role: 'BUYER', type: 'customer' };

// --- Request helpers ----------------------------------------------------------
function reqGet(urlPath, token) {
  const headers = {};
  if (token) headers.cookie = `auth_token=${token}`;
  return new NextRequest(`http://localhost${urlPath}`, { headers });
}

function reqPost(urlPath, body, token, rawBody) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.cookie = `auth_token=${token}`;
  return new NextRequest(`http://localhost${urlPath}`, {
    method: 'POST',
    headers,
    body: rawBody !== undefined ? rawBody : JSON.stringify(body ?? {}),
  });
}

// --- Test harness (async-aware) -----------------------------------------------
let passed = 0;
let failed = 0;

async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log('  PASS  ' + name);
  } catch (e) {
    failed++;
    console.log('  FAIL  ' + name);
    console.log('        ' + (e && e.message ? e.message : e));
  }
}

function section(title) {
  console.log('\n' + title);
}

// ===========================================================================
// MAIN
// ===========================================================================
async function main() {
  console.log('CORPORATE ACCESS CONTROL TESTS (Phase 3)\n');

  // Real middleware + real route handlers, transpiled from shipped sources.
  const middleware = loadTsModule('src/middleware/index.ts');
  const EXEC_ROLES = ['FOUNDER', 'CEO_MD', 'CHAIRMAN'];

  const t = {
    corp: await signToken(CORP_TOKEN),
    ceo: await signToken(CEO_TOKEN),
    chairman: await signToken(CHAIRMAN_TOKEN),
    seller: await signToken(SELLER_TOKEN),
    buyer: await signToken(BUYER_TOKEN),
    expired: await signToken(CORP_TOKEN, { expiresIn: -300 }),
    forged: await signToken(CORP_TOKEN, { secret: 'attacker-controlled-wrong-secret' }),
    none: algNoneToken({
      userId: 'evil',
      role: 'FOUNDER',
      type: 'corporate',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  };

  // --- A ---------------------------------------------------------------------
  section('[A] Anonymous requests are rejected with 401');
  await check('requireRole with no cookie -> 401', async () => {
    const res = await middleware.requireRole(reqGet('/api/corporate/dashboard'), EXEC_ROLES);
    assert.ok(res instanceof Response, 'expected a rejection Response');
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.ok(body.error, 'a JSON error must be present');
  });
  await check('requireRole on /api/founder with no cookie -> 401', async () => {
    const res = await middleware.requireRole(reqGet('/api/founder/dashboard'), ['FOUNDER']);
    assert.ok(res instanceof Response);
    assert.strictEqual(res.status, 401);
  });
  await check('requireRole on a POST (seller-action) with no cookie -> 401', async () => {
    const res = await middleware.requireRole(
      reqPost('/api/corporate/seller-action', { sellerId: 's1', action: 'approve' }),
      EXEC_ROLES
    );
    assert.ok(res instanceof Response);
    assert.strictEqual(res.status, 401);
  });

  // --- B ---------------------------------------------------------------------
  section('[B] Invalid, expired, forged and alg:none tokens are rejected with 401');
  await check('expired token -> 401', async () => {
    const res = await middleware.requireRole(reqGet('/api/corporate/dashboard', t.expired), EXEC_ROLES);
    assert.ok(res instanceof Response);
    assert.strictEqual(res.status, 401);
  });
  await check('token signed with a different secret (forged) -> 401', async () => {
    const res = await middleware.requireRole(reqGet('/api/corporate/dashboard', t.forged), EXEC_ROLES);
    assert.ok(res instanceof Response);
    assert.strictEqual(res.status, 401);
  });
  await check('alg:none token (empty signature) -> 401', async () => {
    const res = await middleware.requireRole(reqGet('/api/corporate/dashboard', t.none), EXEC_ROLES);
    assert.ok(res instanceof Response);
    assert.strictEqual(res.status, 401);
  });
  await check('garbage cookie value -> 401 (not 500)', async () => {
    const res = await middleware.requireRole(reqGet('/api/corporate/dashboard', 'not.a.jwt'), EXEC_ROLES);
    assert.ok(res instanceof Response);
    assert.strictEqual(res.status, 401);
  });
  await check('tampered payload (signature broken) -> 401', async () => {
    const [h] = t.corp.split('.');
    const evil = Buffer.from(JSON.stringify({ ...CORP_TOKEN, role: 'CHAIRMAN' })).toString('base64url');
    const res = await middleware.requireRole(
      reqGet('/api/corporate/dashboard', `${h}.${evil}.x`),
      EXEC_ROLES
    );
    assert.ok(res instanceof Response);
    assert.strictEqual(res.status, 401);
  });

  // --- E / F -----------------------------------------------------------------
  section('[E/F] Seller and buyer sessions are forbidden (403), never data');
  await check('valid SELLER token on corporate middleware -> 403', async () => {
    const res = await middleware.requireRole(reqGet('/api/corporate/dashboard', t.seller), EXEC_ROLES);
    assert.ok(res instanceof Response);
    assert.strictEqual(res.status, 403);
  });
  await check('valid BUYER token on corporate middleware -> 403', async () => {
    const res = await middleware.requireRole(reqGet('/api/corporate/dashboard', t.buyer), EXEC_ROLES);
    assert.ok(res instanceof Response);
    assert.strictEqual(res.status, 403);
  });
  await check('SELLER token directly on the dashboard handler -> 403, no data', async () => {
    const dashboard = loadTsModule('src/app/api/corporate/dashboard/route.ts', DB_STUBS);
    const res = await dashboard.GET(reqGet('/api/corporate/dashboard', t.seller));
    assert.strictEqual(res.status, 403);
    const text = JSON.stringify(await res.json());
    assert.ok(!text.includes('revenue'), 'no company data may leak on a 403');
  });
  await check('BUYER token directly on the finance handler -> 403', async () => {
    const finance = loadTsModule('src/app/api/corporate/finance/route.ts', DB_STUBS);
    const res = await finance.GET(reqGet('/api/corporate/finance', t.buyer));
    assert.strictEqual(res.status, 403);
  });

  // --- G ---------------------------------------------------------------------
  section('[G] Corporate sessions are authorized');
  await check('FOUNDER token passes requireRole (context, not a Response)', async () => {
    const ctx = await middleware.requireRole(reqGet('/api/corporate/dashboard', t.corp), EXEC_ROLES);
    assert.ok(!(ctx instanceof Response), 'a corporate token must not be rejected');
    assert.strictEqual(ctx.role, 'FOUNDER');
    assert.strictEqual(ctx.userId, CORP_TOKEN.userId);
  });
  await check('CEO_MD token passes requireRole', async () => {
    const ctx = await middleware.requireRole(reqGet('/api/corporate/dashboard', t.ceo), EXEC_ROLES);
    assert.ok(!(ctx instanceof Response));
    assert.strictEqual(ctx.role, 'CEO_MD');
  });
  await check('CHAIRMAN token passes requireRole', async () => {
    const ctx = await middleware.requireRole(reqGet('/api/corporate/dashboard', t.chairman), EXEC_ROLES);
    assert.ok(!(ctx instanceof Response));
    assert.strictEqual(ctx.role, 'CHAIRMAN');
  });
  await check('a valid role never widens: FOUNDER on a CEO_MD-only audience -> 403', async () => {
    const res = await middleware.requireRole(reqGet('/api/corporate/dashboard', t.corp), ['CEO_MD']);
    assert.ok(res instanceof Response);
    assert.strictEqual(res.status, 403);
  });
  await check('authenticated FOUNDER gets a real 200 dashboard payload', async () => {
    const dashboard = loadTsModule('src/app/api/corporate/dashboard/route.ts', DB_STUBS);
    const res = await dashboard.GET(reqGet('/api/corporate/dashboard', t.corp));
    assert.strictEqual(res.status, 200, 'expected 200, got ' + res.status);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data, 'the company data payload must be present for a corporate session');
    assert.ok(body.data.security, 'security section must exist');
  });

  // --- D ---------------------------------------------------------------------
  section('[D] /api/corporate/verify: signature + role + database account state');
  const verify = loadTsModule('src/app/api/corporate/verify/route.ts', DB_STUBS);

  await check('verify without a cookie -> 401 authenticated:false', async () => {
    const res = await verify.GET(reqGet('/api/corporate/verify'));
    assert.strictEqual(res.status, 401);
    assert.strictEqual((await res.json()).authenticated, false);
  });
  await check('verify with an expired token -> 401', async () => {
    const res = await verify.GET(reqGet('/api/corporate/verify', t.expired));
    assert.strictEqual(res.status, 401);
  });
  await check('verify with a forged token -> 401', async () => {
    const res = await verify.GET(reqGet('/api/corporate/verify', t.forged));
    assert.strictEqual(res.status, 401);
  });
  await check('verify with an alg:none token -> 401', async () => {
    const res = await verify.GET(reqGet('/api/corporate/verify', t.none));
    assert.strictEqual(res.status, 401);
  });
  await check('verify with a SELLER token -> 403 authenticated:false', async () => {
    const res = await verify.GET(reqGet('/api/corporate/verify', t.seller));
    assert.strictEqual(res.status, 403);
    assert.strictEqual((await res.json()).authenticated, false);
  });
  await check('verify with a BUYER token -> 403 authenticated:false', async () => {
    const res = await verify.GET(reqGet('/api/corporate/verify', t.buyer));
    assert.strictEqual(res.status, 403);
  });
  await check('valid FOUNDER token + active DB row -> 200 authenticated', async () => {
    hooks.userFindUnique = async (args) =>
      args && args.where && args.where.id === CORP_TOKEN.userId
        ? { role: 'FOUNDER', isActive: true }
        : null;
    const res = await verify.GET(reqGet('/api/corporate/verify', t.corp));
    assert.strictEqual(res.status, 200, 'expected 200, got ' + res.status);
    const b = await res.json();
    assert.strictEqual(b.authenticated, true);
    assert.strictEqual(b.role, 'FOUNDER');
  });
  await check('valid token but the account row was DELETED -> 403', async () => {
    hooks.userFindUnique = async () => null;
    const res = await verify.GET(reqGet('/api/corporate/verify', t.corp));
    assert.strictEqual(res.status, 403);
    assert.strictEqual((await res.json()).authenticated, false);
  });
  await check('valid token but the account is DISABLED -> 403', async () => {
    hooks.userFindUnique = async () => ({ role: 'FOUNDER', isActive: false });
    const res = await verify.GET(reqGet('/api/corporate/verify', t.corp));
    assert.strictEqual(res.status, 403);
  });
  await check('valid token but the stored role is no longer executive -> 403', async () => {
    hooks.userFindUnique = async () => ({ role: 'SELLER', isActive: true });
    const res = await verify.GET(reqGet('/api/corporate/verify', t.corp));
    assert.strictEqual(res.status, 403);
  });
  await check('database outage on revalidation: signed token still accepted (documented fail-open)', async () => {
    hooks.throwing = Object.assign(new Error('can’t reach database server'), { code: 'P1001' });
    try {
      const res = await verify.GET(reqGet('/api/corporate/verify', t.corp));
      assert.strictEqual(res.status, 200, 'lookup failure must not bounce the guard');
      assert.strictEqual((await res.json()).authenticated, true);
    } finally {
      hooks.throwing = null;
      hooks.userFindUnique = async () => null;
    }
  });
  await check('legacy alias role "CEO" in a valid token canonicalises to CEO_MD', async () => {
    const alias = await signToken({ ...CEO_TOKEN, role: 'CEO' });
    hooks.userFindUnique = async () => ({ role: 'CEO_MD', isActive: true });
    const res = await verify.GET(reqGet('/api/corporate/verify', alias));
    assert.strictEqual(res.status, 200);
    assert.strictEqual((await res.json()).role, 'CEO_MD');
  });

  // --- J ---------------------------------------------------------------------
  section('[J] Logout invalidates the session cookies');
  const logout = loadTsModule('src/app/api/corporate/logout/route.ts', DB_STUBS);

  await check('POST logout clears corporate_auth_token and auth_token', async () => {
    const res = await logout.POST();
    const c1 = res.cookies.get('corporate_auth_token');
    const c2 = res.cookies.get('auth_token');
    assert.ok(c1 && c2, 'both cookies must appear in Set-Cookie');
    assert.strictEqual(c1.value, '');
    assert.strictEqual(c2.value, '');
    const dead = (c) =>
      c.maxAge === 0 || (c.expires && new Date(c.expires).getTime() <= Date.now());
    assert.ok(dead(c1), 'corporate_auth_token must be expired');
    assert.ok(dead(c2), 'auth_token must be expired');
  });
  await check('GET logout clears the same cookies (back-button path)', async () => {
    const res = await logout.GET();
    const c1 = res.cookies.get('corporate_auth_token');
    const c2 = res.cookies.get('auth_token');
    assert.ok(c1 && c2);
    assert.strictEqual(c1.value, '');
    assert.strictEqual(c2.value, '');
  });
  await check('the logout body never echoes a token', async () => {
    const res = await logout.POST();
    const text = await res.text();
    assert.ok(!text.includes('eyJ'), 'no JWT may appear in the logout response');
  });
  await check('with the cleared cookie jar the next corporate API call is 401', async () => {
    const res = await middleware.requireRole(reqGet('/api/corporate/dashboard'), EXEC_ROLES);
    assert.ok(res instanceof Response);
    assert.strictEqual(res.status, 401);
  });

  // --- C ---------------------------------------------------------------------
  section('[C] Login input validation: bad requests are 400, never 500');
  const login = loadTsModule('src/app/api/corporate/login/route.ts', DB_STUBS);

  await check('malformed (non-JSON) body -> 400', async () => {
    const res = await login.POST(reqPost('/api/corporate/login', null, null, '{not json'));
    assert.strictEqual(res.status, 400);
  });
  await check('empty object body -> 400', async () => {
    const res = await login.POST(reqPost('/api/corporate/login', {}));
    assert.strictEqual(res.status, 400);
  });
  await check('missing password -> 400', async () => {
    const res = await login.POST(reqPost('/api/corporate/login', { username: 'founder_2026' }));
    assert.strictEqual(res.status, 400);
  });
  await check('missing username -> 400', async () => {
    const res = await login.POST(reqPost('/api/corporate/login', { password: 'x' }));
    assert.strictEqual(res.status, 400);
  });
  await check('numeric username (was an unhandled 500) -> 400', async () => {
    const res = await login.POST(reqPost('/api/corporate/login', { username: 12345, password: 'x' }));
    assert.strictEqual(res.status, 400);
  });
  await check('boolean password -> 400', async () => {
    const res = await login.POST(reqPost('/api/corporate/login', { username: 'a', password: true }));
    assert.strictEqual(res.status, 400);
  });
  await check('whitespace-only username -> 400', async () => {
    const res = await login.POST(reqPost('/api/corporate/login', { username: '   ', password: 'x' }));
    assert.strictEqual(res.status, 400);
  });

  // --- H ---------------------------------------------------------------------
  section('[H] Rejected logins return ONE generic 401 body (no enumeration)');
  const GENERIC = { error: 'Invalid username or password.' };

  let unknownBody;
  await check('unknown username -> 401 with the generic body', async () => {
    hooks.userFindUnique = async () => null;
    const res = await login.POST(reqPost('/api/corporate/login', {
      username: 'definitely_not_a_user',
      password: 'whatever',
    }));
    assert.strictEqual(res.status, 401);
    unknownBody = await res.json();
    assert.deepStrictEqual(unknownBody, GENERIC);
    assert.ok(!JSON.stringify(unknownBody).toLowerCase().includes('not found'));
  });

  const founderRow = {
    id: 'user_test_1',
    username: 'founder_2026',
    email: 'founder@example.com',
    password: bcrypt.hashSync('a-test-only-bcrypt-hash-input', 4),
    role: 'FOUNDER',
    fullName: 'Founder',
    isActive: true,
  };
  const founderLookup = async (args) => {
    if (args && args.where && args.where.username) {
      return args.where.username === founderRow.username ? founderRow : null;
    }
    if (args && args.where && args.where.email) {
      return args.where.email === founderRow.email ? founderRow : null;
    }
    return null;
  };

  await check('wrong password -> 401 with a body byte-identical to unknown-user', async () => {
    hooks.userFindUnique = founderLookup;
    const res = await login.POST(reqPost('/api/corporate/login', {
      username: 'founder_2026',
      password: 'this-is-not-the-password',
    }));
    assert.strictEqual(res.status, 401);
    const wrongPwBody = await res.json();
    assert.deepStrictEqual(wrongPwBody, GENERIC);
    assert.strictEqual(
      JSON.stringify(wrongPwBody),
      JSON.stringify(unknownBody),
      'the two 401 bodies must be indistinguishable'
    );
  });
  await check('retired executive username -> 401 with the same generic body', async () => {
    hooks.userFindUnique = founderLookup; // must never even be reached
    const res = await login.POST(reqPost('/api/corporate/login', {
      username: 'founder_2027',
      password: 'whatever',
    }));
    assert.strictEqual(res.status, 401);
    assert.deepStrictEqual(await res.json(), GENERIC);
  });
  await check('no plaintext password comparison exists in the login route', async () => {
    const src = fs.readFileSync(path.join(root, 'src/app/api/corporate/login/route.ts'), 'utf8');
    assert.ok(
      src.includes('allowPlaintext: false'),
      'executive password verification must disable the plaintext fallback'
    );
    assert.ok(!/password\s*===\s*['"]/.test(src), 'no hardcoded password equality allowed');
    assert.ok(!/['"]password['"]\s*:\s*['"][^'"]+['"]/.test(src), 'no hardcoded password value allowed');
  });

  // --- I ---------------------------------------------------------------------
  section('[I] Successful sign-in and account-state enforcement');

  await check('correct executive credentials -> 200 + HttpOnly session cookies', async () => {
    hooks.userFindUnique = founderLookup;
    const res = await login.POST(reqPost('/api/corporate/login', {
      username: 'founder_2026',
      password: 'a-test-only-bcrypt-hash-input',
    }));
    assert.strictEqual(res.status, 200, 'expected 200, got ' + res.status);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(typeof body.redirectTo === 'string' && body.redirectTo.startsWith('/'));
    assert.strictEqual(body.user.role, 'FOUNDER');

    const c1 = res.cookies.get('corporate_auth_token');
    const c2 = res.cookies.get('auth_token');
    assert.ok(c1 && c2, 'both session cookies must be set');
    assert.strictEqual(c1.httpOnly, true, 'cookie must be HttpOnly');
    assert.strictEqual(c1.sameSite, 'lax');
    assert.strictEqual(c1.path, '/');
    assert.strictEqual(c1.value, c2.value, 'both cookies carry the same token');

    // The minted token must verify with the server secret and carry exec claims.
    const { jwtVerify } = require('jose');
    const { payload } = await jwtVerify(c1.value, SECRET_BYTES);
    assert.strictEqual(payload.role, 'FOUNDER');
    assert.strictEqual(payload.type, 'corporate');
    assert.strictEqual(payload.userId, founderRow.id);
  });

  await check('default session is 8h; remember-me extends to 30d (never shorter)', async () => {
    hooks.userFindUnique = founderLookup;
    const base = { username: 'founder_2026', password: 'a-test-only-bcrypt-hash-input' };
    const res1 = await login.POST(reqPost('/api/corporate/login', base));
    const res2 = await login.POST(reqPost('/api/corporate/login', { ...base, remember: true }));
    assert.strictEqual(res1.status, 200);
    assert.strictEqual(res2.status, 200);
    const m1 = res1.cookies.get('auth_token').maxAge;
    const m2 = res2.cookies.get('auth_token').maxAge;
    assert.strictEqual(m1, 8 * 60 * 60, 'baseline session must be 8 hours');
    assert.strictEqual(m2, 30 * 24 * 60 * 60, 'remember-me must be the 30 day maximum');
  });

  await check('email-address sign-in falls back correctly -> 200', async () => {
    hooks.userFindUnique = founderLookup;
    const res = await login.POST(reqPost('/api/corporate/login', {
      username: 'founder@example.com',
      password: 'a-test-only-bcrypt-hash-input',
    }));
    assert.strictEqual(res.status, 200);
    assert.strictEqual((await res.json()).user.role, 'FOUNDER');
  });

  await check('DISABLED account with the correct password -> 403, no cookie set', async () => {
    hooks.userFindUnique = async () => ({ ...founderRow, isActive: false });
    const res = await login.POST(reqPost('/api/corporate/login', {
      username: 'founder_2026',
      password: 'a-test-only-bcrypt-hash-input',
    }));
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.ok(/disabled/i.test(body.error), 'the response must say the account is disabled');
    assert.ok(!res.cookies.get('auth_token'), 'a disabled account must receive no session');
  });

  await check('valid but NON-EXECUTIVE account (SELLER) -> 403, no cookie set', async () => {
    hooks.userFindUnique = async () => ({ ...founderRow, role: 'SELLER' });
    const res = await login.POST(reqPost('/api/corporate/login', {
      username: 'founder_2026',
      password: 'a-test-only-bcrypt-hash-input',
    }));
    assert.strictEqual(res.status, 403);
    assert.ok(!res.cookies.get('auth_token'));
  });

  await check('database outage during login -> 503, never a fake 401', async () => {
    hooks.throwing = Object.assign(new Error('can’t reach database server'), { code: 'P1001' });
    try {
      const res = await login.POST(reqPost('/api/corporate/login', {
        username: 'founder_2026',
        password: 'whatever',
      }));
      assert.strictEqual(res.status, 503, 'an outage must be classified as 503');
    } finally {
      hooks.throwing = null;
      hooks.userFindUnique = async () => null;
    }
  });

  // --- Edge perimeter ---------------------------------------------------------
  section('[G2] The real edge middleware (src/middleware.ts) enforces the same matrix');
  const edge = loadTsModule('src/middleware.ts');

  await check('edge: anonymous /api/corporate/dashboard -> 401 before any handler runs', async () => {
    const res = await edge.middleware(reqGet('/api/corporate/dashboard'));
    assert.strictEqual(res.status, 401);
  });
  await check('edge: SELLER session on /api/corporate/dashboard -> 403', async () => {
    const res = await edge.middleware(reqGet('/api/corporate/dashboard', t.seller));
    assert.strictEqual(res.status, 403);
  });
  await check('edge: BUYER session on /api/corporate/finance -> 403', async () => {
    const res = await edge.middleware(reqGet('/api/corporate/finance', t.buyer));
    assert.strictEqual(res.status, 403);
  });
  await check('edge: expired token -> 401', async () => {
    const res = await edge.middleware(reqGet('/api/corporate/dashboard', t.expired));
    assert.strictEqual(res.status, 401);
  });
  await check('edge: alg:none token -> 401', async () => {
    const res = await edge.middleware(reqGet('/api/corporate/dashboard', t.none));
    assert.strictEqual(res.status, 401);
  });
  await check('edge: FOUNDER session passes through with security headers attached', async () => {
    const res = await edge.middleware(reqGet('/api/corporate/dashboard', t.corp));
    assert.strictEqual(res.status, 200, 'an authorized request must not be blocked');
    assert.ok(res.headers.get('Content-Security-Policy'), 'security headers must still be applied');
    assert.ok(res.headers.get('X-Frame-Options') === 'DENY');
  });
  await check('edge: anonymous POST /api/corporate/login stays reachable (public path)', async () => {
    const res = await edge.middleware(reqPost('/api/corporate/login', {}));
    assert.strictEqual(res.status, 200, 'the sign-in endpoint must remain public');
  });
  await check('edge: anonymous GET /api/corporate/logout stays reachable (expiry escape hatch)', async () => {
    const res = await edge.middleware(reqGet('/api/corporate/logout'));
    assert.strictEqual(res.status, 200, 'logout must be reachable with an expired session');
  });
  await check('edge: cross-origin POST is rejected by the CSRF check (403)', async () => {
    const req = new NextRequest('http://localhost/api/corporate/seller-action', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://evil.example',
        host: 'localhost',
        cookie: `auth_token=${t.corp}`,
      },
      body: JSON.stringify({ sellerId: 's1', action: 'approve' }),
    });
    const res = await edge.middleware(req);
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.ok(/csrf/i.test(body.error));
  });

  // --- K ---------------------------------------------------------------------
  section('[K] Every corporate data route answers anonymous requests with 401');
  const sweep = [
    ['src/app/api/corporate/dashboard/route.ts', 'GET', '/api/corporate/dashboard'],
    ['src/app/api/corporate/finance/route.ts', 'GET', '/api/corporate/finance'],
    ['src/app/api/corporate/orders/route.ts', 'GET', '/api/corporate/orders'],
    ['src/app/api/corporate/customers/route.ts', 'GET', '/api/corporate/customers'],
    ['src/app/api/corporate/products/route.ts', 'GET', '/api/corporate/products'],
    ['src/app/api/corporate/sellers/route.ts', 'GET', '/api/corporate/sellers'],
    ['src/app/api/founder/dashboard/route.ts', 'GET', '/api/founder/dashboard'],
    ['src/app/api/corporate/seller-action/route.ts', 'POST', '/api/corporate/seller-action'],
    ['src/app/api/corporate/product-action/route.ts', 'POST', '/api/corporate/product-action'],
  ];
  for (const [file, verb, url] of sweep) {
    await check(`anonymous ${verb} ${url} -> 401, zero data keys`, async () => {
      const mod = loadTsModule(file, DB_STUBS);
      const req =
        verb === 'GET'
          ? reqGet(url)
          : reqPost(url, { sellerId: 's1', productId: 'p1', action: 'approve', reason: 'x' });
      const res = await mod[verb](req);
      assert.strictEqual(res.status, 401, `expected 401 from ${file}, got ${res.status}`);
      const text = await res.text();
      assert.ok(!/"data"\s*:/.test(text), 'no data payload may be present');
      assert.ok(!/revenue|commission|gmv|lifetime/i.test(text), 'no company figures may be present');
    });
  }
  await check('the same routes reject a valid SELLER session with 403 and no data', async () => {
    for (const [file, verb, url] of sweep) {
      const mod = loadTsModule(file, DB_STUBS);
      const req =
        verb === 'GET'
          ? reqGet(url, t.seller)
          : reqPost(url, { sellerId: 's1', productId: 'p1', action: 'approve' }, t.seller);
      const res = await mod[verb](req);
      assert.strictEqual(res.status, 403, `expected 403 from ${file}, got ${res.status}`);
      const text = await res.text();
      assert.ok(!/"data"\s*:/.test(text), `data leaked from ${file}`);
    }
  });

  // --- Static source invariants ----------------------------------------------
  section('[L] Shipped-source invariants (guards, cookies, no secrets)');
  const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

  await check('edge middleware guards /api/corporate with exactly the three executive roles', () => {
    const m = read('src/middleware.ts');
    assert.ok(
      m.includes("requireRole(request, ['FOUNDER', 'CEO_MD', 'CHAIRMAN'])"),
      'corporate prefix must require the executive role list'
    );
    assert.ok(
      m.includes("requireRole(request, ['FOUNDER'])"),
      '/api/founder must stay FOUNDER-only'
    );
    assert.ok(m.includes('isCorporateLogout'), 'logout exemption must remain explicit');
  });
  await check('public API list exposes login+verify only - never a data route', () => {
    const m = read('src/middleware.ts');
    const list = (m.match(/const publicApiPaths = \[([\s\S]*?)\]/) || [])[1] || '';
    assert.ok(list.includes("'/api/corporate/login'"));
    assert.ok(list.includes("'/api/corporate/verify'"));
    for (const p of ['dashboard', 'finance', 'orders', 'customers', 'products', 'sellers', 'seller-action', 'product-action']) {
      assert.ok(!list.includes(`/api/corporate/${p}`), `${p} must NOT be public`);
    }
    assert.ok(!list.includes("'/api/founder"), 'founder paths must never be public');
  });
  await check('every corporate/founder data route self-guards with requireRole', () => {
    for (const [file] of sweep) {
      const src = read(file);
      assert.ok(/requireRole\s*\(/.test(src), `${file} must call requireRole`);
      assert.ok(/FOUNDER/.test(src), `${file} must restrict to executive roles`);
    }
  });
  await check('seller-action and product-action cannot leak raw Prisma messages', () => {
    for (const file of ['src/app/api/corporate/seller-action/route.ts', 'src/app/api/corporate/product-action/route.ts']) {
      const src = read(file);
      assert.ok(src.includes('classifyDbError'), `${file} must classify DB errors`);
      assert.ok(
        !/detail:\s*error\.message/.test(src) && !/error:\s*error\.message/.test(src),
        `${file} must not echo raw error.message`
      );
      assert.ok(!/error:\s*\$\{/.test(src), `${file} must not interpolate raw errors`);
    }
  });
  await check('login sets HttpOnly cookies and verify revalidates against the DB', () => {
    const loginSrc = read('src/app/api/corporate/login/route.ts');
    assert.ok(loginSrc.includes('httpOnly: true'), 'session cookie must be HttpOnly');
    assert.ok(loginSrc.includes('corporate_auth_token'), 'corporate cookie must be set');
    const verifySrc = read('src/app/api/corporate/verify/route.ts');
    assert.ok(/prisma\.user\.findUnique/.test(verifySrc), 'verify must reload the account');
    assert.ok(verifySrc.includes('isActive'), 'verify must honour the disable flag');
  });
  await check('executives.json carries no credential material', () => {
    const data = JSON.parse(read('src/lib/executives.json'));
    const text = JSON.stringify(data);
    assert.ok(!/"password"/i.test(text), 'no password field may exist');
    assert.ok(!/\$2[aby]\$/.test(text), 'no bcrypt hash may exist');
    assert.ok(!/"(secret|token|apiKey)"/i.test(text), 'no secret field may exist');
  });
  await check('no executive bootstrap password is present in this process environment', () => {
    for (const k of ['EXECUTIVE_FOUNDER_PASSWORD', 'EXECUTIVE_CEO_PASSWORD', 'EXECUTIVE_CHAIRMAN_PASSWORD']) {
      assert.strictEqual(process.env[k], undefined, `${k} must not be set while testing`);
    }
  });

  // --- Summary ---------------------------------------------------------------
  console.log('\n' + '-'.repeat(60));
  console.log(`passed: ${passed}  failed: ${failed}`);
  if (failed > 0) {
    console.log('\nRESULT: FAIL');
    process.exitCode = 1;
  } else {
    console.log('\nRESULT: PASS');
  }
  console.log(
    '\nNOTE: interactive sign-in against the live production database was not run. ' +
    'That path is CREDENTIAL BLOCKED by design: this repository holds no executive ' +
    'credentials and none were fabricated for testing.'
  );
}

main().catch((e) => {
  console.error('SUITE CRASH:', e);
  process.exitCode = 1;
});

