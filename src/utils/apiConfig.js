// v2: API base URL is configured at RUNTIME via the Setup screen and
// stored in localStorage — not baked into the JS bundle at build time.
//
// This means the exact same build artifact can point at any API host/port
// (localhost, a LAN IP, or a domain) without rebuilding — fixing the v1
// "stale bundle" trap, where a source fix didn't take effect until an
// explicit rebuild + redeploy.

const API_URL_KEY = 'archivault_api_url'
const COMPANY_NAME_KEY = 'archivault_company_name'

/** Returns the configured API base URL (no trailing slash), or null if unset. */
export function getApiUrl() {
  const url = localStorage.getItem(API_URL_KEY)
  return url ? url.replace(/\/+$/, '') : null
}

export function setApiUrl(url) {
  localStorage.setItem(API_URL_KEY, url.replace(/\/+$/, ''))
}

export function clearApiUrl() {
  localStorage.removeItem(API_URL_KEY)
}

export function isApiConfigured() {
  return !!getApiUrl()
}

export function getCompanyName() {
  return localStorage.getItem(COMPANY_NAME_KEY) || 'ArchiveVault'
}

export function setCompanyName(name) {
  if (name) localStorage.setItem(COMPANY_NAME_KEY, name)
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
