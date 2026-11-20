// Prints the permission table: every case, what the app answered, and why.
// Run it with `npm run permissions`. It starts its own copy of the app with
// an in-memory database, so it never touches data/vet-clinic.db.
import { startTestApp } from '../test/helpers.js';
import { runPermissionCases, formatResults } from '../test/permission-table.js';

const app = await startTestApp();
const results = await runPermissionCases(app);
await app.close();
console.log(formatResults(results));
process.exitCode = results.every((r) => r.passed) ? 0 : 1;
