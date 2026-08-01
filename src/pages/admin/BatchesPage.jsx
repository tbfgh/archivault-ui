import React, { useEffect, useState } from 'react'
import { batchApi, employeeApi, driveApi } from '../../api'
import { Layers, Trash2 } from 'lucide-react'

export default function BatchesPage() {
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [batchDetail, setBatchDetail] = useState(null)
  const [employees, setEmployees] = useState([])
  const [drives, setDrives] = useState([])
  const [form, setForm] = useState({ employee_id: '', drive_id: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadBatches = async () => {
    setLoading(true)
    try {
      const { data } = await batchApi.list()
      setBatches(data)
      if (data.length > 0) {
        handleSelectBatch(data[0].session_id)
      }
      setError('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load batches')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBatches()
    employeeApi.list({ limit: 500 }).then(r => setEmployees(r.data))
    driveApi.list({ limit: 500 }).then(r => setDrives(r.data))
  }, [])

  const handleSelectBatch = async (sessionId) => {
    setSelectedBatch(sessionId)
    setSuccess('')
    setError('')
    try {
      const { data } = await batchApi.files(sessionId)
      setBatchDetail(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load batch detail')
    }
  }

  const handleBulkUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    const payload = {}
    if (form.employee_id) payload.employee_id = parseInt(form.employee_id)
    if (form.drive_id) payload.drive_id = parseInt(form.drive_id)

    if (Object.keys(payload).length === 0) {
      setError('Select at least one field to change.')
      return
    }
    try {
      const { data } = await batchApi.bulkUpdate(selectedBatch, payload)
      setSuccess(`Updated ${data.updated_count} file(s) in this batch.`)
      setForm({ employee_id: '', drive_id: '' })
      handleSelectBatch(selectedBatch)
    } catch (err) {
      setError(err.response?.data?.detail || 'Bulk update failed.')
    }
  }

  const handleDeleteBatch = async (sessionId) => {
    const batch = batches.find(b => b.session_id === sessionId)
    const label = batch ? `Drive ${batch.drive_number || batch.drive_id} · ${batch.total_files} files · started ${new Date(batch.started_at).toLocaleString()}` : `#${sessionId}`
    if (!window.confirm(`Delete this batch permanently?\n\n${label}\n\nAll indexed file records in this batch will be removed. This cannot be undone.`)) return
    setError('')
    setSuccess('')
    try {
      const { data } = await batchApi.remove(sessionId)
      setSuccess(`Deleted batch #${sessionId} (${data.deleted_files} file record(s) removed).`)
      setSelectedBatch(null)
      setBatchDetail(null)
      await loadBatches()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete batch')
    }
  }

  if (loading) return <div style={{ padding: 28, color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Layers size={20} />
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Indexer Batches</h1>
      </div>

      {error && <div style={{ color: 'var(--error)', fontSize: 13, marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ color: 'var(--success)', fontSize: 13, marginBottom: 16 }}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 8, maxHeight: 560, overflowY: 'auto' }}>
          {batches.length === 0 && (
            <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>No indexer batches yet.</div>
          )}
          {batches.map((b, i) => (
            <button
              key={b.session_id}
              onClick={() => handleSelectBatch(b.session_id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 12px', marginBottom: 4, borderRadius: 8,
                border: 'none', cursor: 'pointer',
                background: selectedBatch === b.session_id ? 'rgba(79,110,247,0.12)' : 'transparent',
                color: selectedBatch === b.session_id ? 'var(--accent)' : 'var(--text)',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {i === 0 ? 'Most recent' : new Date(b.started_at).toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Drive {b.drive_number || b.drive_id} · {b.total_files} files · {b.status}
              </div>
            </button>
          ))}
        </div>

        <div>
          {selectedBatch && batchDetail ? (
            <>
              <div className="card" style={{ padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                      Batch #{selectedBatch}
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                      {batchDetail.total} file(s) linked to this batch
                    </p>
                  </div>
                  <button
                    className="btn-outline"
                    onClick={() => handleDeleteBatch(selectedBatch)}
                    style={{ fontSize: 12, padding: '6px 12px', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Trash2 size={13} /> Delete Batch
                  </button>
                </div>

                <form onSubmit={handleBulkUpdate} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 220 }}>
                    <label>Reassign employee</label>
                    <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}>
                      <option value="">— no change —</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.emp_code})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ minWidth: 180 }}>
                    <label>Reassign drive</label>
                    <select value={form.drive_id} onChange={e => setForm({ ...form, drive_id: e.target.value })}>
                      <option value="">— no change —</option>
                      {drives.map(d => (
                        <option key={d.id} value={d.id}>{d.drive_number}</option>
                      ))}
                    </select>
                  </div>
                  <button className="btn-primary" type="submit">
                    Apply to all {batchDetail.total} files
                  </button>
                </form>
              </div>

              <div className="card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface2)' }}>
                      {['File', 'Employee ID', 'Drive ID', 'Size'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {batchDetail.files.map(f => (
                      <tr key={f.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 14px' }}>{f.file_name}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{f.employee_id}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{f.drive_id}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{(f.file_size_bytes / 1024).toFixed(1)} KB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {batchDetail.total > batchDetail.preview_limit && (
                  <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                    Showing first {batchDetail.preview_limit} of {batchDetail.total} files. Bulk actions above still apply to all of them.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a batch to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
