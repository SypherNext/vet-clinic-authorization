// Multi-tenancy: one app, several clinics, and each clinic's data kept apart.
//
// Each clinic is a tenant. Every list of clinic data goes through
// clinicScope(), which bakes the clinic id into each query. There is no
// "all appointments" function left in the app to call by mistake: the only
// way to list appointments is to say whose.
import { HttpError } from '../http/errors.js';
import { APPOINTMENT_COLUMNS, APPOINTMENT_JOINS } from '../portal/portal-data.js';
import { teamsAtClinic, vetsAtClinic } from '../teams/teams.js';

export function clinicScope(db, clinicId) {
  // Fail closed: without a clinic id there is no query at all, not an unfiltered one.
  if (!Number.isInteger(clinicId)) throw new Error('clinicScope needs a clinic id');
  return {
    appointments: () => db.prepare(`SELECT ${APPOINTMENT_COLUMNS} ${APPOINTMENT_JOINS}
                                    WHERE p.clinic_id = ? ORDER BY a.starts_at`).all(clinicId),
    staff: () => db.prepare('SELECT id, email, name, role FROM users WHERE clinic_id = ? ORDER BY role, name')
      .all(clinicId),
    // Owners belong to no clinic. They show up wherever one of their pets is registered.
    petOwners: () => db.prepare(`SELECT DISTINCT u.id, u.email, u.name, u.role FROM users u
                                 JOIN pets p ON p.owner_id = u.id WHERE p.clinic_id = ? ORDER BY u.name`).all(clinicId),
    teams: () => teamsAtClinic(db, clinicId),
    vets: () => vetsAtClinic(db, clinicId),
  };
}

// Middleware for pages that list a clinic's data: it puts the logged-in
// staff member's clinic on the request as req.clinic. The clinic comes from
// the user's own row in the database, never from the address, a form field
// or a header, which anyone could change.
export function useClinic({ db }) {
  return (req, res, next) => {
    if (!req.user?.clinic_id) throw new HttpError(403, 'Clinic staff only', 'This page lists a clinic\'s data.');
    req.clinic = clinicScope(db, req.user.clinic_id);
    next();
  };
}
