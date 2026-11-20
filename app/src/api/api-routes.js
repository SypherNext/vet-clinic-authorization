// A small JSON API for scripts and apps, for example a phone app that shows
// an owner their pets. Every route uses the same authorize() and the same
// actions as the matching page, so the API can never be more generous than
// the website.
import express from 'express';
import { bearerAuth } from '../tokens/bearer-auth.js';
import { limitApiRequests } from '../security/rate-limit.js';
import { petLoader, recordLoader } from '../portal/loaders.js';
import { petsForOwner, patientsForVet, appointmentsForPet } from '../portal/portal-data.js';
import { useClinic } from '../tenancy/clinic-scope.js';
import { notFound } from '../http/errors.js';

// Only the fields a client needs. The id lists used by the policy stay inside.
const petJson = ({ id, name, species, breed, born_on }) => ({ id, name, species, breed, born_on });
const recordJson = ({ id, pet_id, pet_name, written_on, title, notes, author_name }) =>
  ({ id, pet_id, pet_name, written_on, title, notes, author: author_name });

export function apiRoutes(deps) {
  const { db, authorize } = deps;
  const router = express.Router();
  router.use(limitApiRequests(deps.rateLimiters), bearerAuth(deps));

  router.get('/pets', authorize('pets:list-own'), (req, res) => {
    res.json({ pets: petsForOwner(db, req.user.id).map(petJson) });
  });

  router.get('/pets/:petId', authorize('pet:view', petLoader(db)), (req, res) => {
    res.json({ pet: petJson(req.resource), appointments: appointmentsForPet(db, req.resource.id) });
  });

  router.get('/records/:recordId', authorize('record:view', recordLoader(db)), (req, res) => {
    res.json({ record: recordJson(req.resource) });
  });

  router.get('/patients', authorize('patients:list'), (req, res) => {
    res.json({ appointments: patientsForVet(db, req.user.id) });
  });

  router.get('/appointments', authorize('appointments:list-all'), useClinic(deps), (req, res) => {
    res.json({ appointments: req.clinic.appointments() });
  });

  router.use(notFound);
  return router;
}
