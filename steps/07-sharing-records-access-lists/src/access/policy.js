// Every permission decision in the app goes through can().
//
// can(user, action, resource) answers one question: may this user do this
// action (to this resource)? It returns true or false and changes nothing.
// Two checks, in order:
//   1. The role must allow the action at all (roles.js).
//   2. If the action is about one particular row, that row's rule must pass:
//      the role says "vets may read records", the rule says "which ones".
// An action that no role lists is refused: the app denies by default.
import { roleAllows } from './roles.js';

// Pets and records both carry owner_id and vet_ids; records also carry
// author_id and shared_with, their access list (see portal-data.js).
const isOwner = (user, row) => row.owner_id === user.id;
const isTreatingVet = (user, row) => row.vet_ids.includes(user.id);
const isAuthor = (user, record) => record.author_id === user.id;
const isSharedWith = (user, record) => record.shared_with.includes(user.id);

const RESOURCE_RULES = {
  'pet:view': (user, pet) => isOwner(user, pet) || isTreatingVet(user, pet),
  'record:view': (user, record) =>
    isOwner(user, record) || isTreatingVet(user, record) || isSharedWith(user, record),
  // Only the vet who wrote a record decides who else may read it.
  'record:share': (user, record) => isAuthor(user, record),
};

export function can(user, action, resource = null) {
  if (!user) return false;
  if (!roleAllows(user.role, action)) return false;
  const rule = RESOURCE_RULES[action];
  if (!rule) return true;
  // A row rule with no row to look at is a mistake in the route: refuse.
  return resource !== null && rule(user, resource);
}
