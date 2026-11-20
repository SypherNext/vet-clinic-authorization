// The policy is a plain function, so it can be tested without a server.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { can } from '../src/access/policy.js';

const olivia = { id: 1, role: 'owner' };
const alex = { id: 5, role: 'admin' };

describe('policy', () => {
  it('lets an admin list users and refuses an owner', () => {
    assert.equal(can(alex, 'users:list'), true);
    assert.equal(can(olivia, 'users:list'), false);
  });

  it('refuses an action that has no rule (deny by default)', () => {
    assert.equal(can(alex, 'users:delete-everyone'), false);
  });

  it('refuses everything to a visitor who is not logged in', () => {
    assert.equal(can(null, 'pets:list-own'), false);
  });
});
