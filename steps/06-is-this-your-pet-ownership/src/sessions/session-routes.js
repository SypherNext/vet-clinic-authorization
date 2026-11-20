// Logging out.
import express from 'express';
import { endSession } from './sessions.js';

export function sessionRoutes(deps) {
  const router = express.Router();

  // POST, not GET: a link or an image on another site must not be able to log you out.
  router.post('/logout', (req, res) => {
    endSession(deps, req, res);
    res.redirect('/login');
  });

  return router;
}
