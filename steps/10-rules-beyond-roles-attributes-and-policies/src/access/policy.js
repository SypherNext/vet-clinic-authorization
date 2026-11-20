// Every permission decision in the app goes through policy.can().
//
// can(user, action, resource) answers one question: may this user do this
// action (to this resource)? It returns true or false and changes nothing.
// Two checks, in order:
//   1. The role must allow the action at all (roles.js).
//   2. If the action is about one particular row, that row's rule must pass.
// An action that no role lists is refused: the app denies by default.
//
// Since lesson 10 the rules look at attributes: facts about the user (role,
// clinic), about the row (its clinic, its referrals) and about the moment
// (today's date). The date comes from the clock passed in, so a test can
// pick the day.
import { roleAllows } from './roles.js';
import { todayOf } from '../clock.js';
import { isActiveOn } from '../referrals/referrals.js';

// Pets and records carry owner_id, clinic_id, vet_ids and referrals; records
// also carry author_id and shared_with, their access list (see portal-data.js).
const isOwner = (user, row) => row.owner_id === user.id;
const isTreatingVet = (user, row) => row.vet_ids.includes(user.id);
const isAuthor = (user, record) => record.author_id === user.id;
const isSharedWith = (user, record) => record.shared_with.includes(user.id);
const worksAtClinicOf = (user, row) => user.clinic_id !== null && user.clinic_id === row.clinic_id;
const isReferredVet = (user, row, env) =>
  row.referrals.some((referral) => referral.to_vet_id === user.id && isActiveOn(referral, env.today));

const RESOURCE_RULES = {
  'pet:view': (user, pet, env) =>
    isOwner(user, pet) || isTreatingVet(user, pet) || isReferredVet(user, pet, env)
    // The role is one more attribute: the front desk sees every pet at its own clinic.
    || (user.role === 'receptionist' && worksAtClinicOf(user, pet)),
  'record:view': (user, record, env) =>
    isOwner(user, record) || isTreatingVet(user, record) || isSharedWith(user, record)
    || isReferredVet(user, record, env),
  // Only the vet who wrote a record decides who else may read it.
  'record:share': (user, record) => isAuthor(user, record),
};

export function createPolicy({ clock }) {
  function can(user, action, resource = null) {
    if (!user) return false;
    if (!roleAllows(user.role, action)) return false;
    const rule = RESOURCE_RULES[action];
    if (!rule) return true;
    // A row rule with no row to look at is a mistake in the route: refuse.
    return resource !== null && rule(user, resource, { today: todayOf(clock) });
  }
  return { can };
}
