// "Is this your pet?" Owners and vets reach only their own pets and records,
// and a row someone may not see looks exactly like a row that does not exist.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, users } from './helpers.js';

describe('ownership', () => {
  let app;
  const browsers = {};
  before(async () => {
    app = await startTestApp();
    for (const name of ['olivia', 'ben', 'sam', 'lee']) {
      browsers[name] = app.newBrowser();
      await browsers[name].logIn(users[name]);
    }
  });
  after(() => app.close());

  const statusFor = async (name, path) => (await browsers[name].get(path)).status;

  it('lets Olivia open her own pet and its record', async () => {
    assert.equal(await statusFor('olivia', '/pets/1'), 200);
    assert.equal(await statusFor('olivia', '/records/1'), 200);
  });

  it("answers 404 when Olivia tries Ben's rabbit", async () => {
    assert.equal(await statusFor('olivia', '/pets/3'), 404);
    assert.equal(await statusFor('olivia', '/records/3'), 404);
  });

  it('lets a vet open their own patients only', async () => {
    assert.equal(await statusFor('sam', '/records/1'), 200);
    assert.equal(await statusFor('sam', '/records/3'), 404);
    assert.equal(await statusFor('lee', '/records/3'), 200);
    assert.equal(await statusFor('lee', '/records/1'), 404);
  });

  it('makes a hidden row and a missing row look the same', async () => {
    const hidden = await browsers.olivia.get('/records/3');
    const missing = await browsers.olivia.get('/records/999');
    assert.equal(hidden.status, missing.status);
    assert.equal(hidden.text, missing.text);
  });
});
