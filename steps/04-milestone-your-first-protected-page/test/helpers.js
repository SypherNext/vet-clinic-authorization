// Shared tools for the tests: a fresh app per test file and a tiny "browser"
// that keeps cookies and CSRF tokens.
import { once } from 'node:events';
import { loadConfig } from '../src/config.js';
import { openDatabase } from '../src/db/database.js';
import { seedDatabase, SEED_USERS } from '../src/db/seed.js';
import { createApp } from '../src/app.js';

// The seeded people, by first name: users.olivia.email, users.olivia.password ...
export const users = Object.fromEntries(
  SEED_USERS.map((u) => [u.email.split('@')[0], u]),
);

// A clock the test controls. clock.advance(60_000) jumps one minute forward.
export function createFakeClock(start = Date.parse('2026-11-05T09:00:00Z')) {
  let time = start;
  return {
    now: () => time,
    advance: (ms) => { time += ms; },
  };
}

// Starts the whole app on a random free port, with an in-memory database
// and a fake clock.
export async function startTestApp() {
  const config = loadConfig({});
  const db = openDatabase(':memory:');
  const clock = createFakeClock();
  await seedDatabase(db, { now: clock.now() });
  const app = createApp({ config, db, clock });

  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  config.appOrigin = baseUrl;

  return {
    baseUrl, config, db, clock,
    newBrowser: () => new TestBrowser(baseUrl),
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

// Just enough of a browser: it stores cookies, remembers the CSRF token from
// the last page, and does not follow redirects (so tests can check them).
export class TestBrowser {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookies = new Map();
    this.csrfToken = '';
  }

  cookieHeader() {
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ');
  }

  async request(method, path, { form, headers = {} } = {}) {
    const allHeaders = { ...headers };
    if (this.cookies.size) allHeaders.cookie = this.cookieHeader();
    let body;
    if (form) {
      allHeaders['content-type'] = 'application/x-www-form-urlencoded';
      body = new URLSearchParams(form).toString();
    }
    const response = await fetch(this.baseUrl + path, { method, headers: allHeaders, body, redirect: 'manual' });
    this.rememberCookies(response);
    const text = await response.text();
    const token = text.match(/name="csrf-token" content="([^"]+)"/);
    if (token) this.csrfToken = token[1];
    return { status: response.status, location: response.headers.get('location'), headers: response.headers, text };
  }

  rememberCookies(response) {
    for (const line of response.headers.getSetCookie()) {
      const [pair] = line.split(';');
      const [name, value] = pair.split('=');
      if (/expires=Thu, 01 Jan 1970/i.test(line)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }

  get(path) {
    return this.request('GET', path);
  }

  // Posts a form the way a real page would: with the page's CSRF token.
  post(path, fields = {}) {
    return this.request('POST', path, { form: { _csrf: this.csrfToken, ...fields } });
  }

  async logIn(user) {
    await this.get('/login');
    return this.post('/login', { email: user.email, password: user.password });
  }
}
