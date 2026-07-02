import React, { useEffect, useState } from 'react'
import { requestApi } from '../../api'

const STATUS_COLOR = { pending: 'var(--warn)', approved: 'var(--accent)', in_progress: 'var(--accent)', completed: 'var(--success)', rejected: 'var(--error)' }
const STATUSES = ['pending', 'approved', 'in_progress', 'completed', 'rejected']

function formatBytes(b) { const mb = b / (1024 ** 2); return mb >= 1024 ? `${(mb/1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB` }

export default function RequestsPage() {
  const [requests, setRequests] = useState([])
  const [selected, setSelected] = useState(null)
  const [statusUpdate, setStatusUpdate] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => requestApi.list().then(r => setRequests(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const update = async () => {
    if (!selected || !statusUpdate) return
    await requestApi.updateStatus(selected.id, { status: statusUpdate, admin_notes: adminNotes })
    setSelected(null); load()
  }

  if (loading) return <div style={{ padding: 28, color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Retrieval Requests</h1>
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: 'var(--surface2)' }}>
            {['#', 'Status', 'Files', 'Size', 'Est. Time', 'Requested', 'Actions'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>#{r.id}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span className="badge" style={{ background: `${STATUS_COLOR[r.status]}20`, color: STATUS_COLOR[r.status] }}>{r.status.replace('_', ' ')}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>{r.file_ids?.length}</td>
                <td style={{ padding: '12px 14px' }}>{formatBytes(r.total_size_bytes)}</td>
                <td style={{ padding: '12px 14px' }}>{r.estimated_minutes?.toFixed(1)} min</td>
                <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{new Date(r.requested_at).toLocaleDateString()}</td>
                <td style={{ padding: '12px 14px' }}>
                  <button className="btn-outline" onClick={() => { setSelected(r); setStatusUpdate(r.status); setAdminNotes(r.admin_notes || '') }} style={{ fontSize: 11, padding: '4px 10px' }}>Manage</button>
                </td>
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No requests yet</td></tr>}
          </tbody>
        </table>
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ padding: 24, width: 420 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Manage Request #{selected.id}</h2>
            <div style={{ marginBottom: 14 }}>
              <label>Update Status</label>
              <select value={statusUpdate} onChange={e => setStatusUpdate(e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label>Admin Notes</label>
              <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3} placeholder="Optional notes..." />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" onClick={update} style={{ flex: 1 }}>Save</button>
              <button className="btn-outline" onClick={() => setSelected(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
