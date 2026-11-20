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
    permissions: ['patients:list', 'care-team:list', 'pet:view', 'record:view', 'record:share', 'tokens:manage-own'],
  },
  // Added in the capstone: a vet nurse reads the notes of the pets on their
  // care team, but does not write or share records. No route changed for it.
  vet_nurse: {
    label: 'Vet nurse',
    home: '/care-team',
    permissions: ['care-team:list', 'pet:view', 'record:view', 'tokens:manage-own'],
  },
  receptionist: {
    label: 'Receptionist',
    home: '/appointments',
    permissions: ['appointments:list-all', 'pet:view', 'tokens:manage-own'],
  },
  admin: {
    label: 'Clinic admin',
    home: '/admin/users',
    permissions: ['users:list', 'appointments:list-all', 'teams:list', 'team:manage', 'audit:view', 'roles:view', 'tokens:manage-own'],
  },
};

// An unknown role has no permissions at all.
export function roleAllows(role, action) {
  return ROLES[role]?.permissions.includes(action) ?? false;
}

export function roleLabel(role) {
  return ROLES[role]?.label ?? role;
}

// Every action any role lists, in the order they first appear.
export function allActions() {
  return [...new Set(Object.values(ROLES).flatMap((role) => role.permissions))];
}

// The page a user starts on, or null for a role with no start page (an
// unknown role): they stay on the plain welcome page.
export function homePathFor(user) {
  return ROLES[user.role]?.home ?? null;
}
