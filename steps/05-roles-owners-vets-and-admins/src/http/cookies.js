// Reads one cookie from the Cookie request header, for example
// "Cookie: theme=dark; session=abc123" -> readCookie(req, 'session') === 'abc123'.
export function readCookie(req, name) {
  const header = req.headers.cookie ?? '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}
