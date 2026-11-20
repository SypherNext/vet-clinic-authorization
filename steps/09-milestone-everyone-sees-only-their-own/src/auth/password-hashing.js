// Turning passwords into hashes and checking them, with argon2id.
//
// A hash is one-way: you cannot turn it back into the password. argon2id is
// also deliberately slow and memory hungry, so an attacker who steals the
// database can only try a few guesses per second per computer instead of
// billions.
import * as argon2 from 'argon2';

// The OWASP Password Storage Cheat Sheet's minimum for argon2id:
// 19 MiB of memory, 2 passes, 1 thread.
const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // in KiB
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(password) {
  return argon2.hash(password, HASH_OPTIONS);
}

export async function verifyPassword(hash, password) {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false; // a damaged hash never matches
  }
}

// When nobody has that email, still spend the time of one password check,
// so the response time does not reveal which emails have accounts.
let dummyHash = null;
export async function spendTimeOfOneCheck(password) {
  dummyHash ??= await hashPassword('no-account-has-this-password');
  await verifyPassword(dummyHash, password);
}
