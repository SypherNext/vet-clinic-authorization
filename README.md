# Maple Vet Network portal: authorization

Companion code for the Sypher course **"Authorization: Roles, Permissions and Multi-Tenancy"**.

The app is a small portal for a network of vet clinics. Pet owners see their pets, vets and vet nurses see the pets in their care, receptionists keep the appointment book, and clinic admins manage care teams and read an audit log. The course is about the question every one of those pages asks: now that the portal knows who you are, what may you see and do?

It is a server-rendered Express 5 app in plain modern JavaScript (no TypeScript, no build step), with EJS templates and SQLite through Node's built-in `node:sqlite` module. Logging in uses an email and a password stored as an argon2id hash, and a session cookie. One lesson also runs OpenFGA, an open-source authorization server, in Docker.

All people, pets and medical notes in this repository are made up. Never use the seeded passwords anywhere real.

## Set up your computer

You need Node.js 24 (an LTS release) and Git. Docker is only needed for the OpenFGA part of lesson 11. Commands are for a bash shell: the terminal on macOS and Linux, or Git Bash or WSL on Windows.

| Tool | Windows | macOS | Ubuntu or Debian |
| --- | --- | --- | --- |
| Node.js 24 | `winget install Schniz.fnm`, then `fnm install 24` and `fnm use 24` | `brew install fnm`, then `fnm install 24` and `fnm use 24` | `curl -fsSL https://fnm.vercel.app/install \| bash`, then `fnm install 24` and `fnm use 24` |
| Git | `winget install --id Git.Git -e` | `brew install git` | `sudo apt install -y git` |
| Docker (lesson 11 only) | `winget install -e --id Docker.DockerDesktop` (needs WSL 2) | `brew install --cask docker` | `curl -fsSL https://get.docker.com \| sh` |

fnm needs one line of shell setup before `fnm use` works and a new terminal finds `node`. The Linux install script adds it for you. After `winget` or `brew`, add it yourself (on Windows, install Git first so you have Git Bash), then open a new terminal:

```bash
# Git Bash, WSL or Linux bash: add to ~/.bashrc
eval "$(fnm env --use-on-cd --shell bash)"
# macOS (zsh is the default shell): add to ~/.zshrc
eval "$(fnm env --use-on-cd --shell zsh)"
```

Check them in a new terminal:

```bash
node --version     # v24.x.x
npm --version      # 11.x.x
git --version
docker version     # needs both a Client and a Server section
```

The password library (`argon2`) ships ready-made binaries for Windows, macOS and Linux, so you do not need any C++ build tools. Recent npm versions print a warning that the install script of `argon2` is not yet approved (`npm warn allow-scripts`). You can ignore it: the ready-made binary is already in the download.

## Run the app

```bash
git clone <vet-clinic-authorization repository URL> vet-clinic-authorization
cd vet-clinic-authorization/app
npm ci                  # install the exact versions in package-lock.json
npm run seed            # create data/vet-clinic.db with fake people, pets and records
npm start               # http://localhost:18900
```

Open **http://localhost:18900** and log in as any of these made-up people:

| Email | Password | Role |
| --- | --- | --- |
| olivia@vetclinic.test | `biscuit and mango love naps` | pet owner (Biscuit and Mango, at Maple Street) |
| ben@vetclinic.test | `pepper the rabbit hops daily` | pet owner (Pepper, at Maple Street) |
| noah@vetclinic.test | `luna chases every red ball` | pet owner (Luna, at Riverside) |
| sam@vetclinic.test | `stethoscope on a rainy tuesday` | vet, Maple Street |
| lee@vetclinic.test | `x-rays before lunch, always` | vet, Maple Street |
| kim@vetclinic.test | `bandages and belly rubs all day` | vet nurse, Maple Street |
| rosa@vetclinic.test | `the appointment book never sleeps` | receptionist, Maple Street |
| admin@vetclinic.test | `the front desk keeps the keys` | clinic admin, Maple Street |
| priya@vetclinic.test | `skin and coat specialist on call` | vet, Riverside |
| jordan@vetclinic.test | `riverside keys on a blue lanyard` | clinic admin, Riverside |

`npm run seed` deletes the database and starts again, so you can always get back to this state. Referral dates are counted from the day you seed: Biscuit's referral to Dr. Priya is always running, Mango's has always ended.

Stop the app with Ctrl+C.

## Run the tests

```bash
cd app
npm test                # every test, about 90 of them
npm run permissions     # the permission table, printed as a table
```

The tests start the app on a random port with an in-memory database and a fake clock, so they need neither Docker nor the network.

