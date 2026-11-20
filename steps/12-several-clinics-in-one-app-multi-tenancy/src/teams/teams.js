// Reads and writes care teams and their members.

export function findTeam(db, teamId) {
  return db.prepare(`SELECT t.*, c.name AS clinic_name FROM teams t
                     JOIN clinics c ON c.id = t.clinic_id WHERE t.id = ?`).get(teamId) ?? null;
}

// The teams of one clinic, each with its members and its pets.
export function teamsAtClinic(db, clinicId) {
  const members = db.prepare(`SELECT u.id, u.name FROM team_members m JOIN users u ON u.id = m.user_id
                              WHERE m.team_id = ? ORDER BY u.name`);
  const pets = db.prepare('SELECT id, name FROM pets WHERE care_team_id = ? ORDER BY name');
  return db.prepare('SELECT * FROM teams WHERE clinic_id = ? ORDER BY name').all(clinicId)
    .map((team) => ({ ...team, members: members.all(team.id), pets: pets.all(team.id) }));
}

// The vets who can join a team: vets of the team's own clinic.
export function vetsAtClinic(db, clinicId) {
  return db.prepare("SELECT id, name FROM users WHERE role = 'vet' AND clinic_id = ? ORDER BY name").all(clinicId);
}

export function addTeamMember(db, { teamId, userId }) {
  db.prepare('INSERT INTO team_members (team_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING').run(teamId, userId);
}

export function removeTeamMember(db, { teamId, userId }) {
  db.prepare('DELETE FROM team_members WHERE team_id = ? AND user_id = ?').run(teamId, userId);
}
