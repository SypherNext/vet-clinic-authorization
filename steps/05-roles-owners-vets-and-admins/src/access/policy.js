// Every permission decision in the app goes through can().
//
// can(user, action, resource) answers one question: may this user do this
// action (to this resource)? It returns true or false and changes nothing.
// Right now the answer depends only on the user's role (see roles.js). An
// action that no role lists is refused: the app denies by default.
import { roleAllows } from './roles.js';

export function can(user, action, resource = null) {
  if (!user) return false;
  return roleAllows(user.role, action);
}
