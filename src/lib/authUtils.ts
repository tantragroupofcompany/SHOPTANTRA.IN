import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { describeCredentialPlaceholders } from './databaseUrl';

// Hash password with a secure salt using pbkdf2
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Verify a password against a stored hashed value
// Supports both custom pbkdf2 (salt:hash) and bcrypt ($2a$/$2b$) formats
export function verifyPassword(password: string, storedValue: string): boolean {
  if (!storedValue) return false;

  // Check for bcrypt hash format ($2a$... or $2b$...)
  if (storedValue.startsWith('$2a$') || storedValue.startsWith('$2b$')) {
    try {
      return bcrypt.compareSync(password, storedValue);
    } catch (e) {
      console.error('bcrypt verification error:', e);
      return false;
    }
  }

  // Check for custom pbkdf2 format (salt:hash)
  if (storedValue.includes(':')) {
    try {
      const [salt, hash] = storedValue.split(':');
      if (!salt || !hash) return false;
      const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
      return hash === checkHash;
    } catch (e) {
      console.error('pbkdf2 verification error:', e);
      return false;
    }
  }

  // Legacy plaintext fallback
  return password === storedValue;
}

// Hash password using bcrypt (for executive accounts)
export function hashPasswordBcrypt(password: string): string {
  const salt = bcrypt.genSaltSync(12);
  return bcrypt.hashSync(password, salt);
}

// Hash a password-reset token before storing/looking it up.
// Tokens are stored hashed (SHA-256) so a DB leak never reveals usable reset tokens.
export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Coarse, NON-SENSITIVE label for a database failure, safe to expose on health
 * endpoints. Lets an operator tell a misconfigured connection string (e.g. a
 * DATABASE_URL that still carries a template `PROJECT_REF` placeholder, or a
 * rejected password) apart from a code defect — which is exactly what was
 * impossible to see from the outside during the production outage.
 */
export function dbErrorReason(error: any): string {
  if (!error) return 'unknown';
  const code: string | undefined = error?.code;
  const msg: string = error?.message || '';

  // Supabase pooler could not resolve the project/tenant named in the username.
  if (/tenant\/user|no tenant identifier|PROJECT_REF|ENOIDENTIFIER/i.test(msg)) {
    return 'pooler_tenant_unresolved';
  }
  // Postgres rejected the credentials. If the connection string itself still
  // holds a template placeholder where the password belongs, say so — that is a
  // configuration paste problem, NOT a rotated password, and it must not send the
  // operator off to reset a database password that was never wrong.
  if (/28P01|password authentication failed|no pg_hba/i.test(msg) || code === 'P1000') {
    return describeCredentialPlaceholders().password ? 'credentials_placeholder' : 'credentials_rejected';
  }
  // Host/port/DNS/network level failure.
  if (
    code === 'P1001' ||
    code === 'P1002' ||
    code === 'P1003' ||
    code === 'P1008' ||
    /unreachable|refused|ECONNREFUSED|ENOTFOUND|getaddrinfo|ETIMEDOUT|EAI_AGAIN/i.test(msg)
  ) {
    return 'unreachable';
  }
  if (code === 'P2002') return 'duplicate';
  if (code === 'P2025' || code === 'P2003') return 'related_record_missing';
  if (code === 'P2010') return 'query_failed';
  return 'unknown';
}

/**
 * Classify a Prisma/PostgreSQL error so the API can return a safe, useful
 * customer-facing message without ever leaking internal details.
 */
export function classifyDbError(error: any): string | null {
  if (!error) return null;
  const code: string | undefined = error?.code;
  const msg: string = error?.message || '';

  // Datasource / connection problems — these occur when DATABASE_URL is
  // missing, malformed, or the database is unreachable.
  if (
    code === 'P1001' ||
    code === 'P1002' ||
    code === 'P1003' ||
    code === 'P1008' ||
    /datasource/i.test(msg) ||
    /must start with the protocol/i.test(msg) ||
    /connect|unreachable|refused|timeout|database server/i.test(msg)
  ) {
    return 'Our database is temporarily unavailable. Please try again in a few minutes.';
  }

  // Unique-constraint violations
  if (code === 'P2002') {
    if (/email/i.test(msg)) return 'An account with this email address already exists.';
    if (/phone/i.test(msg)) return 'This phone number is already registered to another account.';
    return 'A duplicate account conflict was detected. Please try logging in instead.';
  }

  // Foreign-key violation
  if (code === 'P2025' || code === 'P2003') {
    return 'Registration temporarily unavailable. Related record not found — please try again.';
  }

  // Authentication / privilege failures against the database ITSELF.
  // e.g. Prisma P2010 wrapping PostgreSQL 28P01 ("password authentication
  // failed") from the Supabase pooler, or P1000. This is an outage of the
  // service, never a problem with the caller's own credentials — so it must be
  // reported as unavailable rather than as a wrong password / unknown user.
  if (
    code === 'P2010' ||
    code === 'P1000' ||
    /28P01|28P02|3D000|P2010|P1000/.test(msg) ||
    /authentication failed|password authentication|no pg_hba|does not exist/i.test(msg)
  ) {
    return 'Service is temporarily unavailable while we restore the database connection. Please try again in a few minutes.';
  }

  // Supabase pooler (Supavisor) cannot resolve the project/tenant at all.
  // Seen in production as `FATAL: (ENOTFOUND) tenant/user postgres.PROJECT_REF
  // not found` — i.e. a connection string that still carries a template
  // placeholder instead of the real project ref — and also when the configured
  // region/host is wrong. `(ENOIDENTIFIER) no tenant identifier provided` is the
  // bare-username variant. Treated as an outage: the fix is server-side config.
  if (
    /tenant\/user|no tenant identifier|ENOTFOUND|ENOIDENTIFIER|EAI_AGAIN|ECONNRESET|EPIPE|ETIMEDOUT/i.test(msg) ||
    /DriverAdapterError|driver adapter|Error querying the database/i.test(msg)
  ) {
    return 'Service is temporarily unavailable while we restore the database connection. Please try again in a few minutes.';
  }

  return null;
}