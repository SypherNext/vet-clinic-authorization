-- Personal API tokens: a script sends one in the Authorization header instead
-- of logging in. Only a SHA-256 hash of the token is stored. scopes is a
-- space-separated list such as "pets:read records:read".
CREATE TABLE api_tokens (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  scopes TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  last_used_at INTEGER
);
CREATE INDEX api_tokens_user ON api_tokens(user_id);