## OpenFGA (lesson 11)

```bash
docker compose -f examples/openfga/compose.yaml up -d    # container azrp-openfga on 127.0.0.1:18910
node examples/openfga/compare.mjs                        # same questions to the portal and to OpenFGA
docker compose -f examples/openfga/compose.yaml down
```

Run these from the repository's top folder, after `npm ci` in `app/`.

## Project layout

```text
vet-clinic-authorization/
  start/                      the starting portal: password login, sessions, and scattered permission checks
  steps/                      the app at the end of each lesson that changes it
  app/                        the finished app at the end of the course
    .env.example              every setting, with its default value
    src/
      server.js               starts the server with the real database and clock
      app.js                  builds the Express app from its parts (deps passed in)
      config.js               every setting and limit in one place
      access/                 roles, the policy, authorize(), relationships, view helpers
      tenancy/clinic-scope.js every list of clinic data, filtered by clinic
      audit/decision-log.js   the audit log of permission decisions
      tokens/                 API tokens, scopes and Bearer authentication
      sharing/                a record's access list and its sharing page
      teams/                  care teams and the "My care team" page
      referrals/              referrals and their dates
      portal/                 the clinic pages, their queries and row loaders
      api/api-routes.js       the JSON API
      db/                     node:sqlite connection, numbered migrations, seed data
      auth/  sessions/        password login and session cookies
      security/  http/        CSRF, rate limits, headers, errors, input checks
      views/  public/         EJS page templates and the stylesheet
    scripts/permission-table.mjs   prints the permission table
    test/                     node:test tests, helpers and the permission table
  examples/openfga/           OpenFGA in Docker, and a script that compares its answers with the portal's
```

### Steps

Each folder in `steps/` is a complete, runnable copy of the app at the end of one lesson. Open the folder, then run `npm install`, `npm run seed` and `npm start` inside it (stop any other copy first: they all use port 18900).

| Folder | What the lesson adds |
| --- | --- |
| `start/` | the starting point: login works, permission checks are scattered and incomplete (on purpose) |
| `03-where-to-check-permissions-in-your-code` | one policy module and one `authorize()` middleware |
| `04-milestone-your-first-protected-page` | medical records for vets only, and a 403 page |
| `05-roles-owners-vets-and-admins` | roles as bundles of permissions, and a receptionist |
| `06-is-this-your-pet-ownership` | ownership rules, and 404 for rows you may not see |
| `07-sharing-records-access-lists` | sharing a record with another vet |
| `08-scopes-and-permissions-in-tokens` | API tokens with scopes, and a JSON API |
| `09-milestone-everyone-sees-only-their-own` | the menu and buttons ask the policy |
| `10-rules-beyond-roles-attributes-and-policies` | a second clinic, referrals with dates, attribute rules |
| `11-relationships-teams-clinics-and-shared-records` | care teams and a small relationship model |
| `12-several-clinics-in-one-app-multi-tenancy` | every clinic list filtered by clinic, and the test that proves it |
| `13-testing-and-auditing-permissions` | the permission table and the audit log |
| `14-capstone-permissions-for-the-whole-clinic-network` | points to `app/`, which is the capstone |

Lessons 0, 1 and 2 do not change the code. The starting point is based on the portal from the course Authentication Basics, trimmed to password login and sessions (no sign-up, email links, one-time codes, authenticator apps or passkeys), with pet pages and medical records added. You do not need that course to use this repository.

## Troubleshooting

- **`EADDRINUSE` on port 18900:** another copy of the app (perhaps another step) is running. Stop it, or start this one with `PORT=18901 APP_ORIGIN=http://localhost:18901 npm start`.
- **"Form expired" (403) after re-seeding:** the page was loaded before you re-seeded the database. Reload it and try again.
- **A page you expect to see answers "Page not found":** the app answers 404, not 403, when you may not even know a pet or record exists. Check who you are logged in as (top right).
- **`compare.mjs` fails with `ECONNREFUSED 127.0.0.1:18910`:** OpenFGA is not running. Start it with the `docker compose` command above and wait a few seconds.
- **`npm warn allow-scripts ... argon2`:** expected; see "Set up your computer".
- **Git Bash rewrites paths that start with `/`:** run `export MSYS_NO_PATHCONV=1` first.

## License

Copyright (C) 2026 SypherNext

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). You may
use, study and change it. If you share a modified version, or run one as a website or service
that other people use, you must make your full modified source code available under the same
license. See [LICENSE](LICENSE) for the full terms.
