// "My care team": the pets looked after by the teams you are on. Vets and
// vet nurses use it as their list of pets to watch.
import express from 'express';
import { petsOfTeamsOf } from './teams.js';

export function careTeamRoutes(deps) {
  const { db, authorize } = deps;
  const router = express.Router();

  router.get('/care-team', authorize('care-team:list'), (req, res) => {
    res.render('care-team', { pets: petsOfTeamsOf(db, req.user.id) });
  });

  return router;
}
