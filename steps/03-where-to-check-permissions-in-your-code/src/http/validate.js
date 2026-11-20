// Turns raw form fields into clean values. Each function returns the cleaned
// value, or null when the input is not acceptable. Routes never trust a field
// they have not passed through one of these.

const MAX_EMAIL_LENGTH = 254;
// Deliberately simple: something@something.something, no spaces.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function readEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_SHAPE.test(email)) return null;
  return email;
}

// Passwords are never trimmed: a space at the end is part of the password.
export function readPassword(value, { maxLength }) {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) return null;
  return value;
}
