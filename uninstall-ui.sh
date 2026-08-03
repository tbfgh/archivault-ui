#!/bin/bash
# ============================================================
#  ArchiveVault UI — Uninstall Script (v2.1)
#  Removes everything deploy.sh created, for a clean reinstall test.
#  Run as: sudo bash uninstall-ui.sh
#
#  v2.1: the API URL / company name configured via the Setup screen now
#  live in a JSON file on THIS server (/var/lib/archivault-ui by
#  default), not in each visiting browser's localStorage. This script
#  asks separately whether to remove that, since it's real server state,
#  not deployment build output.
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
error()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
header() { echo -e "\n${BLUE}══════════════════════════════════════${NC}"; echo -e "${BLUE}  $1${NC}"; echo -e "${BLUE}══════════════════════════════════════${NC}"; }

if [ "$EUID" -ne 0 ]; then error "Please run as root: sudo bash uninstall-ui.sh"; fi

APP_DIR="/var/www/archivault-ui"
CONFIG_DIR="/var/lib/archivault-ui"

header "ArchiveVault UI — Uninstall"
echo ""
warn "This will PERMANENTLY remove:"
echo "  • The archivault-ui systemd service"
echo "  • $APP_DIR (deployed app code and build output)"
echo "  • Nginx site config for archivault-ui"
echo ""
warn "Node.js and nginx itself are NOT removed (only the archivault-ui site)."
warn "Your git clone / source directory is also left untouched — only the"
warn "DEPLOYED build output and nginx config are removed."
warn "The runtime config at ${CONFIG_DIR} (API URL, company name) is asked"
warn "about SEPARATELY below, since it's real server state, not build output."
echo ""

read -p "Type 'yes' to confirm you want to proceed: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted. Nothing was changed."
    exit 0
fi

header "Step 1: systemd Service"
if systemctl list-unit-files | grep -q archivault-ui.service; then
    systemctl stop archivault-ui 2>/dev/null || true
    systemctl disable archivault-ui 2>/dev/null || true
    rm -f /etc/systemd/system/archivault-ui.service
    systemctl daemon-reload
    log "archivault-ui service stopped, disabled, and removed"
else
    warn "No archivault-ui service found — skipping"
fi

header "Step 2: Nginx Config"
if [ -f /etc/nginx/sites-enabled/archivault-ui ] || [ -f /etc/nginx/sites-available/archivault-ui ]; then
    UI_PORT=$(grep -oP 'listen \K[0-9]+' /etc/nginx/sites-available/archivault-ui 2>/dev/null | head -1)
    rm -f /etc/nginx/sites-enabled/archivault-ui
    rm -f /etc/nginx/sites-available/archivault-ui
    if command -v nginx &>/dev/null && systemctl is-active --quiet nginx; then
        nginx -t 2>/dev/null && systemctl reload nginx || warn "nginx reload failed — check remaining config manually"
    fi
    log "Nginx site config removed"
else
    warn "No archivault-ui nginx config found — skipping"
fi

header "Step 3: Deployed App Code"
if [ -d "$APP_DIR" ]; then
    rm -rf "$APP_DIR"
    log "$APP_DIR removed"
else
    warn "$APP_DIR not found — skipping"
fi

header "Step 4: Runtime Config (API URL, company name)"
if [ -d "$CONFIG_DIR" ]; then
    warn "Found ${CONFIG_DIR} — this is the server-side setup answer, not build output."
    read -p "Remove it too, so the next install prompts for Setup again? [y/N]: " REMOVE_CONFIG
    if [[ "$REMOVE_CONFIG" =~ ^[Yy]$ ]]; then
        rm -rf "$CONFIG_DIR"
        log "${CONFIG_DIR} removed — a fresh deploy.sh run will show the Setup screen again"
    else
        log "Left in place — redeploying with deploy.sh will pick it back up automatically, no Setup screen needed"
    fi
else
    warn "${CONFIG_DIR} not found — skipping"
fi

header "Step 5: Firewall Rule (optional)"
if command -v ufw &>/dev/null && [ -n "$UI_PORT" ]; then
    read -p "Remove the ufw rule for port ${UI_PORT}/tcp? [y/N]: " REMOVE_FW
    if [[ "$REMOVE_FW" =~ ^[Yy]$ ]]; then
        ufw delete allow "${UI_PORT}/tcp" 2>/dev/null || warn "No matching ufw rule for ${UI_PORT}/tcp"
        log "ufw rule for ${UI_PORT}/tcp removed (if it existed)"
    fi
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        ArchiveVault UI Uninstall Complete            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Not removed on purpose (source/tooling, not deployment artifacts):"
echo "  • The git clone / source directory this script was run from"
echo "  • node_modules (delete manually with: rm -rf node_modules dist)"
echo "  • Node.js and nginx themselves"
echo ""
echo "Re-run 'sudo bash deploy.sh' from the source directory for a clean install."
echo ""
