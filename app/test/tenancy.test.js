// Multi-tenancy: staff of one clinic never see another clinic's data.
//
// The test does not list the names to look for by hand. It asks the
// database which pets, staff and pet owners belong to OTHER clinics, then
// checks that none of those names appears on any list page. A new list page
// only needs one line in LIST_PAGES to be covered.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, users } from './helpers.js';
import { findUserByEmail } from '../src/users/users.js';

// Pages that list a whole clinic's rows. (A vet's /patients page lists that vet's
// own patients and referrals, which may rightly come from another clinic.)
const LIST_PAGES = ['/appointments', '/admin/users', '/admin/teams'];
const STAFF = ['sam', 'lee', 'kim', 'rosa', 'admin', 'priya', 'jordan'];

// Names that belong to another clinic: its pets, its staff, and the owners
// of its pets. Owners have no clinic of their own (clinic_id is NULL, and
// NULL != 1 is never true in SQL), so they are found through their pets: an
// owner with no pet at this clinic belongs to another one.
function namesFromOtherClinics(db, clinicId) {
  return db.prepare(`SELECT name FROM pets WHERE clinic_id != :clinic
                     UNION SELECT name FROM users WHERE clinic_id != :clinic
                     UNION SELECT name FROM users u WHERE u.clinic_id IS NULL AND NOT EXISTS
                       (SELECT 1 FROM pets p WHERE p.owner_id = u.id AND p.clinic_id = :clinic)`)
    .all({ clinic: clinicId }).map((row) => row.name);
}

describe('multi-tenancy', () => {
  let app;
  before(async () => { app = await startTestApp(); });
  after(() => app.close());

  for (const name of STAFF) {
    it(`shows ${name} nothing from another clinic`, async () => {
      const user = findUserByEmail(app.db, users[name].email);
      const foreign = namesFromOtherClinics(app.db, user.clinic_id);
      const browser = app.newBrowser();
      await browser.logIn(users[name]);
      for (const path of LIST_PAGES) {
        const page = await browser.get(path);
        if (page.status !== 200) continue; // pages this role may not open are tested elsewhere
        const leaked = foreign.filter((foreignName) => page.text.includes(foreignName));
        assert.deepEqual(leaked, [], `${path} shows ${name} data from another clinic`);
      }
    });
  }
});
