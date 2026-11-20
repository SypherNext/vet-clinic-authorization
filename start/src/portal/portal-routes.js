// The clinic pages: a pet owner's pets, a vet's patients, one pet, one record.
//
// THE STARTING POINT, ON PURPOSE: the permission checks here are scattered
// and incomplete. /pets/:petId and /records/:recordId only ask "is anyone
// logged in?", so any logged-in user can read any pet's medical notes by
// changing the number in the address. Lessons 2 and 3 of the course show
// the problem and move every check into one place.
import express from 'express';
import { petsForOwner, patientsForVet, findPet, appointmentsForPet, recordsForPet, findRecord } from './portal-data.js';
import { requireLogin, requireRole } from '../access/require.js';
import { homePathFor } from '../access/home.js';
import { HttpError } from '../http/errors.js';

export function portalRoutes(deps) {
  const { db } = deps;
  const router = express.Router();

  router.get('/', (req, res) => {
    if (req.user) return res.redirect(homePathFor(req.user));
    res.render('home');
  });

  router.get('/pets', requireRole('owner'), (req, res) => {
    res.render('pets', { pets: petsForOwner(db, req.user.id) });
  });

  router.get('/patients', requireRole('vet'), (req, res) => {
    res.render('patients', { patients: patientsForVet(db, req.user.id) });
  });

  router.get('/pets/:petId', requireLogin, (req, res) => {
    const pet = findPet(db, Number(req.params.petId));
    if (!pet) throw new HttpError(404, 'Not found', 'There is no pet with that number.');
    res.render('pet', { pet, appointments: appointmentsForPet(db, pet.id), records: recordsForPet(db, pet.id) });
  });

  router.get('/records/:recordId', requireLogin, (req, res) => {
    const record = findRecord(db, Number(req.params.recordId));
    if (!record) throw new HttpError(404, 'Not found', 'There is no record with that number.');
    res.render('record', { record });
  });

  return router;
}
