// DrivesPage.jsx
import React, { useEffect, useState } from 'react'
import { driveApi } from '../../api'
import { useNavigate } from 'react-router-dom'
import { HardDrive, Plus, MapPin } from 'lucide-react'

const STATUS_COLOR = { active: 'var(--success)', damaged: 'var(--error)', retired: 'var(--text-muted)' }

export function DrivesPage() {
  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { driveApi.list().then(r => setDrives(r.data)).finally(() => setLoading(false)) }, [])

  if (loading) return <div style={{ padding: 28, color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Drives</h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {drives.map(d => (
          <div key={d.id} className="card" onClick={() => navigate(`/admin/drives/${d.id}`)}
            style={{ padding: 18, cursor: 'pointer', transition: 'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <HardDrive size={18} color="var(--accent)" />
                <span style={{ fontWeight: 700, fontSize: 16 }}>{d.drive_number}</span>
              </div>
              <span className="badge" style={{ background: `${STATUS_COLOR[d.status]}20`, color: STATUS_COLOR[d.status] }}>{d.status}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{d.drive_type} · {d.filesystem}</div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Storage</span>
                <span>{d.used_gb.toFixed(1)} / {d.capacity_gb} GB</span>
              </div>
              <div style={{ background: 'var(--surface2)', borderRadius: 10, height: 6, overflow: 'hidden' }}>
                <div style={{ background: 'var(--accent)', height: '100%', width: `${Math.min(100, (d.used_gb / d.capacity_gb) * 100)}%`, borderRadius: 10 }} />
              </div>
            </div>
            {d.shelf_location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                <MapPin size={12} />
                Row {d.shelf_location.row_number} · Shelf {d.shelf_location.shelf} · Slot {d.shelf_location.slot}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
export default DrivesPage
