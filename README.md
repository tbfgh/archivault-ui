# ArchiveVault UI

## What's new in v2.1

- **Fixed: Setup screen re-appearing.** In v2, the API URL/company name were saved to the browser's `localStorage` — so a new browser, incognito window, or a different machine pointed at an already-configured install would see the Setup screen again, even though the install itself was already set up. That's fixed: config is now written to a JSON file on **this server** (via the new `server/index.js`) and every client reads the same answer. Setup now genuinely happens once per install, not once per browser.
- This means the app is no longer a pure static bundle — see "Architecture" below before deploying.

## What's new in v2

- **No more build-time API URL.** v1 baked `VITE_API_URL` into the JS bundle at build time — moving servers or changing ports meant rebuilding and redeploying. v2 configures the API URL **at runtime** via a **Setup screen** that asks for the API server's address and tests it against `/health`. The exact same build now works against any API host/port.
- **Ports fully decoupled.** `deploy.sh` asks for `UI_PORT` (what nginx listens on) completely independently of the API's port.
- **Reconfigurable anytime**: visit `/setup` from the login page ("Change server" link) to point the same install at a different API without rebuilding.
- Works identically whether the API and UI are on the same server or split across two — it's just a URL.

---

React frontend for ArchiveVault. Talks to the [archivault-api](../archivault-api) backend via REST, configured at runtime rather than baked in — the same build works against any deployment.

## Architecture (since v2.1)

This app is now two pieces:

1. **The React SPA** (`src/`, built to `dist/`) — everything you'd expect.
2. **A small Node/Express server** (`server/index.js`) that (a) serves that built SPA, and (b) owns `config/runtime-config.json` — the API URL and company name entered on the Setup screen. That file is this install's single source of truth; every browser/device that opens the app asks this server "are you configured?" instead of checking its own local state.

In production this runs as a systemd service (`archivault-ui.service`, set up by `deploy.sh`) behind Nginx, which reverse-proxies to it rather than serving `dist/` as flat static files — that proxy is required so requests to `/app-config` actually reach the Node process instead of 404ing on Nginx.

## Stack
- React 18 + Vite (frontend)
- Express (small server for static hosting + runtime config persistence)
- Tailwind CSS
- Zustand (auth state)
- React Router

## One-Command Deploy (Ubuntu 24.04, alongside or separate from the API server)

```bash
git clone <this-repo> archivault-ui
cd archivault-ui
sudo bash deploy.sh
```

Prompts for the port to serve on and the domain/IP for this frontend. Installs Node.js if missing, builds the production bundle, sets up the `archivault-ui` systemd service, and configures Nginx as a reverse proxy in front of it. **Does not** ask for the API URL — that's set once via the Setup screen on first visit, and saved server-side in `/var/lib/archivault-ui/runtime-config.json` (survives redeploys and upgrades).

## Upgrading

```bash
cd /path/to/archivault-ui
sudo bash upgrade-frontend.sh
```

Pulls latest code, rebuilds, and restarts the `archivault-ui` service — leaves the runtime config (`/var/lib/archivault-ui/runtime-config.json`) untouched.

## Local Development

```bash
npm install
npm run dev
```

Runs the Vite dev server on `http://localhost:3000`. Because config is read from `/app-config`, which only the Node server in `server/index.js` provides, `npm run dev` alone will show the Setup screen and fail to save it (there's no server behind the dev server to write the file to). To test the full flow locally:

```bash
npm run build
npm start          # runs server/index.js on http://localhost:3000
```

`npm start` serves the built app and persists config to `./config/runtime-config.json` (gitignored) by default. Override the port or config location with `PORT=4000 CONFIG_DIR=/tmp/archivault-ui-config npm start`.

## Reusing for a Different Company

This frontend has no hardcoded company data — the API URL and company/organization name are both entered once via the Setup screen (`/setup`) and stored server-side, not baked into the build. To reuse it elsewhere:

1. Clone this repo fresh
2. `sudo bash deploy.sh`
3. Open the deployed URL and complete Setup with the new company's API URL and name

No code changes or rebuild-per-company needed.

## Structure

```
server/
  index.js         Express server: serves dist/, owns runtime-config.json
src/
  api/             Axios client + all API call functions
  store/           Zustand auth store + theme store
  utils/
    apiConfig.js   Fetches/saves runtime config via server/index.js
  pages/
    LoginPage.jsx
    SetupPage.jsx
    admin/         IT Manager / Admin views (drives, employees, files, requests, users, tokens, batches)
    portal/        Employee self-service portal (browse own files, request retrieval)
  App.jsx          Routing + auth guards + boot-time config load
```

## Roles & Access

| Role | Access |
|---|---|
| `superadmin` / `admin` | Full admin panel — drives, employees, all files, user management, indexer tokens |
| `employee` | Employee portal only — their own files, retrieval requests |

Role-based routing is enforced in `App.jsx` — employees are redirected away from `/admin`, admins from `/portal`.
