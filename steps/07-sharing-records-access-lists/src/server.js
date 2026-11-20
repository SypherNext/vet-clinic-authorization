// Starts the web server. Run it with `npm start`.
import { loadConfig } from './config.js';
import { systemClock } from './clock.js';
import { openDatabase } from './db/database.js';
import { createApp } from './app.js';

const config = loadConfig();
const db = openDatabase(config.databaseFile);
const app = createApp({ config, db, clock: systemClock });

app.listen(config.port, config.host, () => {
  console.log(`Vet clinic portal running at ${config.appOrigin}`);
});
