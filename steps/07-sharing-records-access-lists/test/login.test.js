// Logging in and out: the starting point the rest of the course builds on.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, users } from './helpers.js';

describe('login and logout', () => {
  let app;
  before(async () => { app = await startTestApp(); });
  after(() => app.close());

  it('logs an owner in and sends them to their pets', async () => {
    const response = await app.newBrowser().logIn(users.olivia);
    assert.equal(response.status, 302);
    assert.equal(response.location, '/pets');
  });

  it('refuses a wrong password with the same message as an unknown email', async () => {
    const wrongPassword = await app.newBrowser().logIn({ email: users.olivia.email, password: 'not her password' });
    const unknownEmail = await app.newBrowser().logIn({ email: 'nobody@vetclinic.test', password: 'whatever' });
    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    assert.match(wrongPassword.text, /do not match an account/);
    assert.match(unknownEmail.text, /do not match an account/);
  });

  it('sends a visitor who is not logged in to the login page', async () => {
    const response = await app.newBrowser().get('/pets');
    assert.equal(response.location, '/login');
  });

  it('ends the session at logout', async () => {
    const browser = app.newBrowser();
    await browser.logIn(users.ben);
    await browser.get('/pets');
    await browser.post('/logout');
    assert.equal((await browser.get('/pets')).location, '/login');
  });
});
