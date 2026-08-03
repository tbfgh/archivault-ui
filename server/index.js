// server/index.js
//
// v2.1: The API URL / company name used to live only in the browser's
// localStorage, so the Setup screen reappeared on every new browser,
// device, or private-browsing window pointed at the same install — even
// though the install itself was already configured. That's a client-side
// state problem masquerading as a "keeps asking" bug.
//
// This server fixes that by moving the config server-side: it serves the
// built React app AND owns a small JSON file on disk (CONFIG_FILE below).
// The frontend asks this server "are you configured?" on load instead of
// trusting anything the browser remembers. Once someone completes Setup
// once, *every* browser/device that opens this install sees it as already
// configured — because it now genuinely is, on the server, not per-client.
//
// This is the process you run instead of a plain static file server
// (`serve`, `python -m http.server`, etc.) — see package.json's "start"
// script and the README for the systemd unit to keep it running.

const express = require('express')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 3000
const DIST_DIR = path.join(__dirname, '..', 'dist')

// Config file lives outside dist/ so `npm run build` never touches or
// wipes it. CONFIG_DIR is overridable so it can point at a persistent
// volume in containerized deployments.
const CONFIG_DIR = process.env.CONFIG_DIR || path.join(__dirname, '..', 'config')
const CONFIG_FILE = path.join(CONFIG_DIR, 'runtime-config.json')

app.use(express.json())

function readConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeConfig(config) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true })
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
}

// ── Runtime config API ──────────────────────────────────────────────────
// Deliberately unauthenticated: it only stores the address of this
// install's own API (not a secret), and carries the same trust level as
// hand-editing a config file on the box already would. Keep this machine
// behind your normal network perimeter as you would for any admin panel.

app.get('/app-config', (req, res) => {
  const config = readConfig()
  if (!config) {
    return res.json({ configured: false })
  }
  res.json({ configured: true, api_url: config.api_url, company_name: config.company_name || 'ArchiveVault' })
})

app.post('/app-config', (req, res) => {
  const { api_url, company_name } = req.body || {}
  if (!api_url || typeof api_url !== 'string' || !/^https?:\/\//i.test(api_url)) {
    return res.status(400).json({ detail: 'api_url is required and must start with http:// or https://' })
  }
  const config = {
    api_url: api_url.replace(/\/+$/, ''),
    company_name: (company_name && String(company_name).trim()) || 'ArchiveVault',
  }
  try {
    writeConfig(config)
  } catch (err) {
    return res.status(500).json({ detail: `Could not write config file: ${err.message}` })
  }
  res.json({ configured: true, ...config })
})

// ── Static SPA ───────────────────────────────────────────────────────────

app.use(express.static(DIST_DIR))

// Anything that isn't a static file or the config API falls through to
// index.html so React Router's client-side routes (e.g. /admin/drives)
// work on a hard refresh or a directly-typed URL.
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`ArchiveVault UI listening on port ${PORT}`)
  console.log(`Config file: ${CONFIG_FILE}${readConfig() ? '' : ' (not yet configured — Setup screen will show)'}`)
})
