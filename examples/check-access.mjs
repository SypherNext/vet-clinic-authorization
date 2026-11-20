// Logs in as one of the made-up people and prints the status code the portal
// answers for each address. Works with app/, start/ and every step folder,
// as long as that copy is running on http://localhost:18900.
//
//   node examples/check-access.mjs olivia /pets/1 /records/3
//   node examples/check-access.mjs nobody /pets          (not logged in)
//
// 200 = allowed, 302 = sent to the login page, 403 = not allowed,
// 404 = not found (or not allowed to know it exists).
const BASE = process.env.APP_ORIGIN ?? 'http://localhost:18900';

// The seeded accounts from the README. All made up.
const PASSWORDS = {
  olivia: 'biscuit and mango love naps',
  ben: 'pepper the rabbit hops daily',
  noah: 'luna chases every red ball',
  sam: 'stethoscope on a rainy tuesday',
  lee: 'x-rays before lunch, always',
  kim: 'bandages and belly rubs all day',
  rosa: 'the appointment book never sleeps',
  admin: 'the front desk keeps the keys',
  priya: 'skin and coat specialist on call',
  jordan: 'riverside keys on a blue lanyard',
};

const [who, ...paths] = process.argv.slice(2);
if (!who || paths.length === 0 || (who !== 'nobody' && !PASSWORDS[who])) {
  console.error(`Usage: node examples/check-access.mjs <${Object.keys(PASSWORDS).join('|')}|nobody> <path> [more paths]`);
  process.exit(2);
}

let cookie = '';
async function request(method, path, form) {
  const response = await fetch(BASE + path, {
    method,
    redirect: 'manual',
    headers: { cookie, ...(form && { 'content-type': 'application/x-www-form-urlencoded' }) },
    body: form && new URLSearchParams(form),
  });
  const session = response.headers.getSetCookie().find((line) => line.startsWith('session='));
  if (session) cookie = session.split(';')[0];
  return response;
}

if (who !== 'nobody') {
  const loginPage = await (await request('GET', '/login')).text();
  const csrf = loginPage.match(/name="_csrf" value="([^"]+)"/)[1];
  const login = await request('POST', '/login', { _csrf: csrf, email: `${who}@vetclinic.test`, password: PASSWORDS[who] });
  if (login.status !== 302) {
    console.error(`Could not log in as ${who} (status ${login.status}). Is this person in this step's seed data?`);
    process.exit(1);
  }
}

const width = Math.max(...paths.map((p) => p.length));
for (const path of paths) {
  const response = await request('GET', path);
  const where = response.status === 302 ? ` -> ${response.headers.get('location')}` : '';
  console.log(`${who.padEnd(6)}  GET ${path.padEnd(width)}  ${response.status}${where}`);
}
