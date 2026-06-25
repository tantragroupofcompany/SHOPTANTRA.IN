import crypto from 'crypto';

// Hash password with a secure salt using pbkdf2
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Verify a password against a stored hashed value
export function verifyPassword(password: string, storedValue: string): boolean {
  if (!storedValue) return false;
  // If storedValue is not a hashed format (salt:hash), treat as plain text for legacy compatibility (if any)
  if (!storedValue.includes(':')) {
    return password === storedValue;
  }
  const [salt, hash] = storedValue.split(':');
  const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === checkHash;
}
