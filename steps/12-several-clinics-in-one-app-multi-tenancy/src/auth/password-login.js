// Checking an email and password. The login form uses this; the result is
// either { user } or { failure: true }, never a hint about which part was wrong.
import { findUserByEmail } from '../users/users.js';
import { verifyPassword, spendTimeOfOneCheck } from './password-hashing.js';

export async function checkPasswordLogin(db, { email, password }) {
  const user = findUserByEmail(db, email);
  if (!user || !user.password_hash) {
    await spendTimeOfOneCheck(password);
    return { failure: true };
  }
  if (!(await verifyPassword(user.password_hash, password))) return { failure: true };
  return { user };
}

// The same words for a wrong email and a wrong password, so the form does
// not reveal which emails have accounts.
export const LOGIN_FAILED_MESSAGE = 'That email and password do not match an account.';
