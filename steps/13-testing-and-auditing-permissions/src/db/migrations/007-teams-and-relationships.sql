-- Lesson 11: care teams, and every "who is connected to what" fact as one list.

-- A care team is a group of staff at one clinic who look after some pets.
CREATE TABLE teams (
  id INTEGER PRIMARY KEY,
  clinic_id INTEGER NOT NULL REFERENCES clinics(id),
  name TEXT NOT NULL
);
CREATE TABLE team_members (
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, user_id)
);
ALTER TABLE pets ADD COLUMN care_team_id INTEGER REFERENCES teams(id);

-- Relationship tuples: (subject, relation, object) facts such as
-- ('user:1', 'owner', 'pet:1') = "user 1 is the owner of pet 1".
-- This is a VIEW, not a table: every fact is read from the tables that
-- already hold it, so there is only one copy of each and nothing to keep in
-- sync. src/access/relationships.js answers questions from these facts.
CREATE VIEW relationship_tuples (subject, relation, object) AS
  SELECT 'user:' || id, 'admin', 'clinic:' || clinic_id FROM users WHERE role = 'admin' AND clinic_id IS NOT NULL
  UNION ALL
  SELECT 'user:' || id, 'front_desk', 'clinic:' || clinic_id FROM users WHERE role = 'receptionist' AND clinic_id IS NOT NULL
  UNION ALL
  SELECT 'clinic:' || clinic_id, 'clinic', 'team:' || id FROM teams
  UNION ALL
  SELECT 'user:' || user_id, 'member', 'team:' || team_id FROM team_members
  UNION ALL
  SELECT 'clinic:' || clinic_id, 'clinic', 'pet:' || id FROM pets
  UNION ALL
  SELECT 'user:' || owner_id, 'owner', 'pet:' || id FROM pets
  UNION ALL
  SELECT 'team:' || care_team_id, 'care_team', 'pet:' || id FROM pets WHERE care_team_id IS NOT NULL
  UNION ALL
  SELECT 'pet:' || pet_id, 'pet', 'record:' || id FROM medical_records
  UNION ALL
  SELECT 'user:' || author_id, 'author', 'record:' || id FROM medical_records
  UNION ALL
  SELECT 'user:' || user_id, 'shared_with', 'record:' || record_id FROM record_shares;
