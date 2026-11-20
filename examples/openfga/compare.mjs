// Loads the portal's relationship model and its seeded relationship tuples
// into OpenFGA, asks OpenFGA and the portal's own small checker the same
// questions, and prints whether they agree.
//
//   docker compose -f examples/openfga/compose.yaml up -d
//   node examples/openfga/compare.mjs              (uses ./app)
//   node examples/openfga/compare.mjs steps/11-... (uses that step folder)
//
// Only Node's built-in fetch is used to talk to OpenFGA: no SDK needed.
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const appDir = path.resolve(repoRoot, process.argv[2] ?? 'app');
const fromApp = (file) => import(pathToFileURL(path.join(appDir, 'src', file)).href);
const { MODEL, createRelationships } = await fromApp('access/relationships.js');
const { openDatabase } = await fromApp('db/database.js');
const { seedDatabase } = await fromApp('db/seed.js');

const OPENFGA = process.env.OPENFGA_URL ?? 'http://127.0.0.1:18910';
const MAX_TUPLES_PER_WRITE = 100; // OpenFGA's default limit per write request
// The relation asked about for each type of object.
const QUESTIONS = { pet: 'viewer', record: 'viewer', team: 'manager' };

// ---- the model, in OpenFGA's two formats ---------------------------------

function toOpenFgaRewrite(way) {
  if (way.direct) return { this: {} };
  if (way.same) return { computedUserset: { relation: way.same } };
  return { tupleToUserset: { tupleset: { relation: way.via }, computedUserset: { relation: way.relation } } };
}

// The JSON that OpenFGA's API accepts.
export function toOpenFgaModel(model) {
  const typeDefinitions = Object.entries(model).map(([type, relations]) => {
    const names = Object.keys(relations);
    if (names.length === 0) return { type };
    const rewrites = Object.fromEntries(names.map((name) => {
      const ways = relations[name].map(toOpenFgaRewrite);
      return [name, ways.length === 1 ? ways[0] : { union: { child: ways } }];
    }));
    const metadata = Object.fromEntries(names.map((name) => [name, {
      directly_related_user_types: relations[name].flatMap((way) => way.direct ?? []).map((t) => ({ type: t })),
    }]));
    return { type, relations: rewrites, metadata: { relations: metadata } };
  });
  return { schema_version: '1.1', type_definitions: typeDefinitions };
}

function toDslWay(way) {
  if (way.direct) return `[${way.direct.join(', ')}]`;
  if (way.same) return way.same;
  return `${way.relation} from ${way.via}`;
}

// The same model in OpenFGA's modeling language, which is easier to read.
export function toDsl(model) {
  const lines = ['model', '  schema 1.1'];
  for (const [type, relations] of Object.entries(model)) {
    lines.push('', `type ${type}`);
    if (Object.keys(relations).length > 0) lines.push('  relations');
    for (const [name, ways] of Object.entries(relations)) lines.push(`    define ${name}: ${ways.map(toDslWay).join(' or ')}`);
  }
  return lines.join('\n');
}

// ---- talking to OpenFGA ---------------------------------------------------

async function openFga(method, urlPath, body) {
  const response = await fetch(OPENFGA + urlPath, {
    method, headers: { 'content-type': 'application/json' }, body: body && JSON.stringify(body),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(`${method} ${urlPath}: ${response.status} ${JSON.stringify(json)}`);
  return json;
}

async function loadIntoOpenFga(tuples) {
  const store = await openFga('POST', '/stores', { name: 'vet-clinic' });
  const { authorization_model_id: modelId } = await openFga('POST', `/stores/${store.id}/authorization-models`, toOpenFgaModel(MODEL));
  for (let i = 0; i < tuples.length; i += MAX_TUPLES_PER_WRITE) {
    const batch = tuples.slice(i, i + MAX_TUPLES_PER_WRITE);
    await openFga('POST', `/stores/${store.id}/write`, { writes: { tuple_keys: batch }, authorization_model_id: modelId });
  }
  return {
    check: async (user, relation, object) => (await openFga('POST', `/stores/${store.id}/check`, {
      authorization_model_id: modelId, tuple_key: { user, relation, object },
    })).allowed,
  };
}

// ---- the comparison -------------------------------------------------------

const db = openDatabase(':memory:');
await seedDatabase(db);
const tuples = db.prepare('SELECT subject AS user, relation, object FROM relationship_tuples').all();
const people = db.prepare('SELECT id, name FROM users ORDER BY id').all();
const objects = Object.keys(QUESTIONS).flatMap((type) => db.prepare(`SELECT DISTINCT object FROM relationship_tuples
  WHERE object LIKE '${type}:%' ORDER BY length(object), object`).all().map((row) => row.object));

console.log(toDsl(MODEL));
console.log(`\nLoaded ${tuples.length} relationship tuples into OpenFGA at ${OPENFGA}`);
const local = createRelationships(db);
const remote = await loadIntoOpenFga(tuples);

let agree = 0;
const rows = [];
for (const object of objects) {
  const relation = QUESTIONS[object.split(':')[0]];
  const allowed = [];
  for (const person of people) {
    const user = `user:${person.id}`;
    const mine = local.check(user, relation, object);
    const theirs = await remote.check(user, relation, object);
    if (mine === theirs) agree += 1;
    else console.log(`DIFFERENT: ${user} ${relation} ${object}: portal ${mine}, OpenFGA ${theirs}`);
    if (theirs) allowed.push(person.name);
  }
  rows.push(`${object.padEnd(9)} ${relation.padEnd(8)} ${allowed.join(', ') || '(nobody)'}`);
}
console.log(`\nWho is allowed, according to OpenFGA:\n${rows.join('\n')}`);
console.log(`\n${objects.length * people.length} checks, ${agree} with the same answer from the portal and OpenFGA.`);
