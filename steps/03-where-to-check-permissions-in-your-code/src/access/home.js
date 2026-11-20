// The page each kind of person sees first after logging in.
const HOME_PATHS = {
  owner: '/pets',
  vet: '/patients',
  admin: '/admin/users',
};

export function homePathFor(user) {
  return HOME_PATHS[user.role] ?? '/';
}
