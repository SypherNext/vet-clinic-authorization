// One place for error responses, so every route reports problems the same way.

// Throw this from a route to send a specific status code and message.
export class HttpError extends Error {
  constructor(status, title, message) {
    super(message);
    this.status = status;
    this.title = title;
  }
}

// Browser pages get an HTML page; the JSON API gets JSON.
function wantsJson(req) {
  return req.is('application/json') || req.originalUrl.startsWith('/api/');
}

export function sendError(req, res, status, title, message) {
  res.status(status);
  if (wantsJson(req)) return res.json({ error: message });
  res.render('message', { title, message, tone: 'error' });
}

// 403: we know who you are, and you may not do this. The page says who you
// are logged in as, but not which rule refused you: the rules are none of a
// stranger's business, and a list of them is a map for an attacker.
export function sendForbidden(req, res) {
  res.status(403);
  if (wantsJson(req)) return res.json({ error: 'You are not allowed to do this.' });
  res.render('forbidden');
}

export function notFound(req, res) {
  sendError(req, res, 404, 'Page not found', 'There is no page at this address.');
}

// Express calls this when a route throws. Unexpected errors are logged but
// never shown to the visitor, because stack traces leak details.
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) return sendError(req, res, err.status, err.title, err.message);
  if (err.type === 'entity.too.large') return sendError(req, res, 413, 'Too large', 'That form was too large.');
  console.error(err);
  sendError(req, res, 500, 'Something went wrong', 'Please try again.');
}
