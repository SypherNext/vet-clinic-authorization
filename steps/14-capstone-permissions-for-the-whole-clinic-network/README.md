# Step 14: Capstone: Permissions for the Whole Clinic Network

The capstone's code is the finished app in [`../../app`](../../app). It is not
copied here, so there is exactly one copy of the final code.

Compared with step 13, the capstone adds:

- a new role, `vet_nurse`, in `src/access/roles.js`, and Kim Tran, a vet nurse
  on the Maple dogs and cats team, in `src/db/seed.js`; no route, rule or
  relationship had to change for it
- `src/teams/care-team-routes.js` and `src/views/care-team.ejs`: the
  "My care team" page for vets and vet nurses
- `/admin/roles` in `src/portal/admin-routes.js` and `src/views/roles.ejs`:
  a table of roles and actions, built from `roles.js` when the page loads
- `roleLabel()` and `allActions()` in `src/access/roles.js`, so pages show
  "Vet nurse" instead of `vet_nurse`
- eight more rows in `test/permission-cases.js`
