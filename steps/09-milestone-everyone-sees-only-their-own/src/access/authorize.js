// The one gatekeeper every protected route uses, in the browser and the API.
//
//   authorize('users:list')               an action that needs no particular row
//   authorize('record:view', loadRecord)  load the row first, then check it
//
// The route says WHAT it needs. The rules for WHO may do it live in policy.js,
// and what an API token may be used for lives in tokens/scopes.js.
import { can } from './policy.js';
import { scopesAllow, scopeFor } from '../tokens/scopes.js';
import { sendError, sendForbidden, notFound } from '../http/errors.js';

const noResource = () => null;

// Not logged in: "we do not know who you are", so go to the login page.
// (A form post gets a plain 401 instead of a redirect.)
function askToLogIn(req, res) {
  if (req.method === 'GET') return res.redirect('/login');
  sendError(req, res, 401, 'Please log in', 'You need to log in first.');
}

// The standard answer when a token lacks a scope (RFC 6750): 403, and a
// header naming the scope that would have worked.
function refuseScope(res, action) {
  const scope = scopeFor(action);
  res.set('WWW-Authenticate', `Bearer error="insufficient_scope", scope="${scope}"`);
  res.status(403).json({ error: `This token does not have the ${scope} scope.` });
}

// Someone who may not even look at a row is told it does not exist. A 403
// would confirm that pet number 3 is real, which is already a small leak.
function mayNotSee(user, resource) {
  return resource !== null && !can(user, `${resource.kind}:view`, resource);
}

export function authorize(action, loadResource = noResource) {
  return (req, res, next) => {
    if (!req.user) return askToLogIn(req, res);
    // A request made with a token is limited to the token's scopes first.
    if (req.token && !scopesAllow(req.token.scopes, action)) return refuseScope(res, action);
    // The loader throws a 404 HttpError when the row does not exist.
    const resource = loadResource(req);
    if (!can(req.user, action, resource)) {
      return mayNotSee(req.user, resource) ? notFound(req, res) : sendForbidden(req, res);
    }
    // The route handler uses the row that was checked, instead of loading it again.
    req.resource = resource;
    next();
  };
}
