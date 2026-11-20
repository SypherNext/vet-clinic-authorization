// Rules beyond roles: a referral opens a pet to a specialist for a limited
// time, and the front desk sees the pets of its own clinic only.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, users } from './helpers.js';

const DAY = 24 * 60 * 60 * 1000;

describe('attribute rules', () => {
  let app;
  before(async () => { app = await startTestApp(); });
  after(() => app.close());

  async function statusFor(user, path) {
    const browser = app.newBrowser();
    await browser.logIn(user);
    return (await browser.get(path)).status;
  }

  it('lets Dr. Priya read Biscuit while the referral is active', async () => {
    assert.equal(await statusFor(users.priya, '/pets/1'), 200);
    assert.equal(await statusFor(users.priya, '/records/1'), 200);
  });

  it('keeps Mango from Dr. Priya because that referral has ended', async () => {
    assert.equal(await statusFor(users.priya, '/records/2'), 404);
  });

  it('lets the Maple receptionist see Maple pets but not a Riverside pet', async () => {
    assert.equal(await statusFor(users.rosa, '/pets/1'), 200);
    assert.equal(await statusFor(users.rosa, '/pets/4'), 404);
  });

  it('closes Biscuit to Dr. Priya once the referral ends', async () => {
    app.clock.advance(26 * DAY);
    assert.equal(await statusFor(users.priya, '/records/1'), 404);
  });
});
