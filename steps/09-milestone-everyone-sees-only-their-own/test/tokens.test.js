// API tokens: a token is limited by its scopes AND by its user's permissions.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, users } from './helpers.js';

describe('API tokens and scopes', () => {
  let app;
  before(async () => { app = await startTestApp(); });
  after(() => app.close());

  // Makes a token on the tokens page, the way a person would.
  async function makeToken(user, scopes) {
    const browser = app.newBrowser();
    await browser.logIn(user);
    await browser.get('/account/tokens');
    const page = await browser.request('POST', '/account/tokens', {
      form: [['_csrf', browser.csrfToken], ['name', 'test token'], ...scopes.map((s) => ['scopes', s])],
    });
    return page.text.match(/<code class="token">([^<]+)<\/code>/)?.[1] ?? null;
  }

  const callApi = (path, token) => fetch(`${app.baseUrl}/api${path}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });

  it('answers 401 without a token', async () => {
    assert.equal((await callApi('/pets')).status, 401);
  });

  it('lets a pets:read token list only its own pets', async () => {
    const token = await makeToken(users.olivia, ['pets:read']);
    const response = await callApi('/pets', token);
    assert.equal(response.status, 200);
    const names = (await response.json()).pets.map((p) => p.name);
    assert.deepEqual(names, ['Biscuit', 'Mango']);
  });

  it('refuses a record to a token without records:read, naming the scope', async () => {
    const token = await makeToken(users.olivia, ['pets:read']);
    const response = await callApi('/records/1', token);
    assert.equal(response.status, 403);
    assert.match(response.headers.get('www-authenticate'), /insufficient_scope.*records:read/);
  });

  it('still applies the policy when the scope is there', async () => {
    const token = await makeToken(users.olivia, ['records:read']);
    assert.equal((await callApi('/records/1', token)).status, 200);
    assert.equal((await callApi('/records/3', token)).status, 404, "Ben's rabbit is still not hers");
  });

  it('does not offer a scope the role can never use', async () => {
    assert.equal(await makeToken(users.olivia, ['appointments:read']), null);
  });
});
