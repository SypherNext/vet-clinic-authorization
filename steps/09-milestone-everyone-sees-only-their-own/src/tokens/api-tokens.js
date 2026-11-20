// Reads and writes API tokens. The token itself is shown to its owner once,
// when it is made; after that only its hash exists, like a password.
import { randomToken, hashToken } from '../security/tokens.js';

// The prefix makes a leaked token easy to recognise in logs and code scans.
const TOKEN_PREFIX = 'vcp_';

function toApiToken(row) {
  return { ...row, scopes: row.scopes.split(' ') };
}

export function createApiToken(db, { userId, name, scopes, now, lifetimeMs }) {
  const token = TOKEN_PREFIX + randomToken();
  db.prepare(`INSERT INTO api_tokens (user_id, name, token_hash, scopes, created_at, expires_at)
              VALUES (?, ?, ?, ?, ?, ?)`).run(userId, name, hashToken(token), scopes.join(' '), now, now + lifetimeMs);
  return token;
}

// The token row for a value sent by a client, or null if it is unknown or expired.
export function findLiveApiToken(db, token, now) {
  if (!token?.startsWith(TOKEN_PREFIX)) return null;
  const row = db.prepare('SELECT * FROM api_tokens WHERE token_hash = ?').get(hashToken(token));
  if (!row || row.expires_at <= now) return null;
  return toApiToken(row);
}

export function markApiTokenUsed(db, tokenId, now) {
  db.prepare('UPDATE api_tokens SET last_used_at = ? WHERE id = ?').run(now, tokenId);
}

export function listApiTokens(db, userId) {
  return db.prepare('SELECT * FROM api_tokens WHERE user_id = ? ORDER BY created_at DESC, id DESC')
    .all(userId).map(toApiToken);
}

export function countApiTokens(db, userId) {
  return db.prepare('SELECT COUNT(*) AS count FROM api_tokens WHERE user_id = ?').get(userId).count;
}

// Only the token's own user can revoke it: the WHERE clause checks both.
export function revokeApiToken(db, { tokenId, userId }) {
  return db.prepare('DELETE FROM api_tokens WHERE id = ? AND user_id = ?').run(tokenId, userId).changes === 1;
}
