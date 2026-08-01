// EmployeeDetail.jsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { employeeApi, departmentApi } from '../../api'
import { HardDrive, MapPin, FileText, ArrowLeft, Pencil, X } from 'lucide-react'

function formatBytes(b) {
  if (!b) return '0 B'; const gb = b / (1024 ** 3)
  if (gb >= 1) return `${gb.toFixed(2)} GB`; return `${(b / (1024 ** 2)).toFixed(1)} MB`
}

function toDateInput(v) { return v ? v.slice(0, 10) : '' }

export default function EmployeeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [emp, setEmp] = useState(null)
  const [drives, setDrives] = useState([])
  const [files, setFiles] = useState([])
  const [fileSearch, setFileSearch] = useState('')
  const [departments, setDepartments] = useState([])
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    employeeApi.get(id).then(r => setEmp(r.data))
    employeeApi.drives(id).then(r => setDrives(r.data))
    employeeApi.files(id, { limit: 100 }).then(r => setFiles(r.data.files))
  }
  useEffect(() => {
    load()
    departmentApi.list().then(r => setDepartments(r.data)).catch(() => setDepartments([]))
  }, [id])

  const searchFiles = async (q) => {
    setFileSearch(q)
    const r = await employeeApi.files(id, { search: q || undefined, limit: 100 })
    setFiles(r.data.files)
  }

  const openEdit = () => {
    setError('')
    setForm({
      full_name: emp.full_name,
      department_id: emp.department_id || '',
      designation: emp.designation || '',
      email: emp.email || '',
      phone: emp.phone || '',
      date_joined: toDateInput(emp.date_joined),
      date_left: toDateInput(emp.date_left),
      notes: emp.notes || '',
      is_active: emp.is_active,
    })
    setShowEdit(true)
  }

  const submitEdit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await employeeApi.update(id, {
        full_name: form.full_name.trim(),
        department_id: form.department_id ? parseInt(form.department_id) : null,
        designation: form.designation || null,
        email: form.email || null,
        phone: form.phone || null,
        date_joined: form.date_joined || null,
        date_left: form.date_left || null,
        notes: form.notes || null,
        is_active: form.is_active,
      })
      setShowEdit(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update employee')
    } finally {
      setSaving(false)
    }
  }

  if (!emp) return <div style={{ padding: 28, color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={() => navigate('/admin/employees')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <ArrowLeft size={14} /> Back to Employees
        </button>
        <button className="btn-outline" onClick={openEdit} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <Pencil size={13} /> Edit Employee
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{emp.full_name}</h2>
            {!emp.is_active && <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--error)' }}>inactive</span>}
          </div>
          <div style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 12 }}>{emp.emp_code}</div>
          {[['Department', emp.department], ['Designation', emp.designation], ['Email', emp.email], ['Phone', emp.phone], ['Date Joined', emp.date_joined && new Date(emp.date_joined).toLocaleDateString()], ['Date Left', emp.date_left && new Date(emp.date_left).toLocaleDateString()]].map(([k, v]) => v && (
            <div key={k} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k}</div>
              <div style={{ fontSize: 13 }}>{v}</div>
            </div>
          ))}
          {emp.notes && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>{emp.notes}</div>
          )}
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

      {showEdit && form && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ padding: 24, width: 440, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Edit {emp.emp_code}</h2>
              <button onClick={() => setShowEdit(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={submitEdit}>
              <div style={{ marginBottom: 12 }}>
                <label>Full Name *</label>
                <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label>Department</label>
                  <select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
                    <option value="">— None —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label>Designation</label>
                  <input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label>Phone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label>Date Joined</label>
                  <input type="date" value={form.date_joined} onChange={e => setForm({ ...form, date_joined: e.target.value })} />
                </div>
                <div>
                  <label>Date Left</label>
                  <input type="date" value={form.date_left} onChange={e => setForm({ ...form, date_left: e.target.value })} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                  Active (uncheck to hide from Indexer selection lists)
                </label>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              {error && <div style={{ color: 'var(--error)', fontSize: 12, marginBottom: 12 }}>{error}</div>}
              <button className="btn-primary" type="submit" disabled={saving} style={{ width: '100%' }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
