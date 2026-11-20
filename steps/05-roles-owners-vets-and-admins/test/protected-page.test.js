// The milestone: the medical record page lets vets in and keeps everyone else out.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, users } from './helpers.js';

describe('the medical record page', () => {
  let app;
  before(async () => { app = await startTestApp(); });
  after(() => app.close());

  async function openAs(user, path) {
    const browser = app.newBrowser();
    await browser.logIn(user);
    return browser.get(path);
  }

  it('opens for a vet', async () => {
    const response = await openAs(users.sam, '/records/1');
    assert.equal(response.status, 200);
    assert.match(response.text, /Rabies and DHPP vaccines given/);
  });

  it('answers 403 to a pet owner, without the notes', async () => {
    const response = await openAs(users.olivia, '/records/3');
    assert.equal(response.status, 403);
    assert.doesNotMatch(response.text, /X-ray clear/);
  });

  it('sends a visitor who is not logged in to the login page', async () => {
    const response = await app.newBrowser().get('/records/1');
    assert.equal(response.status, 302);
    assert.equal(response.location, '/login');
  });

  it('answers 404 for a record that does not exist', async () => {
    assert.equal((await openAs(users.sam, '/records/999')).status, 404);
  });
});
