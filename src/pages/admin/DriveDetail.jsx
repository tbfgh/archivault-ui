import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { driveApi } from '../../api'
import { ArrowLeft, HardDrive, MapPin, Pencil, X } from 'lucide-react'

function formatBytes(b) { const gb = b / (1024 ** 3); return gb >= 1 ? `${gb.toFixed(2)} GB` : `${(b / (1024 ** 2)).toFixed(1)} MB` }

export default function DriveDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [drive, setDrive] = useState(null)
  const [employees, setEmployees] = useState([])
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    driveApi.get(id).then(r => setDrive(r.data))
    driveApi.employees(id).then(r => setEmployees(r.data))
  }
  useEffect(() => { load() }, [id])

  const openEdit = () => {
    setError('')
    setForm({
      capacity_gb: drive.capacity_gb,
      status: drive.status,
      notes: drive.notes || '',
      shelf_row: drive.shelf_location?.row_number || '',
      shelf_shelf: drive.shelf_location?.shelf || '',
      shelf_slot: drive.shelf_location?.slot || '',
      shelf_notes: drive.shelf_location?.notes || ''
    })
    setShowEdit(true)
  }

  const submitEdit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const hasShelf = form.shelf_row || form.shelf_shelf || form.shelf_slot
      await driveApi.update(id, {
        capacity_gb: parseFloat(form.capacity_gb),
        status: form.status,
        notes: form.notes || null,
        shelf_location: hasShelf ? {
          row_number: form.shelf_row, shelf: form.shelf_shelf, slot: form.shelf_slot,
          notes: form.shelf_notes || null
        } : null
      })
      setShowEdit(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update drive')
    } finally {
      setSaving(false)
    }
  }

  if (!drive) return <div style={{ padding: 28, color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={() => navigate('/admin/drives')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <ArrowLeft size={14} /> Back to Drives
        </button>
        <button className="btn-outline" onClick={openEdit} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <Pencil size={13} /> Edit Drive
        </button>
      </div>
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
          {drive.notes && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>{drive.notes}</div>
          )}
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

      {showEdit && form && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ padding: 24, width: 440, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Edit Drive {drive.drive_number}</h2>
              <button onClick={() => setShowEdit(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={submitEdit}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                Drive number can't be changed after creation. Retire this drive and register a new one if it was mislabeled.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label>Capacity (GB) *</label>
                  <input type="number" min="1" value={form.capacity_gb} onChange={e => setForm({ ...form, capacity_gb: e.target.value })} required />
                </div>
                <div>
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="damaged">Damaged</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shelf Location</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label>Row</label>
                  <input value={form.shelf_row} onChange={e => setForm({ ...form, shelf_row: e.target.value })} />
                </div>
                <div>
                  <label>Shelf</label>
                  <input value={form.shelf_shelf} onChange={e => setForm({ ...form, shelf_shelf: e.target.value })} />
                </div>
                <div>
                  <label>Slot</label>
                  <input value={form.shelf_slot} onChange={e => setForm({ ...form, shelf_slot: e.target.value })} />
                </div>
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
