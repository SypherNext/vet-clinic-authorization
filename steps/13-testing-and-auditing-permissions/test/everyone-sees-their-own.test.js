// The milestone: every person sees their own pets, patients and buttons,
// and the menu shows only the pages the policy allows.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, users } from './helpers.js';

const PET_NAMES = ['Biscuit', 'Mango', 'Pepper'];

describe('everyone sees only their own', () => {
  let app;
  const browsers = {};
  before(async () => {
    app = await startTestApp();
    for (const name of ['olivia', 'ben', 'sam', 'lee', 'rosa', 'admin']) {
      browsers[name] = app.newBrowser();
      await browsers[name].logIn(users[name]);
    }
  });
  after(() => app.close());

  async function petsShownTo(name, path) {
    const page = await browsers[name].get(path);
    return PET_NAMES.filter((pet) => page.text.includes(pet));
  }

  it('shows each owner only their own pets', async () => {
    assert.deepEqual(await petsShownTo('olivia', '/pets'), ['Biscuit', 'Mango']);
    assert.deepEqual(await petsShownTo('ben', '/pets'), ['Pepper']);
  });

  it('shows each vet only their own patients', async () => {
    assert.deepEqual(await petsShownTo('sam', '/patients'), ['Biscuit', 'Mango']);
    assert.deepEqual(await petsShownTo('lee', '/patients'), ['Pepper']);
  });

  it('builds the menu from the policy', async () => {
    const ownerPage = (await browsers.olivia.get('/pets')).text;
    const adminPage = (await browsers.admin.get('/admin/users')).text;
    assert.match(ownerPage, />My pets</);
    assert.doesNotMatch(ownerPage, />Users</);
    assert.match(adminPage, />Users</);
    assert.doesNotMatch(adminPage, />My pets</);
  });

  it('shows the Sharing button only to the record author', async () => {
    assert.match((await browsers.lee.get('/records/3')).text, />Sharing</);
    assert.doesNotMatch((await browsers.ben.get('/records/3')).text, />Sharing</);
  });

  it('still refuses the address when the button is hidden', async () => {
    assert.equal((await browsers.ben.get('/records/3/sharing')).status, 403);
  });
});
