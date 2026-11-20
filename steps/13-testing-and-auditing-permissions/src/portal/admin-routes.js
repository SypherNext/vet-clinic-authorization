// The admin's pages: the people at their clinic and the audit log.
import express from 'express';
import { useClinic } from '../tenancy/clinic-scope.js';

export function adminRoutes(deps) {
  const { authorize } = deps;
  const router = express.Router();

  router.get('/admin/users', authorize('users:list'), useClinic(deps), (req, res) => {
    res.render('admin-users', { staff: req.clinic.staff(), petOwners: req.clinic.petOwners() });
  });

  router.get('/admin/audit', authorize('audit:view'), useClinic(deps), (req, res) => {
    res.render('audit', { decisions: req.clinic.decisions() });
  });

  return router;
}
