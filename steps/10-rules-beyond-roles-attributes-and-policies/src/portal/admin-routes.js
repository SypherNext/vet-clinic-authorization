// The admin's list of everyone who uses the portal.
import express from 'express';
import { listUsers } from '../users/users.js';

export function adminRoutes(deps) {
  const { db, authorize } = deps;
  const router = express.Router();

  router.get('/admin/users', authorize('users:list'), (req, res) => {
    res.render('admin-users', { users: listUsers(db) });
  });

  return router;
}
