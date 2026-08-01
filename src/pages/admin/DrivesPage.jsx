// DrivesPage.jsx
import React, { useEffect, useState } from 'react'
import { driveApi } from '../../api'
import { useNavigate } from 'react-router-dom'
import { HardDrive, Plus, MapPin, X } from 'lucide-react'

const STATUS_COLOR = { active: 'var(--success)', damaged: 'var(--error)', retired: 'var(--text-muted)' }

const EMPTY_FORM = {
  drive_number: '', capacity_gb: '', drive_type: 'SAS', filesystem: 'NTFS',
  status: 'active', notes: '',
  shelf_row: '', shelf_shelf: '', shelf_slot: '', shelf_notes: ''
}

export function DrivesPage() {
  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const load = () => { setLoading(true); driveApi.list().then(r => setDrives(r.data)).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const submitCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const hasShelf = form.shelf_row || form.shelf_shelf || form.shelf_slot
      await driveApi.create({
        drive_number: form.drive_number.trim(),
        capacity_gb: parseFloat(form.capacity_gb),
        drive_type: form.drive_type,
        filesystem: form.filesystem,
        status: form.status,
        notes: form.notes || null,
        shelf_location: hasShelf ? {
          row_number: form.shelf_row, shelf: form.shelf_shelf, slot: form.shelf_slot,
          notes: form.shelf_notes || null
        } : null
      })
      setShowCreate(false)
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create drive')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 28, color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Drives</h1>
        <button className="btn-primary" onClick={() => { setForm(EMPTY_FORM); setError(''); setShowCreate(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> New Drive
        </button>
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
        {drives.length === 0 && (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            No drives registered yet.
          </div>
        )}
      </div>

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ padding: 24, width: 440, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>New Drive</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={submitCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label>Drive Number *</label>
                  <input value={form.drive_number} onChange={e => setForm({ ...form, drive_number: e.target.value })} required placeholder="e.g. D042" />
                </div>
                <div>
                  <label>Capacity (GB) *</label>
                  <input type="number" min="1" value={form.capacity_gb} onChange={e => setForm({ ...form, capacity_gb: e.target.value })} required placeholder="e.g. 4000" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label>Drive Type</label>
                  <select value={form.drive_type} onChange={e => setForm({ ...form, drive_type: e.target.value })}>
                    <option value="SAS">SAS</option>
                    <option value="SATA">SATA</option>
                    <option value="SSD">SSD</option>
                    <option value="NVMe">NVMe</option>
                  </select>
                </div>
                <div>
                  <label>Filesystem</label>
                  <select value={form.filesystem} onChange={e => setForm({ ...form, filesystem: e.target.value })}>
                    <option value="NTFS">NTFS</option>
                    <option value="exFAT">exFAT</option>
                    <option value="ext4">ext4</option>
                    <option value="APFS">APFS</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="damaged">Damaged</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
              <div style={{ marginBottom: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shelf Location (optional)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label>Row</label>
                  <input value={form.shelf_row} onChange={e => setForm({ ...form, shelf_row: e.target.value })} placeholder="e.g. Row-2" />
                </div>
                <div>
                  <label>Shelf</label>
                  <input value={form.shelf_shelf} onChange={e => setForm({ ...form, shelf_shelf: e.target.value })} placeholder="e.g. B" />
                </div>
                <div>
                  <label>Slot</label>
                  <input value={form.shelf_slot} onChange={e => setForm({ ...form, shelf_slot: e.target.value })} placeholder="e.g. 4" />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              {error && <div style={{ color: 'var(--error)', fontSize: 12, marginBottom: 12 }}>{error}</div>}
              <button className="btn-primary" type="submit" disabled={saving} style={{ width: '100%' }}>
                {saving ? 'Creating...' : 'Create Drive'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default DrivesPage
