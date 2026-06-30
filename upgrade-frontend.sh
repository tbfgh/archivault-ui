#!/bin/bash
# ArchiveVault UI — Upgrade Script
# Run as: sudo bash upgrade-frontend.sh

set -e
GREEN='\033[0;32m'
NC='\033[0m'
log() { echo -e "${GREEN}[✓]${NC} $1"; }

if [ "$EUID" -ne 0 ]; then echo "Please run as root: sudo bash upgrade-frontend.sh"; exit 1; fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_ROOT="/var/www/archivault-ui"

cd "$SCRIPT_DIR"
log "Pulling latest code..."
git pull origin main

log "Installing dependencies..."
npm install --silent

log "Building..."
npm run build

log "Deploying..."
rm -rf "${WEB_ROOT:?}"/*
cp -r dist/* "$WEB_ROOT/"

systemctl reload nginx
log "Frontend upgraded successfully — existing .env preserved"
