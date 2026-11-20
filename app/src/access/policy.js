// Every permission decision in the app goes through the policy.
//
// decide(user, action, resource) answers one question: may this user do this
// action (to this resource)? It returns { allowed, reason } and changes
// nothing. can() is the same question when only yes or no matters.
// Two checks, in order:
//   1. The role must allow the action at all (roles.js).
//   2. If the action is about one particular row, that row's rule must pass.
// An action that no role lists is refused: the app denies by default.
//
// The row rules ask the relationship model "is this user connected to this
// row?" (relationships.js), and keep one attribute rule that a relationship
// cannot express on its own: a referral only counts between its dates.
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

const allow = (reason) => ({ allowed: true, reason });
const deny = (reason) => ({ allowed: false, reason });

export function createPolicy({ clock, relationships }) {
  const related = (user, relation, row) => relationships.check(`user:${user.id}`, relation, `${row.kind}:${row.id}`);

  function decide(user, action, resource = null) {
    if (!user) return deny('not logged in');
    if (!roleAllows(user.role, action)) return deny(`role ${user.role} does not include ${action}`);
    const rule = RESOURCE_RULES[action];
    if (!rule) return allow(`role ${user.role} includes ${action}`);
    // A row rule with no row to look at is a mistake in the route: refuse.
    if (resource === null) return deny(`${action} needs a row to check`);
    return rule(user, resource, { today: todayOf(clock), related })
      ? allow(`the ${resource.kind} rule for ${action} passed`)
      : deny(`the ${resource.kind} rule for ${action} said no`);
  }

  const can = (user, action, resource = null) => decide(user, action, resource).allowed;
  return { decide, can };
}
