// Fills the database with fake people, pets, appointments and medical records.
// Run it with `npm run seed`. It deletes the old database file first,
// so you always start from the same known state.
//
// Every person here is made up. The .test domain is reserved for testing
// and can never receive real email. The passwords are printed in the README
// on purpose: they only exist on your computer.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { loadConfig } from '../config.js';
import { openDatabase } from './database.js';
import { createUser } from '../users/users.js';
import { dateDaysFrom } from '../clock.js';
import { hashPassword } from '../auth/password-hashing.js';

const MAPLE = 'Maple Street Vet Clinic';
const RIVERSIDE = 'Riverside Animal Hospital';
const CLINICS = [MAPLE, RIVERSIDE];

// Staff have a clinic; pet owners do not.
export const SEED_USERS = [
  { email: 'olivia@vetclinic.test', name: 'Olivia Park', role: 'owner', password: 'biscuit and mango love naps' },
  { email: 'ben@vetclinic.test', name: 'Ben Okafor', role: 'owner', password: 'pepper the rabbit hops daily' },
  { email: 'noah@vetclinic.test', name: 'Noah Williams', role: 'owner', password: 'luna chases every red ball' },
  { email: 'sam@vetclinic.test', name: 'Dr. Sam Rivera', role: 'vet', clinic: MAPLE, password: 'stethoscope on a rainy tuesday' },
  { email: 'lee@vetclinic.test', name: 'Dr. Lee Chen', role: 'vet', clinic: MAPLE, password: 'x-rays before lunch, always' },
  { email: 'rosa@vetclinic.test', name: 'Rosa Diaz', role: 'receptionist', clinic: MAPLE, password: 'the appointment book never sleeps' },
  { email: 'admin@vetclinic.test', name: 'Alex Morgan', role: 'admin', clinic: MAPLE, password: 'the front desk keeps the keys' },
  { email: 'priya@vetclinic.test', name: 'Dr. Priya Shah', role: 'vet', clinic: RIVERSIDE, password: 'skin and coat specialist on call' },
  { email: 'jordan@vetclinic.test', name: 'Jordan Blake', role: 'admin', clinic: RIVERSIDE, password: 'riverside keys on a blue lanyard' },
];

const PETS = [
  { owner: 'olivia@vetclinic.test', clinic: MAPLE, name: 'Biscuit', species: 'Dog', breed: 'Beagle', born_on: '2021-04-02' },
  { owner: 'olivia@vetclinic.test', clinic: MAPLE, name: 'Mango', species: 'Cat', breed: 'Tabby', born_on: '2019-08-15' },
  { owner: 'ben@vetclinic.test', clinic: MAPLE, name: 'Pepper', species: 'Rabbit', breed: 'Holland Lop', born_on: '2023-01-20' },
  { owner: 'noah@vetclinic.test', clinic: RIVERSIDE, name: 'Luna', species: 'Dog', breed: 'Labrador', born_on: '2022-06-30' },
];

const APPOINTMENTS = [
  { pet: 'Biscuit', vet: 'sam@vetclinic.test', starts_at: '2026-11-12 10:00', reason: 'Yearly check-up and vaccines' },
  { pet: 'Mango', vet: 'sam@vetclinic.test', starts_at: '2026-11-19 14:30', reason: 'Dental cleaning' },
  { pet: 'Pepper', vet: 'lee@vetclinic.test', starts_at: '2026-11-14 09:15', reason: 'Nail trim and weight check' },
  { pet: 'Luna', vet: 'priya@vetclinic.test', starts_at: '2026-11-13 11:00', reason: 'Allergy follow-up' },
];

const RECORDS = [
  { pet: 'Biscuit', author: 'sam@vetclinic.test', written_on: '2026-05-12', title: 'Yearly check-up',
    notes: 'Weight 14.2 kg. Rabies and DHPP vaccines given. Heart and lungs normal.' },
  { pet: 'Mango', author: 'sam@vetclinic.test', written_on: '2026-08-03', title: 'Dental exam',
    notes: 'Mild tartar on two back teeth. Cleaning booked for November.' },
  { pet: 'Pepper', author: 'lee@vetclinic.test', written_on: '2026-09-21', title: 'Limping on back left leg',
    notes: 'X-ray clear, no fracture. Two weeks of rest, then a recheck if still limping.' },
  { pet: 'Luna', author: 'priya@vetclinic.test', written_on: '2026-10-02', title: 'Itchy skin',
    notes: 'Red patches on both front paws. Food allergy suspected; eight-week diet trial started.' },
];

// Dates are counted from the day you seed, so the demo always has one
// referral that is running now and one that has ended.
const REFERRALS = [
  { pet: 'Biscuit', from: 'sam@vetclinic.test', to: 'priya@vetclinic.test', reason: 'Rash on the belly: skin specialist opinion',
    startsInDays: -4, endsInDays: 25 },
  { pet: 'Mango', from: 'sam@vetclinic.test', to: 'priya@vetclinic.test', reason: 'Hair loss on the tail',
    startsInDays: -60, endsInDays: -30 },
];

export async function seedDatabase(db, { now = Date.now() } = {}) {
  const addClinic = db.prepare('INSERT INTO clinics (name) VALUES (?)');
  const clinicIds = {};
  for (const name of CLINICS) clinicIds[name] = Number(addClinic.run(name).lastInsertRowid);
  const userIds = {};
  for (const u of SEED_USERS) {
    const clinicId = u.clinic ? clinicIds[u.clinic] : null;
    const user = createUser(db, { ...u, clinicId, passwordHash: await hashPassword(u.password), now });
    userIds[u.email] = user.id;
  }
  const addPet = db.prepare('INSERT INTO pets (owner_id, clinic_id, name, species, breed, born_on) VALUES (?, ?, ?, ?, ?, ?)');
  const petIds = {};
  for (const p of PETS) {
    petIds[p.name] = Number(addPet.run(userIds[p.owner], clinicIds[p.clinic], p.name, p.species, p.breed, p.born_on).lastInsertRowid);
  }
  const addAppointment = db.prepare('INSERT INTO appointments (pet_id, vet_id, starts_at, reason) VALUES (?, ?, ?, ?)');
  for (const a of APPOINTMENTS) addAppointment.run(petIds[a.pet], userIds[a.vet], a.starts_at, a.reason);
  const addRecord = db.prepare('INSERT INTO medical_records (pet_id, author_id, written_on, title, notes) VALUES (?, ?, ?, ?, ?)');
  for (const r of RECORDS) addRecord.run(petIds[r.pet], userIds[r.author], r.written_on, r.title, r.notes);
  const addReferral = db.prepare(`INSERT INTO referrals (pet_id, from_vet_id, to_vet_id, reason, starts_on, ends_on)
                                  VALUES (?, ?, ?, ?, ?, ?)`);
  for (const r of REFERRALS) {
    addReferral.run(petIds[r.pet], userIds[r.from], userIds[r.to], r.reason,
      dateDaysFrom(now, r.startsInDays), dateDaysFrom(now, r.endsInDays));
  }
}

// Runs only when you call `node src/db/seed.js` directly, not when a test imports this file.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { databaseFile } = loadConfig();
  for (const suffix of ['', '-wal', '-shm']) fs.rmSync(databaseFile + suffix, { force: true });
  const db = openDatabase(databaseFile);
  await seedDatabase(db);
  db.close();
  console.log(`Seeded ${CLINICS.length} clinics, ${SEED_USERS.length} users, ${PETS.length} pets, ${APPOINTMENTS.length} appointments, `
    + `${RECORDS.length} medical records and ${REFERRALS.length} referrals into ${databaseFile}`);
}
