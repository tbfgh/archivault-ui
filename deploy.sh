#!/bin/bash
# ============================================================
#  ArchiveVault UI — Deploy Script
#  Builds the React app and serves it via Nginx
#  Run as: sudo bash deploy.sh
# ============================================================

set -e
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }

if [ "$EUID" -ne 0 ]; then echo "Please run as root: sudo bash deploy.sh"; exit 1; fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_ROOT="/var/www/archivault-ui"

echo -e "${BLUE}ArchiveVault Frontend Deployment${NC}"
echo ""

read -p "Enter backend API URL (e.g. http://192.168.1.100 or https://api.company.com): " API_URL
read -p "Enter company name to display [ArchiveVault]: " COMPANY_NAME
COMPANY_NAME="${COMPANY_NAME:-ArchiveVault}"
read -p "Enter domain/IP this frontend will be served on (e.g. archivault.company.com): " FRONTEND_DOMAIN

# Install Node.js if missing
if ! command -v node &>/dev/null; then
    log "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
log "Node.js: $(node -v)"

# Write .env
cat > "$SCRIPT_DIR/.env" <<ENV
VITE_API_URL=${API_URL}
VITE_COMPANY_NAME=${COMPANY_NAME}
ENV
log ".env configured"

# Install and build
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

# Nginx config
cat > /etc/nginx/sites-available/archivault-ui <<NGINX
server {
    listen 80;
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
nginx -t && systemctl reload nginx
log "Nginx configured and reloaded"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Frontend Deployed Successfully     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "  URL: ${BLUE}http://${FRONTEND_DOMAIN}${NC}"
echo -e "  API: ${BLUE}${API_URL}${NC}"
echo ""
