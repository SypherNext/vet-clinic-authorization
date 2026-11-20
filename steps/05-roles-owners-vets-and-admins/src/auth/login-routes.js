// The login page. Logging out lives in sessions/session-routes.js.
import express from 'express';
import { readEmail, readPassword } from '../http/validate.js';
import { limitAttempts } from '../security/rate-limit.js';
import { startUserSession } from '../sessions/sessions.js';
import { homePathFor } from '../access/roles.js';
import { checkPasswordLogin, LOGIN_FAILED_MESSAGE } from './password-login.js';

export function loginRoutes(deps) {
  const { db, config, rateLimiters } = deps;
  const router = express.Router();

  const renderLogin = (res, { email = '', error = null } = {}) => res.render('login', { email, error });

  router.get('/login', (req, res) => {
    if (req.user) return res.redirect(homePathFor(req.user) ?? '/');
    renderLogin(res);
  });

  router.post('/login', limitAttempts(rateLimiters), async (req, res) => {
    const email = readEmail(req.body.email);
    const password = readPassword(req.body.password, config.passwords) ?? '';
    const result = await checkPasswordLogin(db, { email, password });
    if (result.failure) return renderLogin(res.status(401), { email: req.body.email, error: LOGIN_FAILED_MESSAGE });
    startUserSession(deps, req, res, result.user.id);
    res.redirect(homePathFor(result.user) ?? '/');
  });

  return router;
}
