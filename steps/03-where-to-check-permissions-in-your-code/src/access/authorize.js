// The one gatekeeper every protected route uses.
//
//   authorize('users:list')               an action that needs no particular row
//   authorize('record:view', loadRecord)  load the row first, then check it
//
// The route says WHAT it needs. The rules for WHO may do it live in policy.js.
import { can } from './policy.js';
import { sendError } from '../http/errors.js';

const noResource = () => null;

// Not logged in: "we do not know who you are", so go to the login page.
// (A form post gets a plain 401 instead of a redirect.)
function askToLogIn(req, res) {
  if (req.method === 'GET') return res.redirect('/login');
  sendError(req, res, 401, 'Please log in', 'You need to log in first.');
}

export function authorize(action, loadResource = noResource) {
  return (req, res, next) => {
    if (!req.user) return askToLogIn(req, res);
    // The loader throws a 404 HttpError when the row does not exist.
    const resource = loadResource(req);
    if (!can(req.user, action, resource)) {
      return sendError(req, res, 403, 'Not allowed', 'Your account is not allowed to do this.');
    }
    // The route handler uses the row that was checked, instead of loading it again.
    req.resource = resource;
    next();
  };
}
