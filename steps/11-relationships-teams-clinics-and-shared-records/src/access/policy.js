// Every permission decision in the app goes through policy.can().
//
// can(user, action, resource) answers one question: may this user do this
// action (to this resource)? It returns true or false and changes nothing.
// Two checks, in order:
//   1. The role must allow the action at all (roles.js).
//   2. If the action is about one particular row, that row's rule must pass.
// An action that no role lists is refused: the app denies by default.
//
// Since lesson 11 the row rules ask the relationship model "is this user
// connected to this row?" (relationships.js), and keep one attribute rule
// that a relationship cannot express on its own: a referral only counts
// between its start and end dates.
import { roleAllows } from './roles.js';
import { todayOf } from '../clock.js';
import { isActiveOn } from '../referrals/referrals.js';

// Pets and records carry their kind, id and referrals (see portal-data.js).
const isReferredVet = (user, row, env) =>
  row.referrals.some((referral) => referral.to_vet_id === user.id && isActiveOn(referral, env.today));

const RESOURCE_RULES = {
  'pet:view': (user, pet, env) => env.related(user, 'viewer', pet) || isReferredVet(user, pet, env),
  'record:view': (user, record, env) => env.related(user, 'viewer', record) || isReferredVet(user, record, env),
  'record:share': (user, record, env) => env.related(user, 'sharer', record),
  'team:manage': (user, team, env) => env.related(user, 'manager', team),
};

export function createPolicy({ clock, relationships }) {
  const related = (user, relation, row) => relationships.check(`user:${user.id}`, relation, `${row.kind}:${row.id}`);

  function can(user, action, resource = null) {
    if (!user) return false;
    if (!roleAllows(user.role, action)) return false;
    const rule = RESOURCE_RULES[action];
    if (!rule) return true;
    // A row rule with no row to look at is a mistake in the route: refuse.
    return resource !== null && rule(user, resource, { today: todayOf(clock), related });
  }
  return { can };
}
