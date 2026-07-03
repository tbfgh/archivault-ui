#!/bin/bash
# ============================================================
#  ArchiveVault UI — Deploy Script (v2)
#  Builds the React app and serves it via Nginx
#  Run as: sudo bash deploy.sh
#
#  v2 changes:
#   - No API URL is baked at build time. The exact same build works for
#     any API host/port — it's configured in the browser via the Setup
#     screen the first time the app is opened (or any time at /setup).
#   - UI_PORT is configurable and fully independent of the API's port.
#   - This script can be re-run any time to pick up code changes without
#     needing to know or re-enter the API URL.
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
WEB_ROOT="/var/www/archivault-ui"

echo -e "${BLUE}ArchiveVault Frontend Deployment (v2)${NC}"
echo ""

read -p "UI port (what nginx will listen on) [80]: " UI_PORT
UI_PORT="${UI_PORT:-80}"
read -p "Enter the domain or IP this frontend will be served on (e.g. archivault.company.com or 192.168.1.101): " FRONTEND_DOMAIN

echo ""
warn "You will NOT be asked for the API URL here — configure it in the"
warn "browser the first time you open the app (Setup screen at /setup)."
echo ""

# Install Node.js if missing
if ! command -v node &>/dev/null; then
    log "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
log "Node.js: $(node -v)"

# Install and build — no API URL, no rebuild-per-environment needed
cd "$SCRIPT_DIR"
log "Installing dependencies..."
npm install --silent

log "Building production bundle..."
npm run build

# Deploy to web root
mkdir -p "$WEB_ROOT"
rm -rf "${WEB_ROOT:?}"/*
cp -r dist/* "$WEB_ROOT/"
log "Files deployed to $WEB_ROOT"

# nginx if missing
if ! command -v nginx &>/dev/null; then
    log "Installing nginx..."
    apt-get update -qq && apt-get install -y -qq nginx
fi

# Nginx config — pure static file server, no API proxy needed since the
# UI talks directly to the API's own origin over CORS.
cat > /etc/nginx/sites-available/archivault-ui <<NGINX
server {
    listen ${UI_PORT};
    server_name ${FRONTEND_DOMAIN};
    root ${WEB_ROOT};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
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
echo -e "  ${YELLOW}address (from the API's setup.sh output) on first visit.${NC}"
echo ""
