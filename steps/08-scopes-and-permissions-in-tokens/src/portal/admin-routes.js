// The admin's list of everyone who uses the portal.
import express from 'express';
import { listUsers } from '../users/users.js';
import { authorize } from '../access/authorize.js';

export function adminRoutes(deps) {
  const router = express.Router();

  router.get('/admin/users', authorize('users:list'), (req, res) => {
    res.render('admin-users', { users: listUsers(deps.db) });
  });

  return router;
}
