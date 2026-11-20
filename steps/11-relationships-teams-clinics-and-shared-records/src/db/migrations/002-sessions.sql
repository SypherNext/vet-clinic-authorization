-- One row per logged-in browser.
-- id is a SHA-256 hash of the cookie value, so a leaked copy of this table
-- cannot be used to log in. user_id is NULL for a visitor who has not logged
-- in yet (the login form still needs a session for its CSRF token).
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  data TEXT NOT NULL DEFAULT '{}',
  csrf_token TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);
