// clinicScope() fails closed: no clinic id, no query.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db/database.js';
import { clinicScope } from '../src/tenancy/clinic-scope.js';

describe('clinicScope', () => {
  it('refuses to build clinic queries without a clinic id', () => {
    const db = openDatabase(':memory:');
    assert.throws(() => clinicScope(db, null), /needs a clinic id/);
    assert.throws(() => clinicScope(db, undefined), /needs a clinic id/);
  });
});
