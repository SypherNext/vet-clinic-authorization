// Cross-site request forgery (CSRF) protection.
//
// A login cookie is sent with every request to this site, even when another
// website makes your browser send it (a hidden form that posts to /logout,
// for example). So every form here carries a secret token that only pages
// from this site know. A POST without the right token is refused.
import { ensureSession } from '../sessions/sessions.js';
import { sameSecret } from './tokens.js';
import { sendError } from '../http/errors.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function csrfProtection(deps) {
  return (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) {
      // Safe requests only read. Make sure the page can embed a token.
      res.locals.csrfToken = ensureSession(deps, req, res).csrfToken;
      return next();
    }

    // Browsers say which site a form came from. If it is not us, stop here.
    const origin = req.get('origin');
    if (origin && origin !== deps.config.appOrigin) {
      return sendError(req, res, 403, 'Request blocked', 'This form was sent from another website.');
    }

    // Forms send the token as a hidden field; our scripts send it as a header.
    const sent = req.body?._csrf ?? req.get('x-csrf-token');
    if (!req.session || !sent || !sameSecret(sent, req.session.csrfToken)) {
      return sendError(req, res, 403, 'Form expired',
        'This form has expired or did not come from this site. Go back, reload the page and try again.');
    }
    res.locals.csrfToken = req.session.csrfToken;
    next();
  };
}
