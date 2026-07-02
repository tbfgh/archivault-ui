import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { driveApi } from '../../api'
import { ArrowLeft, HardDrive, MapPin } from 'lucide-react'

function formatBytes(b) { const gb = b / (1024 ** 3); return gb >= 1 ? `${gb.toFixed(2)} GB` : `${(b / (1024 ** 2)).toFixed(1)} MB` }

export default function DriveDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [drive, setDrive] = useState(null)
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    driveApi.get(id).then(r => setDrive(r.data))
    driveApi.employees(id).then(r => setEmployees(r.data))
  }, [id])

  if (!drive) return <div style={{ padding: 28, color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div style={{ padding: 28 }}>
      <button onClick={() => navigate('/admin/drives')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 13 }}>
        <ArrowLeft size={14} /> Back to Drives
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <HardDrive size={24} color="var(--accent)" />
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>{drive.drive_number}</h1>
          </div>
          {[['Type', drive.drive_type], ['Filesystem', drive.filesystem], ['Capacity', `${drive.capacity_gb} GB`], ['Used', `${drive.used_gb?.toFixed(1)} GB`], ['Status', drive.status], ['Added', new Date(drive.date_added).toLocaleDateString()]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>{k}</span><span style={{ fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
        {drive.shelf_location && (
          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={16} /> Shelf Location</h2>
            {[['Row', drive.shelf_location.row_number], ['Shelf', drive.shelf_location.shelf], ['Slot', drive.shelf_location.slot]].map(([k, v]) => (
              <div key={k} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>Employees on This Drive ({employees.length})</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: 'var(--surface2)' }}>
            {['Emp Code', 'Name', 'Department', 'Folder', 'Files', 'Size'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 14px', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {employees.map(e => (
              <tr key={e.employee_id} onClick={() => navigate(`/admin/employees/${e.employee_id}`)} style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}
                onMouseEnter={ev => ev.currentTarget.style.background = 'var(--surface2)'}
                onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '10px 14px', color: 'var(--accent)', fontWeight: 600 }}>{e.emp_code}</td>
                <td style={{ padding: '10px 14px' }}>{e.full_name}</td>
                <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{e.department || '—'}</td>
                <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 12 }}>{e.folder_path}</td>
                <td style={{ padding: '10px 14px' }}>{e.total_files?.toLocaleString()}</td>
                <td style={{ padding: '10px 14px' }}>{formatBytes(e.total_size_bytes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
