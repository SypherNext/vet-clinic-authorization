// Runs the permission table against a running test app. The test file and
// `npm run permissions` both use this, so they can never disagree.
import { users } from './helpers.js';
import { PERMISSION_CASES } from './permission-cases.js';

export async function runPermissionCases(app, cases = PERMISSION_CASES) {
  // One logged-in browser per person, reused for all of their rows.
  const browsers = new Map();
  async function browserFor(who) {
    if (!who) return app.newBrowser();
    if (!browsers.has(who)) {
      const browser = app.newBrowser();
      await browser.logIn(users[who]);
      browsers.set(who, browser);
    }
    return browsers.get(who);
  }

  const results = [];
  for (const row of cases) {
    const got = (await (await browserFor(row.who)).get(row.path)).status;
    results.push({ ...row, got, passed: got === row.expect });
  }
  return results;
}

// The results as a plain text table, for the terminal.
export function formatResults(results) {
  const header = ['WHO', 'GET', 'EXPECT', 'GOT', '', 'WHY'];
  const rows = results.map((r) => [r.who ?? '(nobody)', r.path, String(r.expect), String(r.got), r.passed ? 'ok' : 'FAIL', r.why]);
  const widths = header.map((_, column) => Math.max(...[header, ...rows].map((row) => row[column].length)));
  const line = (row) => row.map((cell, column) => cell.padEnd(widths[column])).join('  ').trimEnd();
  const failed = results.filter((r) => !r.passed).length;
  return [line(header), ...rows.map(line), '', `${results.length} cases, ${results.length - failed} passed, ${failed} failed`].join('\n');
}
