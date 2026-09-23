import crypto from 'crypto';
import bcrypt from 'bcryptjs';

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
    return 'Registration is temporarily unavailable. Our team has been notified. Please try again in a few minutes.';
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

  return null;
}