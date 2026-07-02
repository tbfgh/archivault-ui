import React, { useEffect, useState } from 'react'
import { authApi, employeeApi, fileApi, requestApi } from '../../api'
import { Search, FileText, Clock, Plus, X } from 'lucide-react'

function formatBytes(b) {
  if (!b) return '0 B'; const mb = b / (1024 ** 2)
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(b / 1024).toFixed(1)} KB`
}

export default function PortalBrowse() {
  const [empId, setEmpId] = useState(null)
  const [files, setFiles] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const [estimate, setEstimate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    authApi.me().then(r => {
      if (r.data.employee_id) {
        setEmpId(r.data.employee_id)
        loadFiles(r.data.employee_id)
      } else {
        setLoading(false)
      }
    })
  }, [])

  const loadFiles = async (id, q = '') => {
    setLoading(true)
    try {
      const r = await employeeApi.files(id, { search: q || undefined, limit: 200 })
      setFiles(r.data.files)
    } finally { setLoading(false) }
  }

  const handleSearch = (q) => { setSearch(q); empId && loadFiles(empId, q) }

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    setEstimate(null)
  }

  const getEstimate = async () => {
    if (!selected.length) return
    const r = await fileApi.estimate(selected)
    setEstimate(r.data)
  }

  const submitRequest = async () => {
    if (!selected.length || !empId) return
    setSubmitting(true)
    try {
      await requestApi.create({ employee_id: empId, file_ids: selected })
      setSelected([]); setEstimate(null)
      alert('Your retrieval request has been submitted. IT will be notified.')
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to submit request')
    } finally { setSubmitting(false) }
  }

  if (!loading && !empId) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
        Your account isn't linked to an employee record yet. Contact IT for access.
      </div>
    )
  }

  return (
    <div style={{ padding: 28, maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>My Files</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
        Browse your archived data. Select files and request retrieval from offline storage.
      </p>

      <div style={{ position: 'relative', marginBottom: 18, maxWidth: 360 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search your files..." style={{ paddingLeft: 30 }} />
      </div>

      {selected.length > 0 && (
        <div style={{ background: 'rgba(79,110,247,0.1)', border: '1px solid var(--accent)', borderRadius: 8, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{selected.length} file{selected.length > 1 ? 's' : ''} selected</span>
          {estimate && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {estimate.total_size_mb.toFixed(1)} MB · est. {estimate.estimated_minutes.toFixed(1)} min retrieval
            </span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {!estimate
              ? <button className="btn-outline" onClick={getEstimate} style={{ fontSize: 12 }}>Get Time Estimate</button>
              : <button className="btn-primary" onClick={submitRequest} disabled={submitting} style={{ fontSize: 12 }}>
                  {submitting ? 'Submitting...' : 'Request This Data'}
                </button>}
            <button className="btn-outline" onClick={() => { setSelected([]); setEstimate(null) }} style={{ fontSize: 12 }}><X size={13} /></button>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: 'var(--surface2)' }}>
              <th style={{ width: 36, padding: '10px 12px' }}></th>
              {['File Name', 'Path', 'Size', 'Modified'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {files.map(f => (
                <tr key={f.id} style={{ borderTop: '1px solid var(--border)', background: selected.includes(f.id) ? 'rgba(79,110,247,0.08)' : 'transparent' }}>
                  <td style={{ padding: '9px 12px' }}>
                    <input type="checkbox" checked={selected.includes(f.id)} onChange={() => toggleSelect(f.id)} disabled={f.is_directory} />
                  </td>
                  <td style={{ padding: '9px 12px', fontWeight: 500 }}>
                    {f.is_directory ? '📁 ' : '📄 '}{f.file_name}
                  </td>
                  <td style={{ padding: '9px 12px', color: 'var(--text-muted)', fontSize: 12, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.file_path}</td>
                  <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{f.is_directory ? '—' : formatBytes(f.file_size_bytes)}</td>
                  <td style={{ padding: '9px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{f.file_modified_at ? new Date(f.file_modified_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <FileText size={28} style={{ marginBottom: 8, opacity: 0.3 }} /><br/>No files found
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
