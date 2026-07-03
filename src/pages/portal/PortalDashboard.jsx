import React, { useEffect, useState } from 'react'
import { authApi, employeeApi, requestApi } from '../../api'
import { FolderOpen, ClipboardList, HardDrive, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function formatBytes(b) {
  if (!b) return '0 B'; const gb = b / (1024 ** 3)
  return gb >= 1 ? `${gb.toFixed(2)} GB` : `${(b / (1024 ** 2)).toFixed(1)} MB`
}

export default function PortalDashboard() {
  const [empId, setEmpId] = useState(null)
  const [drives, setDrives] = useState([])
  const [requests, setRequests] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    authApi.me().then(r => {
      if (r.data.employee_id) {
        setEmpId(r.data.employee_id)
        employeeApi.drives(r.data.employee_id).then(d => setDrives(d.data))
      }
    })
    requestApi.list().then(r => setRequests(r.data.slice(0, 5)))
  }, [])

  const totalFiles = drives.reduce((sum, d) => sum + (d.total_files || 0), 0)
  const totalSize = drives.reduce((sum, d) => sum + (d.total_size_bytes || 0), 0)

  return (
    <div style={{ padding: 28, maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Welcome back</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>
        Here's an overview of your archived data.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <div className="card" style={{ padding: 20 }}>
          <HardDrive size={20} color="var(--accent)" style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 24, fontWeight: 700 }}>{drives.length}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Drives with your data</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <FileText size={20} color="#22c55e" style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 24, fontWeight: 700 }}>{totalFiles.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total indexed files</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <ClipboardList size={20} color="#f59e0b" style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 24, fontWeight: 700 }}>{formatBytes(totalSize)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total data size</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600 }}>Your Drives</h2>
            <button className="btn-outline" onClick={() => navigate('/portal/browse')} style={{ fontSize: 11, padding: '4px 10px' }}>Browse Files</button>
          </div>
          {drives.map(d => (
            <div key={d.drive_id} style={{ padding: '10px 0', borderTop: '1px solid var(--border)', fontSize: 13 }}>
              <div style={{ fontWeight: 600 }}>{d.drive_number}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{d.total_files} files · {formatBytes(d.total_size_bytes)}</div>
            </div>
          ))}
          {drives.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No data indexed yet</div>}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600 }}>Recent Requests</h2>
            <button className="btn-outline" onClick={() => navigate('/portal/requests')} style={{ fontSize: 11, padding: '4px 10px' }}>View All</button>
          </div>
          {requests.map(r => (
            <div key={r.id} style={{ padding: '10px 0', borderTop: '1px solid var(--border)', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
              <span>#{r.id} · {r.file_ids?.length} files</span>
              <span className="badge badge-info">{r.status.replace('_', ' ')}</span>
            </div>
          ))}
          {requests.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No requests yet</div>}
        </div>
      </div>
    </div>
  )
}
