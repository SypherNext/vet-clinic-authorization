// Lets page templates ask the policy instead of checking roles themselves.
//
// In a template, <% if (can('record:share', record)) { %> shows a button only
// to people who may use it. That is for a tidy page, not for safety: the
// route behind the button still runs authorize(), so typing the address
// by hand gets the same answer.
import { can } from './policy.js';

// The menu. Each link appears only for users the policy allows.
export const MENU = [
  { label: 'My pets', path: '/pets', action: 'pets:list-own' },
  { label: 'My patients', path: '/patients', action: 'patients:list' },
  { label: 'Appointments', path: '/appointments', action: 'appointments:list-all' },
  { label: 'Users', path: '/admin/users', action: 'users:list' },
  { label: 'API tokens', path: '/account/tokens', action: 'tokens:manage-own' },
];

export function viewPermissions(req, res, next) {
  res.locals.can = (action, resource = null) => can(req.user, action, resource);
  res.locals.menu = MENU.filter((link) => can(req.user, link.action));
  next();
}
