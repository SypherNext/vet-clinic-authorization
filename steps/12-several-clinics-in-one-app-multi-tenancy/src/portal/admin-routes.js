// The admin's list of the people at their clinic.
import express from 'express';
import { useClinic } from '../tenancy/clinic-scope.js';

export function adminRoutes(deps) {
  const { authorize } = deps;
  const router = express.Router();

  router.get('/admin/users', authorize('users:list'), useClinic(deps), (req, res) => {
    res.render('admin-users', { staff: req.clinic.staff(), petOwners: req.clinic.petOwners() });
  });

  return router;
}
