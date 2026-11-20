// Builds the Express app from its parts. server.js starts it with the real
// database and clock; tests build their own copy with fakes.
//
// deps = { config, db, clock }: everything the routes need, passed in rather
// than imported, so any part can be swapped in a test.
import express from 'express';
import path from 'node:path';
import { plural } from './format.js';
import { notFound, errorHandler } from './http/errors.js';
import { securityHeaders } from './security/security-headers.js';
import { csrfProtection } from './security/csrf.js';
import { createRateLimiters } from './security/rate-limit.js';
import { sessionMiddleware, viewLocals } from './sessions/sessions.js';
import { sessionRoutes } from './sessions/session-routes.js';
import { loginRoutes } from './auth/login-routes.js';
import { portalRoutes } from './portal/portal-routes.js';
import { adminRoutes } from './portal/admin-routes.js';
import { sharingRoutes } from './sharing/sharing-routes.js';

// Every group of pages. Each one is a function that takes deps and returns a router.
const PAGE_ROUTES = [portalRoutes, sharingRoutes, loginRoutes, sessionRoutes, adminRoutes];

export function createApp(baseDeps) {
  const deps = { ...baseDeps, rateLimiters: createRateLimiters(baseDeps) };
  const app = express();
  app.set('views', path.join(import.meta.dirname, 'views'));
  app.set('view engine', 'ejs');
  app.disable('x-powered-by');
  app.locals.clinicName = deps.config.clinicName;
  app.locals.plural = plural;
  // Defaults for every page; the session middleware fills in the real values.
  app.locals.user = null;
  app.locals.csrfToken = '';
  app.locals.flash = null;

  app.use(securityHeaders);
  app.use(express.static(path.join(import.meta.dirname, 'public')));
  app.use(express.urlencoded({ extended: false, limit: '10kb' }));

  app.use(sessionMiddleware(deps));
  app.use(csrfProtection(deps));
  app.use(viewLocals(deps));
  for (const routes of PAGE_ROUTES) app.use(routes(deps));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
