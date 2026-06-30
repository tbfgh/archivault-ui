import React, { useEffect, useState } from 'react'
import { indexerApi } from '../../api'
import { Key, Plus, Copy, X, Check } from 'lucide-react'

export default function TokensPage() {
  const [tokens, setTokens] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [newToken, setNewToken] = useState(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = () => indexerApi.tokens().then(r => setTokens(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    const r = await indexerApi.createToken({ name })
    setNewToken(r.data.token)
    setName('')
    load()
  }

  const revoke = async (id) => {
    if (!confirm('Revoke this token? Any indexer using it will stop working.')) return
    await indexerApi.revokeToken(id)
    load()
  }

  const copyToken = (token) => {
    navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (loading) return <div style={{ padding: 28, color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Indexer Tokens</h1>
        <button className="btn-primary" onClick={() => { setShowCreate(true); setNewToken(null) }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> New Token
        </button>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
        Tokens authenticate the local Indexer tool (running on Windows/Linux) with this server.
        Paste a token into the indexer's <code style={{ background: 'var(--surface2)', padding: '1px 5px', borderRadius: 4 }}>config.json</code>.
      </p>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: 'var(--surface2)' }}>
            {['Name', 'Status', 'Last Used', 'Created', 'Actions'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {tokens.map(t => (
              <tr key={t.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Key size={14} color="var(--text-muted)" /> {t.name}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span className="badge" style={{ background: t.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: t.is_active ? 'var(--success)' : 'var(--error)' }}>
                    {t.is_active ? 'active' : 'revoked'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{t.last_used_at ? new Date(t.last_used_at).toLocaleString() : 'Never'}</td>
                <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '12px 14px' }}>
                  {t.is_active && <button className="btn-outline" onClick={() => revoke(t.id)} style={{ fontSize: 11, padding: '4px 10px', color: 'var(--error)' }}>Revoke</button>}
                </td>
              </tr>
            ))}
            {tokens.length === 0 && <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No tokens created yet</td></tr>}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ padding: 24, width: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>{newToken ? 'Token Created' : 'Create Indexer Token'}</h2>
              <button onClick={() => { setShowCreate(false); setNewToken(null) }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            {newToken ? (
              <div>
                <p style={{ fontSize: 13, color: 'var(--warn)', marginBottom: 12 }}>
                  ⚠ Copy this token now. You won't be able to see it again.
                </p>
                <div style={{ background: 'var(--surface2)', padding: '12px 14px', borderRadius: 8, fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all', marginBottom: 14, border: '1px solid var(--border)' }}>
                  {newToken}
                </div>
                <button className="btn-primary" onClick={() => copyToken(newToken)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Token</>}
                </button>
              </div>
            ) : (
              <form onSubmit={create}>
                <div style={{ marginBottom: 18 }}>
                  <label>Token Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Linux Mint - IT Desk" required />
                </div>
                <button className="btn-primary" type="submit" style={{ width: '100%' }}>Generate Token</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
