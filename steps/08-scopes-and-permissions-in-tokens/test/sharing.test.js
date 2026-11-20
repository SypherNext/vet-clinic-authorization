// Sharing a record: the author adds another vet to its access list, and
// that vet can read the record, but cannot share it further.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, users } from './helpers.js';
import { findUserByEmail } from '../src/users/users.js';

describe('sharing a record', () => {
  let app;
  let sam;
  let lee;
  let leeId;
  before(async () => {
    app = await startTestApp();
    sam = app.newBrowser();
    lee = app.newBrowser();
    await sam.logIn(users.sam);
    await lee.logIn(users.lee);
    leeId = findUserByEmail(app.db, users.lee.email).id;
  });
  after(() => app.close());

  it('gives Dr. Lee a record only after Dr. Sam shares it', async () => {
    assert.equal((await lee.get('/records/1')).status, 404);
    await sam.get('/records/1/sharing');
    assert.equal((await sam.post('/records/1/sharing', { user_id: leeId })).status, 302);
    assert.equal((await lee.get('/records/1')).status, 200);
  });

  it('does not let the vet it was shared with share it further', async () => {
    assert.equal((await lee.get('/records/1/sharing')).status, 403);
  });

  it('takes access away again when the author removes the share', async () => {
    await sam.get('/records/1/sharing');
    await sam.post(`/records/1/sharing/${leeId}/remove`);
    assert.equal((await lee.get('/records/1')).status, 404);
  });

  it('refuses to share with someone who is not a vet', async () => {
    const olivia = findUserByEmail(app.db, users.olivia.email);
    await sam.get('/records/1/sharing');
    assert.equal((await sam.post('/records/1/sharing', { user_id: olivia.id })).status, 400);
  });
});
