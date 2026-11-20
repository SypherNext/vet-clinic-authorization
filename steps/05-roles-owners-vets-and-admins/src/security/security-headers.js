// Response headers that tell the browser to be stricter with our pages.
export function securityHeaders(req, res, next) {
  res.set({
    // Only load scripts, styles and images from this site.
    'Content-Security-Policy':
      "default-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    // Never let another site show our pages inside a frame (clickjacking).
    'X-Frame-Options': 'DENY',
    // Do not guess file types.
    'X-Content-Type-Options': 'nosniff',
    // Never send our URLs to other sites.
    // (Not "no-referrer": then browsers send "Origin: null" on our own forms,
    // and the CSRF check could no longer tell our forms from anyone else's.)
    'Referrer-Policy': 'same-origin',
    // Pages with private data must not be kept in shared or back-button caches.
    'Cache-Control': 'no-store',
  });
  next();
}
