// Lets page templates ask the policy instead of checking roles themselves.
//
// In a template, <% if (can('record:share', record)) { %> shows a button only
// to people who may use it. That is for a tidy page, not for safety: the
// route behind the button still runs authorize(), so typing the address
// by hand gets the same answer.
//
// roleCan('record:view') asks only the first half of the policy: does the
// role allow this kind of action at all? Pages use it to leave out whole
// sections, such as medical records on a receptionist's pet page.
import { roleAllows } from './roles.js';

// The menu. Each link appears only for users the policy allows.
export const MENU = [
  { label: 'My pets', path: '/pets', action: 'pets:list-own' },
  { label: 'My patients', path: '/patients', action: 'patients:list' },
  { label: 'Appointments', path: '/appointments', action: 'appointments:list-all' },
  { label: 'Users', path: '/admin/users', action: 'users:list' },
  { label: 'API tokens', path: '/account/tokens', action: 'tokens:manage-own' },
];

export function viewPermissions({ policy }) {
  return (req, res, next) => {
    res.locals.can = (action, resource = null) => policy.can(req.user, action, resource);
    res.locals.roleCan = (action) => req.user !== null && roleAllows(req.user.role, action);
    res.locals.menu = MENU.filter((link) => policy.can(req.user, link.action));
    next();
  };
}
