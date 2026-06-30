import React, { useEffect, useState } from 'react'
import { adminApi, requestApi } from '../../api'
import { HardDrive, Users, FileText, ClipboardList, Database, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function StatCard({ icon: Icon, label, value, sub, color = 'var(--accent)', onClick }) {
  return (
    <div className="card" onClick={onClick}
      style={{ padding: 20, cursor: onClick ? 'pointer' : 'default', transition: 'border-color 0.2s' }}
      onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = 'var(--accent)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = 'var(--border)')}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ background: `${color}20`, padding: 10, borderRadius: 10 }}>
          <Icon size={20} color={color} />
        </div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
    </div>
  )
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const tb = bytes / (1024 ** 4)
  if (tb >= 1) return `${tb.toFixed(2)} TB`
  const gb = bytes / (1024 ** 3)
  if (gb >= 1) return `${gb.toFixed(2)} GB`
  return `${(bytes / (1024 ** 2)).toFixed(1)} MB`
}

const STATUS_COLORS = { pending: 'var(--warn)', approved: 'var(--accent)', in_progress: 'var(--accent)', completed: 'var(--success)', rejected: 'var(--error)' }

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [requests, setRequests] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    adminApi.stats().then(r => setStats(r.data)).catch(() => {})
    requestApi.list().then(r => setRequests(r.data.slice(0, 8))).catch(() => {})
  }, [])

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Dashboard</h1>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          <StatCard icon={HardDrive} label="Total Drives" value={stats.total_drives}
            sub={`${stats.active_drives} active`} onClick={() => navigate('/admin/drives')} />
          <StatCard icon={Users} label="Ex-Employees" value={stats.total_employees}
            onClick={() => navigate('/admin/employees')} color="#a78bfa" />
          <StatCard icon={FileText} label="Indexed Files" value={stats.total_files?.toLocaleString()}
            onClick={() => navigate('/admin/files')} color="#22c55e" />
          <StatCard icon={Database} label="Total Data" value={formatBytes(stats.total_size_bytes)}
            color="#f59e0b" />
          <StatCard icon={AlertCircle} label="Pending Requests" value={stats.pending_requests}
            onClick={() => navigate('/admin/requests')} color={stats.pending_requests > 0 ? 'var(--warn)' : 'var(--text-muted)'} />
        </div>
      )}

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>Recent Retrieval Requests</h2>
          <button className="btn-outline" onClick={() => navigate('/admin/requests')} style={{ fontSize: 12, padding: '5px 12px' }}>View All</button>
        </div>
        {requests.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontSize: 13 }}>No requests yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                {['ID', 'Status', 'Files', 'Size', 'Est. Time', 'Requested'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}
                  onClick={() => navigate('/admin/requests')}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  style={{ cursor: 'pointer', borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 10px' }}>#{r.id}</td>
                  <td style={{ padding: '10px 10px' }}>
                    <span className="badge" style={{ background: `${STATUS_COLORS[r.status]}20`, color: STATUS_COLORS[r.status] }}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '10px 10px' }}>{r.file_ids?.length}</td>
                  <td style={{ padding: '10px 10px' }}>{formatBytes(r.total_size_bytes)}</td>
                  <td style={{ padding: '10px 10px' }}>{r.estimated_minutes?.toFixed(1)} min</td>
                  <td style={{ padding: '10px 10px', color: 'var(--text-muted)' }}>{new Date(r.requested_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
