-- An access list for medical records: one row per person a record is shared
-- with. The vet who wrote the record adds and removes rows on its sharing page.
CREATE TABLE record_shares (
  record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  granted_by INTEGER NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (record_id, user_id)
);
CREATE INDEX record_shares_user ON record_shares(user_id);
