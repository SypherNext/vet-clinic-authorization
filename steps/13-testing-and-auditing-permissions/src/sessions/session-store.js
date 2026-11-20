// Reads and writes the sessions table. Nothing here knows about cookies or
// requests; sessions.js handles that.
//
// The browser holds a random token. The table holds only its SHA-256 hash,
// so someone who copies the database still cannot log in as anyone.
import { randomToken, hashToken } from '../security/tokens.js';

function toSession(row) {
  return {
    id: row.id,
    userId: row.user_id,
    data: JSON.parse(row.data),
    csrfToken: row.csrf_token,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
  };
}

export function createSession(db, { userId, now }) {
  const token = randomToken();
  const row = {
    id: hashToken(token),
    user_id: userId,
    data: '{}',
    csrf_token: randomToken(),
    created_at: now,
    last_seen_at: now,
  };
  db.prepare(`INSERT INTO sessions (id, user_id, data, csrf_token, created_at, last_seen_at)
              VALUES (:id, :user_id, :data, :csrf_token, :created_at, :last_seen_at)`).run(row);
  return { token, session: toSession(row) };
}

export function findSessionByToken(db, token) {
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(hashToken(token));
  return row ? toSession(row) : null;
}

export function touchSession(db, sessionId, now) {
  db.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').run(now, sessionId);
}

export function saveSessionData(db, sessionId, data) {
  db.prepare('UPDATE sessions SET data = ? WHERE id = ?').run(JSON.stringify(data), sessionId);
}

export function deleteSession(db, sessionId) {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

// Logs a user out everywhere, optionally keeping the session they are using now.
export function deleteUserSessions(db, userId, { exceptSessionId = null } = {}) {
  return db.prepare('DELETE FROM sessions WHERE user_id = ? AND id IS NOT ?').run(userId, exceptSessionId).changes;
}

export function listUserSessions(db, userId) {
  return db.prepare('SELECT id, created_at, last_seen_at FROM sessions WHERE user_id = ? ORDER BY last_seen_at DESC')
    .all(userId);
}
