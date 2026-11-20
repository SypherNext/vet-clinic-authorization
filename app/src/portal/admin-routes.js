// The admin's pages: the people at their clinic, the audit log and the roles.
import express from 'express';
import { useClinic } from '../tenancy/clinic-scope.js';
import { ROLES, allActions } from '../access/roles.js';

export function adminRoutes(deps) {
  const { authorize } = deps;
  const router = express.Router();

  router.get('/admin/users', authorize('users:list'), useClinic(deps), (req, res) => {
    res.render('admin-users', { staff: req.clinic.staff(), petOwners: req.clinic.petOwners() });
  });

  router.get('/admin/audit', authorize('audit:view'), useClinic(deps), (req, res) => {
    res.render('audit', { decisions: req.clinic.decisions() });
  });

  router.get('/admin/roles', authorize('roles:view'), (req, res) => {
    res.render('roles', { roles: Object.values(ROLES), actions: allActions() });
  });

  return router;
}
