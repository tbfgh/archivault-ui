// EmployeeDetail.jsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { employeeApi } from '../../api'
import { HardDrive, MapPin, FileText, ArrowLeft } from 'lucide-react'

function formatBytes(b) {
  if (!b) return '0 B'; const gb = b / (1024 ** 3)
  if (gb >= 1) return `${gb.toFixed(2)} GB`; return `${(b / (1024 ** 2)).toFixed(1)} MB`
}

export default function EmployeeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [emp, setEmp] = useState(null)
  const [drives, setDrives] = useState([])
  const [files, setFiles] = useState([])
  const [fileSearch, setFileSearch] = useState('')

  useEffect(() => {
    employeeApi.get(id).then(r => setEmp(r.data))
    employeeApi.drives(id).then(r => setDrives(r.data))
    employeeApi.files(id, { limit: 100 }).then(r => setFiles(r.data.files))
  }, [id])

  const searchFiles = async (q) => {
    setFileSearch(q)
    const r = await employeeApi.files(id, { search: q || undefined, limit: 100 })
    setFiles(r.data.files)
  }

  if (!emp) return <div style={{ padding: 28, color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div style={{ padding: 28 }}>
      <button onClick={() => navigate('/admin/employees')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 13 }}>
        <ArrowLeft size={14} /> Back to Employees
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{emp.full_name}</h2>
          <div style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 12 }}>{emp.emp_code}</div>
          {[['Department', emp.department], ['Designation', emp.designation], ['Email', emp.email], ['Date Left', emp.date_left && new Date(emp.date_left).toLocaleDateString()]].map(([k, v]) => v && (
            <div key={k} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k}</div>
              <div style={{ fontSize: 13 }}>{v}</div>
            </div>
          ))}
        </div>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Drives ({drives.length})</h3>
          {drives.map(d => (
            <div key={d.drive_id} className="card" style={{ padding: 16, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <HardDrive size={16} color="var(--accent)" />
                <div>
                  <div style={{ fontWeight: 600 }}>{d.drive_number}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.folder_path}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{d.total_files?.toLocaleString()} files</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatBytes(d.total_size_bytes)}</div>
                {d.shelf_location && <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}><MapPin size={10} />Row {d.shelf_location.row_number} · {d.shelf_location.shelf} · Slot {d.shelf_location.slot}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>Files</h3>
          <input value={fileSearch} onChange={e => searchFiles(e.target.value)} placeholder="Search files..." style={{ width: 220, fontSize: 12, padding: '6px 10px' }} />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: 'var(--surface2)' }}>
            {['File Name', 'Path', 'Size', 'Modified'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 14px', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {files.map(f => (
              <tr key={f.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '9px 14px', fontWeight: 500 }}>{f.file_name}</td>
                <td style={{ padding: '9px 14px', color: 'var(--text-muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.file_path}</td>
                <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>{formatBytes(f.file_size_bytes)}</td>
                <td style={{ padding: '9px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{f.file_modified_at ? new Date(f.file_modified_at).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
