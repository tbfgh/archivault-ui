# ArchiveVault UI

React frontend for ArchiveVault. Talks to the [archivault-api](../archivault-api) backend via REST. Deliberately decoupled — point it at any company's backend via `.env` to reuse it.

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

Prompts for your backend API URL, company name, and the domain/IP to serve on. Installs Node.js if missing, builds the production bundle, and configures Nginx automatically.

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
