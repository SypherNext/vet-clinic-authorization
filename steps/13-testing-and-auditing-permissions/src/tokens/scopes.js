// Scopes: what an API token is allowed to be used for.
//
// A scope is a bundle of actions, like a role, but it belongs to one token
// instead of one person. A request made with a token passes only if BOTH say
// yes: the token's scopes allow the action, and the policy allows the user.
// So a token can never do more than the person who made it.
//
// No scope includes 'record:share': sharing is only possible in the browser.
import { roleAllows } from '../access/roles.js';

export const SCOPES = {
  'pets:read': {
    description: 'Read your pets and their details',
    actions: ['pets:list-own', 'pet:view'],
  },
  'records:read': {
    description: 'Read medical records you are allowed to see',
    actions: ['record:view'],
  },
  'appointments:read': {
    description: 'Read appointment lists',
    actions: ['patients:list', 'appointments:list-all'],
  },
};

export function scopesAllow(scopes, action) {
  return scopes.some((scope) => SCOPES[scope]?.actions.includes(action));
}

// The scope that would allow an action, for the error message.
export function scopeFor(action) {
  return Object.keys(SCOPES).find((scope) => SCOPES[scope].actions.includes(action)) ?? null;
}

// Only the scopes that could ever help this role: an owner is never offered
// 'appointments:read', because no owner may list appointments anyway.
export function scopesForRole(role) {
  return Object.keys(SCOPES).filter((scope) => SCOPES[scope].actions.some((action) => roleAllows(role, action)));
}
