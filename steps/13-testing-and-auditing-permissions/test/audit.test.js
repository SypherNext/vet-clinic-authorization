// The audit log: refusals and record reads are written down, with a reason,
// and each clinic's admin reads only their own clinic's entries.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, users } from './helpers.js';

describe('audit log of permission decisions', () => {
  let app;
  before(async () => {
    app = await startTestApp();
    const olivia = app.newBrowser();
    await olivia.logIn(users.olivia);
    await olivia.get('/records/1'); // allowed, and a record read: kept
    await olivia.get('/pets'); // allowed, not sensitive: not kept
    await olivia.get('/records/3'); // denied: kept
  });
  after(() => app.close());

  const rows = () => app.db.prepare('SELECT action, object, allowed, reason FROM permission_decisions ORDER BY id').all();

  it('keeps refusals and record reads, with the reason', () => {
    assert.deepEqual(rows().map((r) => ({ ...r })), [
      { action: 'record:view', object: 'record:1', allowed: 1, reason: 'the record rule for record:view passed' },
      { action: 'record:view', object: 'record:3', allowed: 0, reason: 'the record rule for record:view said no' },
    ]);
  });

  it("shows the attempt on Maple's record to Maple's admin only", async () => {
    const alex = app.newBrowser();
    await alex.logIn(users.admin);
    const jordan = app.newBrowser();
    await jordan.logIn(users.jordan);
    assert.match((await alex.get('/admin/audit')).text, /record:3/);
    assert.doesNotMatch((await jordan.get('/admin/audit')).text, /record:3/);
  });
});
