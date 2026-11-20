// Opens the SQLite database with Node's built-in node:sqlite module and
// brings its tables up to date.
//
// Migrations are the numbered .sql files in ./migrations. Each file runs once,
// in name order, and its name is then recorded in the schema_migrations table.
// To change the schema, add a new file with the next number. Never edit a file
// that has already run.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const migrationsDir = path.join(import.meta.dirname, 'migrations');

export function openDatabase(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file, { timeout: 5000 });
  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL');
  runMigrations(db);
  return db;
}

export function runMigrations(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);
  const done = new Set(db.prepare('SELECT name FROM schema_migrations').all().map((row) => row.name));
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const name of files) {
    if (done.has(name)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, name), 'utf8');
    db.exec('BEGIN');
    try {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)').run(name, new Date().toISOString());
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw new Error(`migration ${name} failed: ${err.message}`);
    }
  }
}
