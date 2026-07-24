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