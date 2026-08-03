#!/bin/bash
# ArchiveVault UI — Upgrade Script (v2.1)
# Run as: sudo bash upgrade-frontend.sh
#
# v2.1: app code now runs as a Node service (archivault-ui.service) behind
# Nginx, not served as static files, so an upgrade means rebuilding and
# restarting that service — not just reloading Nginx. Runtime config
# (API URL, company name) lives in /var/lib/archivault-ui, outside the app
# directory this script deploys into, so it survives every upgrade.

set -e
GREEN='\033[0;32m'
NC='\033[0m'
log() { echo -e "${GREEN}[✓]${NC} $1"; }

if [ "$EUID" -ne 0 ]; then echo "Please run as root: sudo bash upgrade-frontend.sh"; exit 1; fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="/var/www/archivault-ui"

cd "$SCRIPT_DIR"
log "Pulling latest code..."
git pull origin main

log "Deploying app code to ${APP_DIR}..."
rsync -a --delete \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '.git' \
    --exclude 'config' \
    "$SCRIPT_DIR"/ "$APP_DIR"/

cd "$APP_DIR"
log "Installing dependencies..."
npm install --silent

log "Building..."
npm run build
npm prune --omit=dev --silent

chown -R www-data:www-data "$APP_DIR"

log "Restarting service..."
systemctl restart archivault-ui
systemctl reload nginx

log "Frontend upgraded successfully — runtime config (/var/lib/archivault-ui/runtime-config.json) is untouched by this script"
