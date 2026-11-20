// A row someone may not see must look exactly like a row that does not exist,
// so the 404 answers in the permission table leak nothing.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, users } from './helpers.js';

describe('hidden rows', () => {
  let app;
  before(async () => { app = await startTestApp(); });
  after(() => app.close());

  it('makes a hidden record and a missing record look the same', async () => {
    const olivia = app.newBrowser();
    await olivia.logIn(users.olivia);
    const hidden = await olivia.get('/records/3');
    const missing = await olivia.get('/records/999');
    assert.equal(hidden.status, 404);
    assert.equal(hidden.status, missing.status);
    assert.equal(hidden.text, missing.text);
  });
});
