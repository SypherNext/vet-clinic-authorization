-- Lesson 13: an audit log of permission decisions.
-- object is a row such as 'record:3', or NULL for a page that lists things.
-- via says whether the request came from a page or the API (with a token).
-- clinic_id decides which clinic's admins may read the entry.
CREATE TABLE permission_decisions (
  id INTEGER PRIMARY KEY,
  created_at INTEGER NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  object TEXT,
  allowed INTEGER NOT NULL,
  reason TEXT NOT NULL,
  via TEXT NOT NULL CHECK (via IN ('page', 'api')),
  clinic_id INTEGER REFERENCES clinics(id)
);
CREATE INDEX permission_decisions_clinic ON permission_decisions(clinic_id, created_at);
