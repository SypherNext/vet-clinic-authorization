// Gatekeepers for routes. Put one in front of a route to say who may use it.
//   requireLogin          anyone who is logged in
//   requireRole('vet')    only logged-in users with that role
import { sendError } from '../http/errors.js';

// Not logged in: "we do not know who you are", so go to the login page.
// (A form post gets a plain 401 instead of a redirect.)
export function requireLogin(req, res, next) {
  if (req.user) return next();
  if (req.method === 'GET') return res.redirect('/login');
  sendError(req, res, 401, 'Please log in', 'You need to log in first.');
}

// Logged in, wrong role: 403, "we know who you are, and you may not do this".
export function requireRole(...roles) {
  return (req, res, next) => {
    requireLogin(req, res, () => {
      if (roles.includes(req.user.role)) return next();
      sendError(req, res, 403, 'Not allowed', `This page is only for: ${roles.join(', ')}.`);
    });
  };
}
