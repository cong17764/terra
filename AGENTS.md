# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Overview

Terra is a static frontend for a JW (Jehovah's Witnesses) territory/door-to-door
visits service. It is a **vanilla JavaScript PWA** (no build step, no framework,
no bundler) that talks to a **Google Apps Script web app** which reads and
writes Google Spreadsheets. The UI is in Russian.

## Repository Layout

```
docs/            # The web app itself. This directory is what gets published
  index.html     #   Single-page app entry point
  app.js         #   Main app logic (screens, tiles, status dialog, settings)
  agent.js       #   Backend client: deployment ID, sheet config, data cache
  util.js        #   Date/note formatting helpers
  worker.js      #   Service worker (PWA install + cache)
  styles.css     #   Main styles
  status.css     #   Status tile colors
  app.webmanifest#   PWA manifest
  icons/         #   PWA icons
  agent.gs       # Google Apps Script backend (doGet). Deployed separately,
                 #   NOT part of the web build.
main.js          # Local dev server: HTTPS on :8443, serves ./docs statically
Dockerfile       # Container for the dev server (node + self-signed certs)
compose.yaml     # Docker Compose: runs the dev server, mounts ./docs
package.json     # Only devDependencies (express); scripts: certs, start
```

## Deployment Model (IMPORTANT)

- **GitHub Pages is the production host.** The site root is `docs/` — GitHub
  Pages serves the contents of that directory at the repo root. All relative
  asset paths inside `docs/` (e.g. `icons/...`, `styles.css`) must stay
  relative; do **not** introduce absolute paths like `/styles.css`.
- There is **no build step and no CI**. Pushing to the default branch is the
  deploy. Don't add build pipelines unless explicitly asked.
- `main.js`, `Dockerfile`, `compose.yaml`, and `package.json` are for local
  development only (self-signed HTTPS so the service worker and
  `navigator.share` work). They are never part of the published site.

## Running Locally

```sh
npm install        # installs express (dev only)
npm run certs      # generates selfsigned.key / selfsigned.crt (gitignored)
npm start          # https://localhost:8443/
```

Or via Docker: `docker compose up` (mounts `./docs` live, so edits are
reflected without rebuild).

The app needs no local backend: on first run it shows the settings screen
where the user enters their **Agent Deployment ID** and one or more Google
Spreadsheet URLs.

## Backend Contract (agent.gs ↔ docs/agent.js)

The Apps Script web app is deployed at
`https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec` and exposes a single
`doGet` with optional query params:

| param | meaning                                        |
|-------|------------------------------------------------|
| `x`   | Google Spreadsheet ID                          |
| `l`   | sheet (location) index, zero-based             |
| `a`   | accommodation (row) index, zero-based          |
| `s`   | status value to write (2nd column)             |
| `n`   | cell note to write (or empty string to clear)  |

- No params → returns spreadsheet name + all locations.
- `x`+`l` → returns that location's accommodations.
- `x`+`l`+`a` (no `s`/`n`) → returns that row.
- `x`+`l`+`a`+`s`/`n` → **writes** status/note, then returns the updated row.

Spreadsheet format: each sheet is a location; column 1 = house number,
column 2 = status. The status cell's **note** encodes metadata as
`<ISO timestamp>[#]` — trailing `#` means "no ring" (see `parseNote`/
`formatNote` in `docs/util.js`). The list of allowed statuses is read from
the data-validation rule on column 2.

If you change the contract, update **both** `agent.gs` and `docs/agent.js`
together, and remember the Apps Script must be re-deployed by the user.

## PWA / Service Worker

`docs/worker.js` caches a **hardcoded list** of assets (the `content` array)
under a versioned cache name. When you add, rename, or remove any file under
`docs/` that the app loads, **also update the `content` array and bump
`version`** — otherwise the PWA install cache goes stale.

**Bump `version` every time the worker code itself changes**, so the browser
reloads the worker on the next run.

## Coding Conventions

- Vanilla JS, ES modules in the browser (`type="module"`), no TypeScript,
  no linter/formatter configured — match the existing style (tabs in most
  files, jQuery for DOM manipulation in `app.js`).
- Keep it dependency-free at runtime; the only external runtime dependency is
  jQuery from the jsDelivr CDN (pinned in `index.html` with an integrity
  hash, and mirrored in the worker cache list).
- UI strings are Russian; keep them in Russian.
- Config (deployment ID + sheet list) lives in a **cookie** named `terra`
  (value: `DEPLOYMENT_ID+sheet1+sheet2`, same format as the share URL
  fragment). Fetched sheet data lives in `localStorage` (one key per
  spreadsheet ID) as a disposable cache. Don't move this to IndexedDB or
  change the cookie name without a reason.
- `package-lock.json` is gitignored and `node_modules/` is committed for the
  dev server; don't "clean up" that.

## Verification

There are no tests. To verify frontend changes: run the local server
(`npm start` or `docker compose up`) and check the page at
`https://localhost:8443/`. Without a valid deployment ID and spreadsheet you
can at least verify the settings screen, static assets, and service worker
registration.
