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

// The vets a pet has appointments with: its treating vets. The policy needs
// them to answer "is this your patient?", so the queries below load them
// with the row as a comma-separated list, and withVetIds turns it into numbers.
const TREATING_VETS = '(SELECT group_concat(vet_id) FROM appointments WHERE pet_id = p.id) AS vet_ids';

function withVetIds(row) {
  if (!row) return null;
  return { ...row, vet_ids: row.vet_ids ? row.vet_ids.split(',').map(Number) : [] };
}

export function findPet(db, petId) {
  return withVetIds(db.prepare(`SELECT p.*, o.name AS owner_name, ${TREATING_VETS}
                                FROM pets p JOIN users o ON o.id = p.owner_id
                                WHERE p.id = ?`).get(petId));
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
  return withVetIds(db.prepare(`SELECT r.*, p.name AS pet_name, p.owner_id, u.name AS author_name, ${TREATING_VETS}
                                FROM medical_records r
                                JOIN pets p ON p.id = r.pet_id
                                JOIN users u ON u.id = r.author_id
                                WHERE r.id = ?`).get(recordId));
}
