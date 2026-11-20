// Prints the rows of one table of the portal's database, to see what the
// app stored. Run it from the folder of the app you started (app/, start/
// or a step folder), after npm run seed:
//
//   node ../../examples/show-table.mjs record_shares
//   node ../../examples/show-table.mjs api_tokens id,user_id,name,scopes
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';

const DATABASE_FILE = 'data/vet-clinic.db';
const [table, columns = '*'] = process.argv.slice(2);
const NAME = /^[a-z_]+$/;
const COLUMN_LIST = /^(\*|[a-z_]+(,[a-z_]+)*)$/;
// Table and column names cannot be query parameters, so they are checked first.
if (!table || !NAME.test(table) || !COLUMN_LIST.test(columns)) {
  console.error('Usage: node show-table.mjs <table> [column,column,...]');
  process.exit(2);
}
if (!fs.existsSync(DATABASE_FILE)) {
  console.error(`No ${DATABASE_FILE} here. Run this in the folder of the app, after npm run seed.`);
  process.exit(1);
}
const db = new DatabaseSync(DATABASE_FILE, { readOnly: true });
console.table(db.prepare(`SELECT ${columns} FROM ${table}`).all());
