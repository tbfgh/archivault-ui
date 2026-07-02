import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setApiUrl, setCompanyName, testApiUrl, getApiUrl, getCompanyName } from '../utils/apiConfig'

export default function SetupPage() {
  const [apiUrl, setApiUrlInput] = useState(getApiUrl() || '')
  const [companyName, setCompanyNameInput] = useState(getCompanyName())
  const [status, setStatus] = useState(null) // null | 'testing' | { ok, reason }
  const navigate = useNavigate()

  const handleTest = async (e) => {
    e.preventDefault()
    setStatus('testing')
    const result = await testApiUrl(apiUrl)
    setStatus(result)
    if (result.ok) {
      setApiUrl(apiUrl)
      setCompanyName(companyName)
      setTimeout(() => navigate('/login'), 600)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🗄️</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>
            Connect to your ArchiveVault server
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            One-time setup — this browser will remember these settings.
          </p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleTest}>
            <div style={{ marginBottom: 16 }}>
              <label>API Server URL</label>
              <input
                type="text"
                value={apiUrl}
                onChange={e => setApiUrlInput(e.target.value)}
                placeholder="http://192.168.1.100:8000 or https://api.company.com"
                required
                autoFocus
              />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                Include the port if the API isn't behind a domain on port 80/443
                (e.g. <code>http://localhost:8000</code>). This is printed at the
                end of the API's <code>setup.sh</code> as "API Base URL".
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label>Company / Organization Name (optional)</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyNameInput(e.target.value)}
                placeholder="ArchiveVault"
              />
            </div>

            {status && status !== 'testing' && !status.ok && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)', padding: '10px 14px', borderRadius: 7, marginBottom: 16, fontSize: 13 }}>
                {status.reason}
              </div>
            )}
            {status && status !== 'testing' && status.ok && (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', padding: '10px 14px', borderRadius: 7, marginBottom: 16, fontSize: 13 }}>
                Connected. Redirecting to login…
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={status === 'testing'} style={{ width: '100%', padding: '11px' }}>
              {status === 'testing' ? 'Testing connection…' : 'Test & Connect'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
