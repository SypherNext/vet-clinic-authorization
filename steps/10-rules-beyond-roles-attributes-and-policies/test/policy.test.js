// The policy is a plain object, so it can be tested without a server.
// It gets a fake clock, so each test picks the date it needs.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPolicy } from '../src/access/policy.js';
import { createFakeClock } from './helpers.js';

const priya = { id: 8, role: 'vet', clinic_id: 2 };
const alex = { id: 7, role: 'admin', clinic_id: 1 };

// Biscuit's yearly check-up, referred to Dr. Priya from 1 to 30 November.
const record = {
  kind: 'record', owner_id: 1, clinic_id: 1, author_id: 4, vet_ids: [4], shared_with: [],
  referrals: [{ to_vet_id: 8, starts_on: '2026-11-01', ends_on: '2026-11-30' }],
};

const policyOn = (date) => createPolicy({ clock: createFakeClock(Date.parse(`${date}T12:00:00Z`)) });

describe('policy', () => {
  it('lets the referred vet read the record while the referral runs, last day included', () => {
    assert.equal(policyOn('2026-11-05').can(priya, 'record:view', record), true);
    assert.equal(policyOn('2026-11-30').can(priya, 'record:view', record), true);
  });

  it('refuses the referred vet before and after the referral', () => {
    assert.equal(policyOn('2026-10-31').can(priya, 'record:view', record), false);
    assert.equal(policyOn('2026-12-01').can(priya, 'record:view', record), false);
  });

  it('refuses an action that no role lists (deny by default)', () => {
    assert.equal(policyOn('2026-11-05').can(alex, 'users:delete-everyone'), false);
  });

  it('refuses everything to a visitor who is not logged in', () => {
    assert.equal(policyOn('2026-11-05').can(null, 'pets:list-own'), false);
  });
});
