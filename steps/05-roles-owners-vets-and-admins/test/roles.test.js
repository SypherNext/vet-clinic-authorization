// Each role reaches the pages its permissions list, and nothing else.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, users } from './helpers.js';
import { ROLES } from '../src/access/roles.js';

describe('roles', () => {
  let app;
  before(async () => { app = await startTestApp(); });
  after(() => app.close());

  async function statusFor(user, path) {
    const browser = app.newBrowser();
    await browser.logIn(user);
    return (await browser.get(path)).status;
  }

  it('sends each role to its own start page after login', async () => {
    assert.equal((await app.newBrowser().logIn(users.rosa)).location, '/appointments');
    assert.equal((await app.newBrowser().logIn(users.admin)).location, '/admin/users');
  });

  it('lets a receptionist see the appointment book but not medical notes', async () => {
    assert.equal(await statusFor(users.rosa, '/appointments'), 200);
    assert.equal(await statusFor(users.rosa, '/records/1'), 403);
  });

  it('keeps the appointment book from pet owners and vets', async () => {
    assert.equal(await statusFor(users.olivia, '/appointments'), 403);
    assert.equal(await statusFor(users.sam, '/appointments'), 403);
  });

  it('gives every seeded user a role that exists', () => {
    for (const user of Object.values(users)) assert.ok(ROLES[user.role], `${user.email} has role ${user.role}`);
  });
});
