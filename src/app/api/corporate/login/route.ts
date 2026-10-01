import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyPassword, hashPasswordBcrypt, classifyDbError } from '../../../../lib/authUtils';
import { SignJWT } from 'jose';
import {
  getCorporateRoleDashboard,
  getJwtSecret,
  normalizeCorporateRole,
} from '../../../../lib/corporateAuth';
import { EXECUTIVE_IDENTITIES, isRetiredExecutiveUsername } from '../../../../lib/executives';

/**
 * Executive accounts are NOT hardcoded in this repository.
 *
 * The three executive logins (Founder / CEO & MD / Chairman) are ordinary rows
 * in the `User` table carrying the roles FOUNDER / CEO_MD / CHAIRMAN. Their
 * bootstrap passwords are supplied out-of-band through environment variables so
 * no plaintext credential is ever committed to source control:
 *
 *   EXECUTIVE_FOUNDER_PASSWORD
 *   EXECUTIVE_CEO_PASSWORD
 *   EXECUTIVE_CHAIRMAN_PASSWORD
 *
 * When a variable is absent its account is left completely untouched - it is
 * never created and never reset. That keeps this endpoint idempotent and means
 * a missing env var can never silently overwrite an executive's password.
 *
 * The usernames and role/email triple live in `src/lib/executives.ts`, which is
 * a server-only module: the sign-in form is rendered blank and has no idea which
 * accounts exist.
 */
type ExecutiveSeed = (typeof EXECUTIVE_IDENTITIES)[number];

const EXECUTIVE_SEEDS: readonly ExecutiveSeed[] = EXECUTIVE_IDENTITIES;

/**
 * The ONLY error text returned for a rejected sign-in.
 *
 * It is deliberately identical for an unknown username, a retired username and a
 * wrong password. Previously this endpoint answered "User not found" vs "Wrong
 * password" vs "Access Denied (role: X)", which let anyone enumerate the
 * executive accounts and their roles from the sign-in screen.
 */
const GENERIC_LOGIN_ERROR = {
  error: 'Invalid username or password.',
} as const;

/**
 * Ensures the username column exists on the User table (production fix).
 * Uses raw SQL so it works even if Prisma hasn't run a migration.
 */
