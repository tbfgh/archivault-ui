import React, { useEffect, useState } from 'react'
import { requestApi } from '../../api'
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const STATUS_CONFIG = {
  pending: { color: 'var(--warn)', icon: Clock, label: 'Pending Review' },
  approved: { color: 'var(--accent)', icon: CheckCircle, label: 'Approved' },
  in_progress: { color: 'var(--accent)', icon: Clock, label: 'In Progress' },
  completed: { color: 'var(--success)', icon: CheckCircle, label: 'Completed' },
  rejected: { color: 'var(--error)', icon: XCircle, label: 'Rejected' },
}

function formatBytes(b) { const mb = b / (1024 ** 2); return mb >= 1024 ? `${(mb/1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB` }

export default function PortalRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { requestApi.list().then(r => setRequests(r.data)).finally(() => setLoading(false)) }, [])

  if (loading) return <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div style={{ padding: 28, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>My Requests</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
        Track the status of your data retrieval requests.
      </p>

      {requests.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertCircle size={28} style={{ marginBottom: 10, opacity: 0.3 }} />
          <div>No requests submitted yet</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Go to "My Files" to browse and request data</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {requests.map(r => {
            const cfg = STATUS_CONFIG[r.status]
            const Icon = cfg.icon
            return (
              <div key={r.id} className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Request #{r.id}</span>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Submitted {new Date(r.requested_at).toLocaleString()}
                    </div>
                  </div>
                  <span className="badge" style={{ background: `${cfg.color}20`, color: cfg.color, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Icon size={12} /> {cfg.label}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--text-muted)', marginBottom: r.notes || r.admin_notes ? 10 : 0 }}>
                  <span>{r.file_ids?.length} files</span>
                  <span>{formatBytes(r.total_size_bytes)}</span>
                  <span>Est. {r.estimated_minutes?.toFixed(1)} min</span>
                </div>
                {r.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}><strong>Your note:</strong> {r.notes}</div>}
                {r.admin_notes && (
                  <div style={{ fontSize: 12, marginTop: 6, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 6 }}>
                    <strong style={{ color: 'var(--accent)' }}>IT Note:</strong> {r.admin_notes}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
