// The relationship model, asked directly, and through the care teams page.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, users } from './helpers.js';
import { createRelationships } from '../src/access/relationships.js';
import { findUserByEmail } from '../src/users/users.js';

describe('relationships', () => {
  let app;
  let relationships;
  const id = {};
  before(async () => {
    app = await startTestApp();
    relationships = createRelationships(app.db);
    for (const name of ['olivia', 'sam', 'lee', 'rosa', 'admin', 'jordan']) id[name] = `user:${findUserByEmail(app.db, users[name].email).id}`;
  });
  after(() => app.close());

  it('follows the record to its pet to find the owner', () => {
    assert.equal(relationships.check(id.olivia, 'viewer', 'record:1'), true);
  });

  it('follows the pet to its care team to find the vets', () => {
    assert.equal(relationships.check(id.sam, 'viewer', 'record:1'), true);
    assert.equal(relationships.check(id.lee, 'viewer', 'record:1'), false);
  });

  it('gives the front desk the pets of its clinic, but not their records', () => {
    assert.equal(relationships.check(id.rosa, 'viewer', 'pet:1'), true);
    assert.equal(relationships.check(id.rosa, 'viewer', 'record:1'), false);
  });

  it('makes a clinic admin the manager of that clinic\'s teams only', () => {
    assert.equal(relationships.check(id.admin, 'manager', 'team:1'), true);
    assert.equal(relationships.check(id.jordan, 'manager', 'team:1'), false);
  });

  it('opens the team\'s pets to a vet the admin adds to the team', async () => {
    const lee = app.newBrowser();
    await lee.logIn(users.lee);
    assert.equal((await lee.get('/records/1')).status, 404);

    const admin = app.newBrowser();
    await admin.logIn(users.admin);
    await admin.get('/admin/teams');
    await admin.post('/admin/teams/1/members', { user_id: id.lee.split(':')[1] });
    assert.equal((await lee.get('/records/1')).status, 200);
  });

  it('answers 404 when another clinic\'s admin tries to change the team', async () => {
    const jordan = app.newBrowser();
    await jordan.logIn(users.jordan);
    await jordan.get('/admin/teams');
    assert.equal((await jordan.post('/admin/teams/1/members', { user_id: 9 })).status, 404);
  });
});
