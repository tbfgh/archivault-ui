#!/bin/bash
# ============================================================
#  ArchiveVault UI — Deploy Script (v2.1)
#  Builds the React app and runs it via a small Node server
#  (server/index.js), reverse-proxied through Nginx.
#  Run as: sudo bash deploy.sh
#
#  v2.1 changes:
#   - The Setup screen's answer (API URL, company name) is no longer
#     stored in the browser's localStorage — it's written to a JSON file
#     on THIS server by server/index.js and read back on every load. That
#     was a real bug: localStorage is per-browser/per-device, so a new
#     browser, incognito window, or machine pointed at an
#     already-configured install saw the Setup screen again even though
#     the install itself was already configured. Now every client gets
#     the same, correct answer because the server is the source of truth.
#   - This means Nginx can no longer just serve dist/ as static files —
#     it needs to reverse-proxy to the Node server so /app-config
#     actually reaches it. This script now sets that up via systemd +
#     an Nginx reverse-proxy config instead of a static file server.
#   - The config file lives in a persistent state directory
#     (/var/lib/archivault-ui) outside the deployed app code, so
#     re-running this script to pick up a new build never wipes it.
# ============================================================

set -e
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }

if [ "$EUID" -ne 0 ]; then echo "Please run as root: sudo bash deploy.sh"; exit 1; fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="/var/www/archivault-ui"
CONFIG_DIR="/var/lib/archivault-ui"     # persists across redeploys — never wiped below
INTERNAL_PORT=3000                       # Node server's port; only Nginx talks to it directly

echo -e "${BLUE}ArchiveVault Frontend Deployment (v2.1)${NC}"
echo ""

read -p "UI port (what nginx will listen on, public-facing) [80]: " UI_PORT
UI_PORT="${UI_PORT:-80}"
read -p "Enter the domain or IP this frontend will be served on (e.g. archivault.company.com or 192.168.1.101): " FRONTEND_DOMAIN

echo ""
warn "You will NOT be asked for the API URL here — configure it in the"
warn "browser the first time you open the app (Setup screen at /setup)."
warn "That answer is now saved on THIS server, once, for every client."
echo ""

# Install Node.js if missing
if ! command -v node &>/dev/null; then
    log "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
log "Node.js: $(node -v)"

# Deploy app code (excluding dev artifacts) to APP_DIR, then install/build there
log "Deploying app code to ${APP_DIR}..."
mkdir -p "$APP_DIR"
rsync -a --delete \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '.git' \
    --exclude 'config' \
    "$SCRIPT_DIR"/ "$APP_DIR"/

cd "$APP_DIR"
log "Installing dependencies..."
npm install --silent   # dev deps needed for the build step (vite, etc.)

log "Building production bundle..."
npm run build
npm prune --omit=dev --silent   # drop dev deps again post-build; runtime only needs express

# Persistent config directory — created once, owned by the service user,
# and never touched by rsync/redeploys above.
mkdir -p "$CONFIG_DIR"
chown -R www-data:www-data "$APP_DIR" "$CONFIG_DIR"
log "App deployed. Runtime config will live in ${CONFIG_DIR} (persists across redeploys)."

# systemd service running the Node server
cat > /etc/systemd/system/archivault-ui.service <<SERVICE
[Unit]
Description=ArchiveVault UI
After=network.target

[Service]
ExecStart=$(command -v node) server/index.js
WorkingDirectory=${APP_DIR}
Environment=PORT=${INTERNAL_PORT}
Environment=CONFIG_DIR=${CONFIG_DIR}
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable --now archivault-ui
systemctl restart archivault-ui
log "archivault-ui service started on 127.0.0.1:${INTERNAL_PORT}"

# nginx if missing
if ! command -v nginx &>/dev/null; then
    log "Installing nginx..."
    apt-get update -qq && apt-get install -y -qq nginx
fi

# Nginx now reverse-proxies to the Node server instead of serving static
# files directly — required so /app-config (GET+POST) actually reaches it.
cat > /etc/nginx/sites-available/archivault-ui <<NGINX
server {
    listen ${UI_PORT};
    server_name ${FRONTEND_DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${INTERNAL_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/archivault-ui /etc/nginx/sites-enabled/archivault-ui
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
log "Nginx configured and reloaded on port ${UI_PORT}"

if command -v ufw &>/dev/null; then
    ufw allow "${UI_PORT}/tcp" >/dev/null 2>&1 || true
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Frontend Deployed Successfully     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""
if [ "$UI_PORT" == "80" ]; then
    echo -e "  URL: ${BLUE}http://${FRONTEND_DOMAIN}${NC}"
else
    echo -e "  URL: ${BLUE}http://${FRONTEND_DOMAIN}:${UI_PORT}${NC}"
fi
echo ""
echo -e "  ${YELLOW}Open the URL above — you'll be prompted to enter your API server's${NC}"
echo -e "  ${YELLOW}address (from the API's setup.sh output) on first visit. This only${NC}"
echo -e "  ${YELLOW}happens once for this whole install, not per browser/device.${NC}"
echo ""
echo -e "  Service:    systemctl status archivault-ui"
echo -e "  Logs:       journalctl -u archivault-ui -f"
echo -e "  Config file: ${CONFIG_DIR}/runtime-config.json"
echo ""
