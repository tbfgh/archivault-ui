// v2.1: Config now lives server-side (see server/index.js), not in the
// browser's localStorage. That was a client-side state problem: every new
// browser/device/private window pointed at an already-configured install
// saw the Setup screen again, because localStorage is per-origin *and*
// per-browser-profile. The server is the single source of truth now — any
// client asking this install sees the same answer.
//
// _cache is populated once at app boot (see loadAppConfig(), called from
// App.jsx before anything else renders) and kept in memory afterward so
// getApiUrl()/isApiConfigured() can stay synchronous for callers like the
// axios interceptor in api/index.js, which needs a value on every request
// without awaiting a network round-trip each time.

let _cache = { configured: false, api_url: null, company_name: 'ArchiveVault' }

/** Fetches current config from this install's own server. Call once at boot. */
export async function loadAppConfig() {
  try {
    const res = await fetch('/app-config')
    const data = await res.json()
    _cache = {
      configured: !!data.configured,
      api_url: data.api_url || null,
      company_name: data.company_name || 'ArchiveVault',
    }
  } catch {
    // Server unreachable or not yet responding — treat as unconfigured
    // rather than throwing, so the app can still render the Setup screen.
    _cache = { configured: false, api_url: null, company_name: 'ArchiveVault' }
  }
  return _cache
}

/** Persists config to this install's server (writes runtime-config.json) and updates the cache. */
export async function saveAppConfig(apiUrl, companyName) {
  const res = await fetch('/app-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_url: apiUrl, company_name: companyName }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to save configuration')
  }
  _cache = { configured: true, api_url: data.api_url, company_name: data.company_name || 'ArchiveVault' }
  return _cache
}

/** Returns the configured API base URL (no trailing slash), or null if unset. Synchronous — reads the in-memory cache. */
export function getApiUrl() {
  return _cache.api_url
}

export function getCompanyName() {
  return _cache.company_name || 'ArchiveVault'
}

/** Synchronous — safe to call anywhere after loadAppConfig() has resolved once at boot. */
export function isApiConfigured() {
  return !!_cache.configured
}

/**
 * Validates a candidate API URL by pinging its /health endpoint.
 * Returns { ok: true } or { ok: false, reason: string }.
 */
export async function testApiUrl(url) {
  const cleaned = url.replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(cleaned)) {
    return { ok: false, reason: 'URL must start with http:// or https://' }
  }
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(`${cleaned}/health`, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) {
      return { ok: false, reason: `Server responded with status ${res.status}` }
    }
    const data = await res.json().catch(() => null)
    if (!data || data.status !== 'ok') {
      return { ok: false, reason: 'Reached the server, but /health did not return the expected response. Is this the ArchiveVault API?' }
    }
    return { ok: true }
  } catch (err) {
    if (err.name === 'AbortError') {
      return { ok: false, reason: 'Timed out. Check the URL, port, and that the API server is running.' }
    }
    return { ok: false, reason: 'Could not reach that address. Check the URL, port, firewall, and CORS (ALLOWED_ORIGINS) settings on the API server.' }
  }
}
