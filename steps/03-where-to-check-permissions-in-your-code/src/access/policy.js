// Every permission rule in the app, in one place.
//
// can(user, action, resource) answers one question: may this user do this
// action (to this resource)? It returns true or false and changes nothing.
// An action is a short name such as 'record:view'. An action that has no
// rule here is always refused: the app denies by default.

const RULES = {
  'pets:list-own': (user) => user.role === 'owner',
  'patients:list': (user) => user.role === 'vet',
  'users:list': (user) => user.role === 'admin',
  // Still open to anyone who is logged in, exactly as before this lesson.
  // The gap is now written down in one place; lesson 4 closes it.
  'pet:view': () => true,
  'record:view': () => true,
};

export function can(user, action, resource = null) {
  if (!user) return false;
  const rule = RULES[action];
  if (!rule) return false;
  return rule(user, resource);
}
