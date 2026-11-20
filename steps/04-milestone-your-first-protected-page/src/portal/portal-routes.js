// The clinic pages: a pet owner's pets, a vet's patients, one pet, one record.
// Each route names the action it needs; policy.js decides who may do it.
import express from 'express';
import { petsForOwner, patientsForVet, appointmentsForPet, recordsForPet } from './portal-data.js';
import { petLoader, recordLoader } from './loaders.js';
import { authorize } from '../access/authorize.js';
import { homePathFor } from '../access/home.js';

export function portalRoutes(deps) {
  const { db } = deps;
  const router = express.Router();
  const loadPet = petLoader(db);
  const loadRecord = recordLoader(db);

  router.get('/', (req, res) => {
    if (req.user) return res.redirect(homePathFor(req.user));
    res.render('home');
  });

  router.get('/pets', authorize('pets:list-own'), (req, res) => {
    res.render('pets', { pets: petsForOwner(db, req.user.id) });
  });

  router.get('/patients', authorize('patients:list'), (req, res) => {
    res.render('patients', { patients: patientsForVet(db, req.user.id) });
  });

  router.get('/pets/:petId', authorize('pet:view', loadPet), (req, res) => {
    const pet = req.resource;
    res.render('pet', { pet, appointments: appointmentsForPet(db, pet.id), records: recordsForPet(db, pet.id) });
  });

  router.get('/records/:recordId', authorize('record:view', loadRecord), (req, res) => {
    res.render('record', { record: req.resource });
  });

  return router;
}
