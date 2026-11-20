// Random secrets and their hashes, used by sessions and CSRF tokens. All randomness comes from node:crypto, never Math.random().
import crypto from 'node:crypto';

const TOKEN_BYTES = 32; // 256 bits: far too many to guess

export function randomToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString('base64url');
}

// A fast hash is fine here because the token is long and random.
// (Passwords are different: people pick guessable ones, so they get argon2id.)
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('base64url');
}

// Compares two strings in constant time, so the time taken does not reveal
// how many characters matched.
export function sameSecret(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
