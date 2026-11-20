// The admin's list of everyone who uses the portal.
import express from 'express';
import { listUsers } from '../users/users.js';
import { requireLogin } from '../access/require.js';

export function adminRoutes(deps) {
  const router = express.Router();

  router.get('/admin/users', requireLogin, (req, res) => {
    // A check written straight into the handler, in its own style. The
    // course's lesson 3 explains why this kind of check causes trouble.
    if (req.user.role !== 'admin') return res.status(403).send('Admins only');
    res.render('admin-users', { users: listUsers(deps.db) });
  });

  return router;
}
