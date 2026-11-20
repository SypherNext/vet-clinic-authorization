// Every row of the permission table, as its own test.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp } from './helpers.js';
import { PERMISSION_CASES } from './permission-cases.js';
import { runPermissionCases } from './permission-table.js';

describe('permission table', () => {
  let app;
  let results;
  before(async () => {
    app = await startTestApp();
    results = await runPermissionCases(app);
  });
  after(() => app.close());

  PERMISSION_CASES.forEach((row, index) => {
    it(`${row.who ?? '(nobody)'} GET ${row.path} -> ${row.expect} (${row.why})`, () => {
      assert.equal(results[index].got, row.expect);
    });
  });
});
