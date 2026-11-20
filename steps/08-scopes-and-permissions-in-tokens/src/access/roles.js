// The roles in the portal, and what each one may do.
//
// This is role-based access control (RBAC): a role is a named bundle of
// permissions, and each user has one role. To give receptionists a new page,
// you add one permission to their list here; no route changes.
//
// A permission is an action name such as 'record:view'. The routes ask for
// actions with authorize('record:view'); policy.js answers using this list.

export const ROLES = {
  owner: {
    label: 'Pet owner',
    home: '/pets',
    permissions: ['pets:list-own', 'pet:view', 'record:view', 'tokens:manage-own'],
  },
  vet: {
    label: 'Vet',
    home: '/patients',
    permissions: ['patients:list', 'pet:view', 'record:view', 'record:share', 'tokens:manage-own'],
  },
  receptionist: {
    label: 'Receptionist',
    home: '/appointments',
    permissions: ['appointments:list-all', 'tokens:manage-own'],
  },
  admin: {
    label: 'Clinic admin',
    home: '/admin/users',
    permissions: ['users:list', 'appointments:list-all', 'tokens:manage-own'],
  },
};

// An unknown role has no permissions at all.
export function roleAllows(role, action) {
  return ROLES[role]?.permissions.includes(action) ?? false;
}

// The page a user starts on, or null for a role with no start page (an
// unknown role): they stay on the plain welcome page.
export function homePathFor(user) {
  return ROLES[user.role]?.home ?? null;
}
