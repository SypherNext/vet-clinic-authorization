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

// The policy needs to know who is connected to a row: the vets the pet has
// appointments with (its treating vets) and, for a record, the people it was
// shared with. The queries load each list as comma-separated text, and
// withIdLists turns the text into arrays of numbers.
const TREATING_VETS = '(SELECT group_concat(vet_id) FROM appointments WHERE pet_id = p.id) AS vet_ids';
const SHARED_WITH = '(SELECT group_concat(user_id) FROM record_shares WHERE record_id = r.id) AS shared_with';

const toIds = (text) => (text ? text.split(',').map(Number) : []);

function withIdLists(row, columns) {
  if (!row) return null;
  const lists = Object.fromEntries(columns.map((column) => [column, toIds(row[column])]));
  return { ...row, ...lists };
}

export function findPet(db, petId) {
  return withIdLists(db.prepare(`SELECT p.*, o.name AS owner_name, ${TREATING_VETS}
                                 FROM pets p JOIN users o ON o.id = p.owner_id
                                 WHERE p.id = ?`).get(petId), ['vet_ids']);
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
  return withIdLists(db.prepare(`SELECT r.*, p.name AS pet_name, p.owner_id, u.name AS author_name,
                                        ${TREATING_VETS}, ${SHARED_WITH}
                                 FROM medical_records r
                                 JOIN pets p ON p.id = r.pet_id
                                 JOIN users u ON u.id = r.author_id
                                 WHERE r.id = ?`).get(recordId), ['vet_ids', 'shared_with']);
}
