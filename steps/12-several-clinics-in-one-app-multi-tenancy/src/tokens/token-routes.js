// The API tokens page: make a token with chosen scopes, see your tokens,
// revoke one. Any logged-in user may manage their OWN tokens.
import express from 'express';
import { readId } from '../http/validate.js';
import { setFlash } from '../sessions/sessions.js';
import { SCOPES, scopesForRole } from './scopes.js';
import { createApiToken, listApiTokens, countApiTokens, revokeApiToken } from './api-tokens.js';

const TOKENS_PATH = '/account/tokens';
const MAX_TOKEN_NAME = 40;

// A form sends one value for one ticked box and a list for several.
function readScopes(value, role) {
  const picked = [value ?? []].flat().map(String);
  const offered = scopesForRole(role);
  return picked.length > 0 && picked.every((scope) => offered.includes(scope)) ? [...new Set(picked)] : null;
}

function readTokenName(value) {
  const name = String(value ?? '').trim();
  return name.length > 0 && name.length <= MAX_TOKEN_NAME ? name : null;
}

export function tokenRoutes(deps) {
  const { db, config, clock, authorize } = deps;
  const router = express.Router();
  const mayManageOwnTokens = authorize('tokens:manage-own');

  const renderPage = (req, res, { newToken = null, error = null } = {}) => res.render('tokens', {
    tokens: listApiTokens(db, req.user.id),
    offeredScopes: scopesForRole(req.user.role).map((name) => ({ name, ...SCOPES[name] })),
    newToken,
    error,
  });

  router.get(TOKENS_PATH, mayManageOwnTokens, (req, res) => renderPage(req, res));

  router.post(TOKENS_PATH, mayManageOwnTokens, (req, res) => {
    const name = readTokenName(req.body.name);
    const scopes = readScopes(req.body.scopes, req.user.role);
    if (!name || !scopes) return renderPage(req, res.status(400), { error: 'Give the token a name and tick at least one scope.' });
    if (countApiTokens(db, req.user.id) >= config.apiTokens.maxPerUser) {
      return renderPage(req, res.status(400), { error: 'You have too many tokens. Revoke one first.' });
    }
    const token = createApiToken(db, {
      userId: req.user.id, name, scopes, now: clock.now(), lifetimeMs: config.apiTokens.lifetimeMs,
    });
    // Shown once, on this response only. It is never stored or shown again.
    renderPage(req, res, { newToken: { name, value: token } });
  });

  router.post(`${TOKENS_PATH}/:tokenId/revoke`, mayManageOwnTokens, (req, res) => {
    const revoked = revokeApiToken(db, { tokenId: readId(req.params.tokenId), userId: req.user.id });
    setFlash(deps, req, res, revoked ? 'Token revoked. It stops working at once.' : 'No such token.', revoked ? 'ok' : 'error');
    res.redirect(TOKENS_PATH);
  });

  return router;
}
