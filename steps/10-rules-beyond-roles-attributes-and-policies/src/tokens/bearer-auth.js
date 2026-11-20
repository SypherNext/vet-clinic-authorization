// Authentication for the API: "Authorization: Bearer vcp_..." on every request.
// This file only answers "who is this, and which token?". What the request
// may do is still decided by authorize() and the policy.
import { findLiveApiToken, markApiTokenUsed } from './api-tokens.js';
import { findUserById } from '../users/users.js';

const BEARER_PREFIX = 'Bearer ';

function refuse(res, message) {
  // The WWW-Authenticate header tells the client which kind of credential to send.
  res.set('WWW-Authenticate', 'Bearer realm="vet clinic api"');
  res.status(401).json({ error: message });
}

export function bearerAuth({ db, clock }) {
  return (req, res, next) => {
    const header = req.get('authorization') ?? '';
    if (!header.startsWith(BEARER_PREFIX)) return refuse(res, 'Send an API token: Authorization: Bearer <token>.');
    const now = clock.now();
    const token = findLiveApiToken(db, header.slice(BEARER_PREFIX.length).trim(), now);
    const user = token && findUserById(db, token.user_id);
    if (!user) return refuse(res, 'That token is not valid. It may have expired or been revoked.');
    markApiTokenUsed(db, token.id, now);
    req.user = user;
    req.token = token;
    next();
  };
}
