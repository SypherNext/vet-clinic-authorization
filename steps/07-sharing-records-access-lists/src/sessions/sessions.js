// Sessions from the point of view of a request: read the cookie, check the
// session is still fresh, start one at login, end one at logout.
import { readCookie } from '../http/cookies.js';
import { findUserById } from '../users/users.js';
import {
  createSession, findSessionByToken, touchSession, saveSessionData, deleteSession,
} from './session-store.js';

function cookieOptions(sessionConfig) {
  return {
    httpOnly: true, // page scripts cannot read it, so an XSS bug cannot steal it
    sameSite: 'lax', // not sent on form posts from other sites
    secure: sessionConfig.secureCookies, // HTTPS only (always on in production)
    path: '/',
    maxAge: sessionConfig.absoluteTimeoutMs,
  };
}

function isExpired(session, sessionConfig, now) {
  const idleFor = now - session.lastSeenAt;
  const age = now - session.createdAt;
  return idleFor > sessionConfig.idleTimeoutMs || age > sessionConfig.absoluteTimeoutMs;
}

function clearSessionCookie(res, sessionConfig) {
  res.clearCookie(sessionConfig.cookieName, { ...cookieOptions(sessionConfig), maxAge: undefined });
}

function beginSession(deps, res, userId) {
  const { db, config, clock } = deps;
  const { token, session } = createSession(db, { userId, now: clock.now() });
  res.cookie(config.sessions.cookieName, token, cookieOptions(config.sessions));
  return session;
}

// Runs on every request: finds the visitor's session and their user, if any.
export function sessionMiddleware(deps) {
  const { db, config, clock } = deps;
  return (req, res, next) => {
    req.session = null;
    req.user = null;
    const token = readCookie(req, config.sessions.cookieName);
    if (!token) return next();

    const session = findSessionByToken(db, token);
    const now = clock.now();
    if (!session || isExpired(session, config.sessions, now)) {
      if (session) deleteSession(db, session.id);
      clearSessionCookie(res, config.sessions);
      return next();
    }
    touchSession(db, session.id, now);
    req.session = session;
    req.user = session.userId ? findUserById(db, session.userId) : null;
    next();
  };
}

// A visitor who has not logged in still gets a session when a page needs
// one, to hold the login form's CSRF token.
export function ensureSession(deps, req, res) {
  if (!req.session) req.session = beginSession(deps, res, null);
  return req.session;
}

// Called after a successful login. The old session (and its id) is thrown
// away and a brand new one is issued. This stops "session fixation", where an
// attacker plants a session id in your browser before you log in.
export function startUserSession(deps, req, res, userId) {
  if (req.session) deleteSession(deps.db, req.session.id);
  req.session = beginSession(deps, res, userId);
  return req.session;
}

export function endSession(deps, req, res) {
  if (req.session) deleteSession(deps.db, req.session.id);
  clearSessionCookie(res, deps.config.sessions);
  req.session = null;
  req.user = null;
}

// Stores small values on the session, such as a one-time message.
// Setting a key to undefined removes it.
export function updateSessionData(deps, req, changes) {
  const session = req.session;
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) delete session.data[key];
    else session.data[key] = value;
  }
  saveSessionData(deps.db, session.id, session.data);
}

// A one-time message shown at the top of the next page ("Password changed").
// tone is 'ok' (green) or 'error' (red).
export function setFlash(deps, req, res, text, tone = 'ok') {
  ensureSession(deps, req, res);
  updateSessionData(deps, req, { flash: { text, tone } });
}

// Makes the user and any one-time message available to every page template.
export function viewLocals(deps) {
  return (req, res, next) => {
    res.locals.user = req.user;
    res.locals.flash = null;
    if (req.method === 'GET' && req.session?.data.flash) {
      res.locals.flash = req.session.data.flash;
      updateSessionData(deps, req, { flash: undefined });
    }
    next();
  };
}