async function ensureUsernameColumn() {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT UNIQUE;`
    );
    console.log('✓ Ensured username column exists on User table');
  } catch (e: any) {
    // Column might already exist or table name varies
    console.log('Note: username column check:', e.message);
  }
}

/**
 * Creates or updates the executive accounts, but ONLY for roles whose bootstrap
 * password is present in the environment. Never invents or resets credentials.
 */
async function ensureExecutiveAccounts() {
  await ensureUsernameColumn();

  for (const exec of EXECUTIVE_SEEDS) {
    // No bootstrap password configured for this role -> leave it alone entirely.
    //
    // DIAGNOSIS (this branch caused the production outage): the skip used to be
    // completely silent. With the three EXECUTIVE_*_PASSWORD variables absent
    // from the runtime, every request logged only "rejected wrong password",
    // because the rows kept the inert sentinel from the migration and
    // verifyPassword(allowPlaintext: false) correctly refused them. Nothing
    // anywhere said "the password variable is not set", so the failure looked
    // like a wrong owner password rather than a missing configuration value.
    //
    // The names are logged, never the values.
    const passwordPlain = process.env[exec.passwordEnvKey];
    if (!passwordPlain || passwordPlain.trim().length === 0) {
      console.error(
        `[corporate/login] ${exec.passwordEnvKey} is not set - the ${exec.role} ` +
          `account CANNOT be provisioned and any sign-in for it will fail with ` +
          `the generic 401. Set it in the Vercel Production environment.`
      );
      continue;
    }

    const hashedPw = hashPasswordBcrypt(passwordPlain);

    // Check if an executive account with this role already exists (regardless of username)
    const existingByRole = await prisma.user.findFirst({
      where: { role: exec.role },
    });

    if (existingByRole) {
      // Update with latest username + password if needed.
      // `allowPlaintext: false` is deliberate: a row holding a non-hash sentinel
      // must be treated as "not provisioned" so it is rewritten with a real
      // bcrypt hash rather than being accepted as-is.
      const needsUpdate =
        existingByRole.username !== exec.username ||
        !verifyPassword(passwordPlain, existingByRole.password, { allowPlaintext: false });

      if (needsUpdate) {
        await prisma.user.update({
          where: { id: existingByRole.id },
          data: {
            username: exec.username,
            password: hashedPw,
            fullName: exec.fullName,
          },
        });
        console.log(`✓ Updated ${exec.role} account`);
      }
      continue;
    }

    // Try to find by username (in case column exists but no role match)
    let existingByUsername = null;
    try {
      existingByUsername = await prisma.user.findUnique({
        where: { username: exec.username },
      });
    } catch {
      // username column might not exist yet
    }

    if (existingByUsername) {
      await prisma.user.update({
        where: { id: existingByUsername.id },
        data: {
          password: hashedPw,
          role: exec.role,
          fullName: exec.fullName,
        },
      });
      console.log(`✓ Updated ${exec.role} account (found by username)`);
      continue;
    }

    // Try to find by email
    const existingByEmail = await prisma.user.findUnique({
      where: { email: exec.email },
    });

    if (existingByEmail) {
      await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          username: exec.username,
          password: hashedPw,
          role: exec.role,
          fullName: exec.fullName,
        },
      });
      console.log(`✓ Updated ${exec.role} account (found by email)`);
      continue;
    }

    // Create new executive account
    try {
      await prisma.user.create({
        data: {
          username: exec.username,
          email: exec.email,
          password: hashedPw,
          role: exec.role,
          fullName: exec.fullName,
        },
      });
      console.log(`✓ Created ${exec.role} account`);
    } catch (createErr: any) {
      console.error(`Failed to create ${exec.role}:`, createErr.message);
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    // Ensure additive marketplace schema exists (Seller columns etc.).
    // Best-effort: a database outage must not turn a sign-in attempt into an
    // opaque 500 before the real cause can be classified and reported below.
    try {
      const { ensureSchema } = await import('../../../../lib/dbBootstrap');
      await ensureSchema();
    } catch (schemaErr: any) {
      console.error('[corporate/login] ensureSchema failed:', schemaErr?.code || schemaErr?.message);
    }

    const trimmedUsername = username.toLowerCase().trim();

    // Step 1: Auto-seed executive accounts if they don't exist.
    // Best-effort for the same reason as above — a seeding failure must never
    // mask the real login outcome.
    try {
      await ensureExecutiveAccounts();
    } catch (seedErr: any) {
      console.error('[corporate/login] executive seeding failed:', seedErr?.code || seedErr?.message);
    }

    // Step 2: Find user — try username first, then email as fallback
    let dbUser = null;
    let dbLookupError: any = null;

    // Step 2a: Reject superseded credential generations BEFORE touching the
    // database. The account rows are renamed to the current usernames by
    // provisioning, so these no longer match any row, but checking up front makes
    // the rejection independent of database state and costs no query.
    if (isRetiredExecutiveUsername(trimmedUsername)) {
      console.warn('[corporate/login] rejected retired executive username');
      return NextResponse.json(GENERIC_LOGIN_ERROR, { status: 401 });
    }

    try {
      dbUser = await prisma.user.findUnique({
        where: { username: trimmedUsername },
      });
    } catch (lookupErr) {
      dbLookupError = dbLookupError || lookupErr;
      // username column may not exist in production yet — fall back
    }

    if (!dbUser) {
      try {
        dbUser = await prisma.user.findUnique({
          where: { email: trimmedUsername },
        });
      } catch (lookupErr) {
        // email lookup failed
        dbLookupError = dbLookupError || lookupErr;
      }
    }

    if (!dbUser) {
      // A database/connection failure must never masquerade as a credential
      // rejection — that is exactly what made a real outage look like missing
      // executive accounts. Only a genuinely reachable database produces the
      // generic 401 below.
      const classified = dbLookupError ? classifyDbError(dbLookupError) : null;
      if (classified) {
        console.error('[corporate/login] DB error:', dbLookupError?.code || dbLookupError?.message);
        return NextResponse.json(
          {
            error: 'Sign-in is temporarily unavailable',
            detail: 'Our database is unreachable right now. Please try again in a few minutes.',
          },
          { status: 503 }
        );
      }

      console.warn('[corporate/login] rejected unknown username');
      return NextResponse.json(GENERIC_LOGIN_ERROR, { status: 401 });
    }

    // Step 3: Verify the password. `allowPlaintext: false` is mandatory here:
    // an executive row must hold a real bcrypt hash. Without it, a row whose
    // password column contains a non-hash sentinel or legacy plaintext would be
    // matched by string equality, i.e. readable straight out of the database.
    let passwordValid = false;
    try {
      passwordValid = verifyPassword(password, dbUser.password, { allowPlaintext: false });
    } catch {
      // A verification failure is a failed sign-in, never a server error: it must
      // not disclose whether the underlying cause was a malformed hash.
      passwordValid = false;
    }

    if (!passwordValid) {
      // Same generic text as an unknown username: the response must not reveal
      // that the account exists.
      console.warn('[corporate/login] rejected wrong password');
      return NextResponse.json(GENERIC_LOGIN_ERROR, { status: 401 });
    }

    // Step 4: Verify corporate role. CORPORATE_ROLES in lib/corporateAuth.ts is
    // the single source of truth; the legacy 'ceo' / 'md' spellings collapse to
    // the one stored role 'CEO_MD'.
    const corporateRole = normalizeCorporateRole(dbUser.role);
    if (!corporateRole) {
      // A valid, authenticated non-executive account reached the executive door.
      // This is a 403 (authenticated but not authorised), which is the correct
      // status, but the body stays generic so the stored role is not disclosed.
      console.warn(`[corporate/login] rejected non-executive account`);
      return NextResponse.json(
        { error: 'Access Denied', detail: 'This account does not have executive privileges.' },
        { status: 403 }
      );
    }

    // Step 5: Create session JWT.
    //
    // REMEMBER ME
    // -----------
    // "Remember me" is implemented ENTIRELY on the server, by lengthening the
    // lifetime of the HttpOnly cookie. The client never sees, stores or
    // re-sends the password: there is no localStorage write, no sessionStorage
    // write and no non-HttpOnly cookie. Remembering is therefore a property of
    // the already-issued session token, not a saved credential.
    //
    // The `remember` flag is attacker-controllable, so it is only allowed to
    // EXTEND a session to the fixed 30-day maximum. It can never shorten a
    // session below the 8-hour baseline and it carries no authority of its own.
    const SESSION_SECONDS = 8 * 60 * 60; // 8 hours - baseline
    const REMEMBER_ME_SECONDS = 30 * 24 * 60 * 60; // 30 days - explicit opt-in
    const requestedRemember = body.remember === true;
    const sessionSeconds = requestedRemember
      ? Math.max(SESSION_SECONDS, REMEMBER_ME_SECONDS)
      : SESSION_SECONDS;

    const secret = getJwtSecret();
    const token = await new SignJWT({
      userId: dbUser.id,
      email: dbUser.email,
      username: dbUser.username || trimmedUsername,
      role: corporateRole,
      type: 'corporate',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(`${sessionSeconds}s`)
      .sign(secret);

    // Step 6: Land each executive on their own dashboard.
    const redirectTo = getCorporateRoleDashboard(corporateRole);

    const response = NextResponse.json({
      success: true,
      redirectTo,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        username: dbUser.username || null,
        role: corporateRole,
        fullName: dbUser.fullName,
      },
    });

    // Step 7: Set secure HTTP-only cookies.
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: sessionSeconds,
      path: '/',
    };

    response.cookies.set('corporate_auth_token', token, cookieOptions);
    response.cookies.set('auth_token', token, cookieOptions);

    console.log(`✓ ${corporateRole} login successful (remember=${requestedRemember})`);
    return response;
  } catch (error: any) {
    // Classify known DB / Prisma errors so an outage is reported as such instead
    // of an opaque "Login failed" that looks like a credential problem.
    const classified = classifyDbError(error);
    if (classified) {
      console.error('[corporate/login] DB error:', error?.code || error?.message);
      return NextResponse.json(
        {
          error: 'Sign-in is temporarily unavailable',
          detail: 'Our database is unreachable right now. Please try again in a few minutes.',
        },
        { status: 503 }
      );
    }

    console.error('Corporate login error:', error);
    return NextResponse.json({
      error: 'Login failed',
      detail: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred.',
    }, { status: 500 });
  }
}