// Everything the app asks the database about people.
// Each function takes the database as its first argument, so tests can pass
// in a fresh in-memory database.

// email may be null (a form field that did not pass validation): no user then.
export function findUserByEmail(db, email) {
  if (!email) return null;
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) ?? null;
}

// Staff carry the name of the clinic they work at; pet owners have none.
export function findUserById(db, id) {
  return db.prepare(`SELECT u.*, c.name AS clinic_name FROM users u
                     LEFT JOIN clinics c ON c.id = u.clinic_id WHERE u.id = ?`).get(id) ?? null;
}

export function createUser(db, { email, name, role = 'owner', clinicId = null, passwordHash, now }) {
  const result = db.prepare(`INSERT INTO users (email, name, role, clinic_id, password_hash, created_at)
                             VALUES (?, ?, ?, ?, ?, ?)`).run(email, name, role, clinicId, passwordHash, now);
  return findUserById(db, Number(result.lastInsertRowid));
}

// Every vet in the network, not only one clinic: on purpose. A record can be
// shared with a vet at the other clinic for a second opinion, so this is the
// one staff list that clinicScope() does not filter.
export function listVets(db) {
  return db.prepare(`SELECT u.id, u.name, c.name AS clinic_name FROM users u
                     JOIN clinics c ON c.id = u.clinic_id WHERE u.role = 'vet' ORDER BY u.name`).all();
}
