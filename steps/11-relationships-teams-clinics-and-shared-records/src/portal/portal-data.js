// Database queries for the clinic pages.

const APPOINTMENT_COLUMNS = `
  a.id, a.pet_id, a.starts_at, a.reason, p.name AS pet_name, p.species,
  o.name AS owner_name, v.name AS vet_name`;
const APPOINTMENT_JOINS = `
  FROM appointments a
  JOIN pets p ON p.id = a.pet_id
  JOIN users o ON o.id = p.owner_id
  JOIN users v ON v.id = a.vet_id`;

export function petsForOwner(db, ownerId) {
  return db.prepare('SELECT * FROM pets WHERE owner_id = ? ORDER BY name').all(ownerId);
}

export function patientsForVet(db, vetId) {
  return db.prepare(`SELECT ${APPOINTMENT_COLUMNS} ${APPOINTMENT_JOINS}
                     WHERE a.vet_id = ? ORDER BY a.starts_at`).all(vetId);
}

export function allAppointments(db) {
  return db.prepare(`SELECT ${APPOINTMENT_COLUMNS} ${APPOINTMENT_JOINS} ORDER BY a.starts_at`).all();
}

// The policy reads who is connected to a row from the relationship model
// (src/access/relationships.js). What it still needs on the row itself is
// the pet's referrals, for the date rule. They are loaded as JSON text
// (json_group_array), and withLists turns them back into an array.
const REFERRALS = `(SELECT json_group_array(json_object('to_vet_id', to_vet_id, 'starts_on', starts_on, 'ends_on', ends_on))
                    FROM referrals WHERE pet_id = p.id) AS referrals`;

function withLists(row, columns) {
  if (!row) return null;
  const lists = Object.fromEntries(columns.map((column) => [column, JSON.parse(row[column])]));
  return { ...row, ...lists };
}

export function findPet(db, petId) {
  return withLists(db.prepare(`SELECT p.*, o.name AS owner_name, c.name AS clinic_name, ${REFERRALS}
                               FROM pets p
                               JOIN users o ON o.id = p.owner_id
                               JOIN clinics c ON c.id = p.clinic_id
                               WHERE p.id = ?`).get(petId), ['referrals']);
}

export function appointmentsForPet(db, petId) {
  return db.prepare(`SELECT ${APPOINTMENT_COLUMNS} ${APPOINTMENT_JOINS}
                     WHERE a.pet_id = ? ORDER BY a.starts_at`).all(petId);
}

export function recordsForPet(db, petId) {
  return db.prepare(`SELECT r.id, r.written_on, r.title, u.name AS author_name
                     FROM medical_records r JOIN users u ON u.id = r.author_id
                     WHERE r.pet_id = ? ORDER BY r.written_on DESC`).all(petId);
}

export function findRecord(db, recordId) {
  return withLists(db.prepare(`SELECT r.*, p.name AS pet_name, p.owner_id, p.clinic_id, u.name AS author_name, ${REFERRALS}
                               FROM medical_records r
                               JOIN pets p ON p.id = r.pet_id
                               JOIN users u ON u.id = r.author_id
                               WHERE r.id = ?`).get(recordId), ['referrals']);
}
