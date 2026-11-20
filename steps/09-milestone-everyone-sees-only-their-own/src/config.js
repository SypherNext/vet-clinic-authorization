// Every setting the app reads, in one place. Values come from environment
// variables (or a .env file), with defaults that work on your own computer.
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

export const CLINIC_NAME = 'Maple Street Vet Clinic';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function loadConfig(env = process.env) {
  const port = Number(env.PORT ?? 18900);
  const production = env.NODE_ENV === 'production';
  // Secure cookies are only sent over HTTPS. Production always uses them.
  const secureCookies = production || env.COOKIE_SECURE === 'true';

  return {
    port,
    // 127.0.0.1 means "only this computer can connect".
    host: env.HOST ?? '127.0.0.1',
    // The address you type in the browser. Forms must come from it.
    appOrigin: env.APP_ORIGIN ?? `http://localhost:${port}`,
    production,
    databaseFile: env.DATABASE_FILE ?? path.join(root, 'data', 'vet-clinic.db'),
    clinicName: CLINIC_NAME,

    sessions: {
      // The __Host- prefix makes the browser refuse the cookie unless it is
      // Secure, has Path=/ and no Domain, so it needs HTTPS.
      cookieName: secureCookies ? '__Host-session' : 'session',
      secureCookies,
      // Log out after 30 minutes without a click...
      idleTimeoutMs: 30 * MINUTE,
      // ...and after 12 hours no matter what.
      absoluteTimeoutMs: 12 * HOUR,
    },

    passwords: { maxLength: 128 },

    rateLimits: {
      // Per IP address, for the login form.
      login: { windowMs: 15 * MINUTE, max: 30 },
      // Per IP address, for every request to the JSON API.
      api: { windowMs: 15 * MINUTE, max: 300 },
    },

    apiTokens: {
      // A token stops working after 90 days; you can revoke it sooner.
      lifetimeMs: 90 * DAY,
      maxPerUser: 10,
    },
  };
}
