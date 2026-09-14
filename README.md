# terra

JW Territory service frontend — a static PWA for managing door-to-door visit
statuses. The UI is in Russian.

## Architecture

The frontend is a vanilla JavaScript single-page app (no build step, no
framework) that talks to a [Google Apps Script](agent.gs) web app. The script
reads and writes [Google Spreadsheets](https://sheets.google.com): each sheet
is a location, each row is an accommodation (house number + status), and the
status cell's note stores the modification timestamp.

Configuration (the Apps Script deployment ID and the spreadsheet URLs) is
entered by the user on the settings screen on first run and stored in
`localStorage`. A shared URL (`#<deployment ID>+<sheet ID>+...`) can be used
to import the configuration on another device.

The app is installable as a PWA (service worker in `docs/worker.js` caches
the assets).

## Repository layout

```
docs/            # The web app. This directory is published on GitHub Pages.
agent.gs         # Google Apps Script backend (deployed separately).
main.js          # Local development server (HTTPS on :8443).
Dockerfile       # Container for the dev server.
compose.yaml     # Docker Compose for the dev server.
```

## Running locally

The app needs HTTPS for the service worker and `navigator.share`, so the dev
server serves `./docs` over self-signed HTTPS on `https://localhost:8443/`.

### Node

```sh
npm install        # installs dev dependencies (express)
npm run certs      # generates selfsigned.key / selfsigned.crt
npm start          # serves ./docs at https://localhost:8443/
```

### Docker

```sh
docker compose up  # builds the image, serves ./docs live (no rebuild on edits)
```

### Backend

No local backend is needed. After the app is served, open the settings screen
(Настройки) and enter:

- **Agent Deployment ID** — from the Apps Script deployment
  (`https://script.google.com/macros/s/<DEPLOYMENT ID>/exec`).
- **Google Sheet URLs** — one or more spreadsheets with locations.

The Apps Script must be deployed as a web app with "Anyone" access and
authorized to access the spreadsheets.

## Deployment

Production is hosted on [GitHub Pages](https://pages.github.com), which serves
the contents of the `docs/` directory at the repo root. There is no build step
or CI: pushing to the default branch deploys.
