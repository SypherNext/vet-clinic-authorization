-- Lesson 10: the portal now serves more than one clinic.
CREATE TABLE clinics (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Staff work at one clinic. Pet owners have no clinic (NULL): their pets do.
ALTER TABLE users ADD COLUMN clinic_id INTEGER REFERENCES clinics(id);
-- The clinic a pet is registered at.
ALTER TABLE pets ADD COLUMN clinic_id INTEGER REFERENCES clinics(id);
CREATE INDEX users_clinic ON users(clinic_id);
CREATE INDEX pets_clinic ON pets(clinic_id);

-- A vet asks a specialist, often at another clinic, to look at a pet.
-- starts_on and ends_on are dates such as 2026-11-01. The specialist may see
-- the pet and its records only between those dates.
CREATE TABLE referrals (
  id INTEGER PRIMARY KEY,
  pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  from_vet_id INTEGER NOT NULL REFERENCES users(id),
  to_vet_id INTEGER NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  starts_on TEXT NOT NULL,
  ends_on TEXT NOT NULL
);
CREATE INDEX referrals_pet ON referrals(pet_id);
CREATE INDEX referrals_to_vet ON referrals(to_vet_id);
