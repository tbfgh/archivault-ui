# ArchiveVault UI

## What's new in v2

- **No more build-time API URL.** v1 baked `VITE_API_URL` into the JS bundle at build time — moving servers or changing ports meant rebuilding and redeploying. v2 configures the API URL **at runtime**, in the browser: the first time you open the app it shows a **Setup screen** that asks for the API server's address, tests it against `/health`, and stores it in `localStorage`. The exact same build now works against any API host/port.
- **Ports fully decoupled.** `deploy.sh` now asks for `UI_PORT` (what nginx listens on) completely independently of the API's port — the two are no longer coupled by shared nginx path rules.
- **Reconfigurable anytime**: visit `/setup` from the login page ("Change server" link) to point the same install at a different API without rebuilding.
- Works identically whether the API and UI are on the same server or split across two — it's just a URL.
- App version bumped to `1.1.0`.

Reinstalling after v1? Users' browsers may still have an old, empty `archivault_api_url`-less state — that's fine, they'll just see the Setup screen once.

---

React frontend for ArchiveVault. Talks to the [archivault-api](../archivault-api) backend via REST, configured at runtime rather than baked in — the same build works against any deployment.

## Stack
- React 18 + Vite
- Tailwind CSS
- Zustand (auth state)
- React Router

## One-Command Deploy (Ubuntu 24.04, alongside or separate from the API server)

```bash
git clone <this-repo> archivault-ui
cd archivault-ui
sudo bash deploy.sh
```

Prompts for the port to serve on and the domain/IP for this frontend. Installs Node.js if missing, builds the production bundle, and configures Nginx automatically. **Does not** ask for the API URL — that's set in the browser on first visit via the Setup screen.

## Upgrading

```bash
cd /path/to/archivault-ui
sudo bash upgrade-frontend.sh
```

Pulls latest code, rebuilds, redeploys — keeps your existing `.env` untouched.

## Local Development

```bash
npm install
cp .env.example .env   # set VITE_API_URL to your backend
npm run dev
```

Runs on `http://localhost:3000` with API requests proxied to your backend.

## Reusing for a Different Company

This frontend has no hardcoded company data. To reuse it elsewhere:

1. Clone this repo fresh
2. Set `.env`:
   ```
   VITE_API_URL=https://their-backend.com
   VITE_COMPANY_NAME=Their Company Name
   ```
3. Run `deploy.sh`

No code changes needed.

## Structure

```
src/
  api/             Axios client + all API call functions
  store/           Zustand auth store
  pages/
    LoginPage.jsx
    admin/         IT Manager / Admin views (drives, employees, files, requests, users, tokens)
    portal/        Employee self-service portal (browse own files, request retrieval)
  App.jsx          Routing + auth guards
```

## Roles & Access

| Role | Access |
|---|---|
| `superadmin` / `admin` | Full admin panel — drives, employees, all files, user management, indexer tokens |
| `employee` | Employee portal only — their own files, retrieval requests |

Role-based routing is enforced in `App.jsx` — employees are redirected away from `/admin`, admins from `/portal`.
