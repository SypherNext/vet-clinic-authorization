-- A vet's notes from a visit. These are the most private rows in the app.
CREATE TABLE medical_records (
  id INTEGER PRIMARY KEY,
  pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id),
  written_on TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT NOT NULL
);
CREATE INDEX medical_records_pet ON medical_records(pet_id);
