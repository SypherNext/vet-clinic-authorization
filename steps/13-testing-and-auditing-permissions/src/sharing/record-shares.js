// Reads and writes a record's access list (the record_shares table).

export function listShares(db, recordId) {
  return db.prepare(`SELECT s.user_id, u.name, s.created_at, g.name AS granted_by_name
                     FROM record_shares s
                     JOIN users u ON u.id = s.user_id
                     JOIN users g ON g.id = s.granted_by
                     WHERE s.record_id = ? ORDER BY u.name`).all(recordId);
}

// Sharing twice with the same person changes nothing.
export function shareRecord(db, { recordId, userId, grantedBy, now }) {
  db.prepare(`INSERT INTO record_shares (record_id, user_id, granted_by, created_at)
              VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING`).run(recordId, userId, grantedBy, now);
}

export function unshareRecord(db, { recordId, userId }) {
  db.prepare('DELETE FROM record_shares WHERE record_id = ? AND user_id = ?').run(recordId, userId);
}
