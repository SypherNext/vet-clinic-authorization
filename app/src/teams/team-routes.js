// The admin's care teams page. Adding a vet to a team gives them every pet
// the team looks after, and their records, at once: no other change needed.
import express from 'express';
import { readId } from '../http/validate.js';
import { HttpError } from '../http/errors.js';
import { setFlash } from '../sessions/sessions.js';
import { teamLoader } from '../portal/loaders.js';
import { vetsAtClinic, addTeamMember, removeTeamMember } from './teams.js';
import { useClinic } from '../tenancy/clinic-scope.js';

const TEAMS_PATH = '/admin/teams';

// Only a vet of the team's own clinic can join it.
function readClinicVet(db, value, team) {
  const vet = vetsAtClinic(db, team.clinic_id).find((v) => v.id === readId(value));
  if (!vet) throw new HttpError(400, 'Not on the clinical staff here', 'Pick a vet or vet nurse who works at this clinic.');
  return vet;
}

export function teamRoutes(deps) {
  const { db, authorize } = deps;
  const router = express.Router();
  const mayManageTeam = authorize('team:manage', teamLoader(db));

  router.get(TEAMS_PATH, authorize('teams:list'), useClinic(deps), (req, res) => {
    res.render('teams', { teams: req.clinic.teams(), vets: req.clinic.vets() });
  });

  router.post(`${TEAMS_PATH}/:teamId/members`, mayManageTeam, (req, res) => {
    const vet = readClinicVet(db, req.body.user_id, req.resource);
    addTeamMember(db, { teamId: req.resource.id, userId: vet.id });
    setFlash(deps, req, res, `${vet.name} joined ${req.resource.name}.`);
    res.redirect(TEAMS_PATH);
  });

  router.post(`${TEAMS_PATH}/:teamId/members/:userId/remove`, mayManageTeam, (req, res) => {
    const vet = readClinicVet(db, req.params.userId, req.resource);
    removeTeamMember(db, { teamId: req.resource.id, userId: vet.id });
    setFlash(deps, req, res, `${vet.name} left ${req.resource.name}.`);
    res.redirect(TEAMS_PATH);
  });

  return router;
}
