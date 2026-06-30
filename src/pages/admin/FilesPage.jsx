import React, { useState, useCallback } from 'react'
import { fileApi, requestApi } from '../../api'
import { Search, HardDrive, MapPin, Clock, Plus, X } from 'lucide-react'

function formatBytes(b) {
  if (!b) return '0 B'
  const mb = b / (1024 ** 2)
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${(b / 1024).toFixed(1)} KB`
}

export default function FilesPage() {
  const [query, setQuery] = useState('')
  const [empCode, setEmpCode] = useState('')
  const [fileType, setFileType] = useState('')
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState([])
  const [estimate, setEstimate] = useState(null)
  const [requesting, setRequesting] = useState(false)

  const search = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fileApi.search({ search: query || undefined, emp_code: empCode || undefined, file_type: fileType || undefined, limit: 50 })
      setResults(res.data.results)
      setTotal(res.data.total)
    } catch {} finally { setLoading(false) }
  }, [query, empCode, fileType])

  const toggleSelect = (fileId) => {
    setSelected(prev => prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId])
    setEstimate(null)
  }

  const getEstimate = async () => {
    if (!selected.length) return
    try {
      const res = await fileApi.estimate(selected)
      setEstimate(res.data)
    } catch {}
  }

  const submitRequest = async () => {
    if (!selected.length) return
    const empId = results.find(r => selected.includes(r.file.id))?.file?.employee_id
    if (!empId) return
    setRequesting(true)
    try {
      await requestApi.create({ employee_id: empId, file_ids: selected })
      setSelected([])
      setEstimate(null)
      alert('Retrieval request submitted!')
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to submit request')
    } finally { setRequesting(false) }
  }

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>File Search</h1>

      {/* Search bar */}
      <div className="card" style={{ padding: 18, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 140px auto', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label>Search Filename</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                placeholder="report.pdf, backup.zip..." style={{ paddingLeft: 30 }} />
            </div>
          </div>
          <div>
            <label>Employee Code</label>
            <input value={empCode} onChange={e => setEmpCode(e.target.value)} placeholder="EMP2041" />
          </div>
          <div>
            <label>File Type</label>
            <input value={fileType} onChange={e => setFileType(e.target.value)} placeholder="pdf, xlsx..." />
          </div>
          <button className="btn-primary" onClick={search} disabled={loading} style={{ padding: '9px 20px' }}>
            {loading ? '...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Selection toolbar */}
      {selected.length > 0 && (
        <div style={{ background: 'rgba(79,110,247,0.1)', border: '1px solid var(--accent)', borderRadius: 8, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{selected.length} file{selected.length > 1 ? 's' : ''} selected</span>
          {estimate && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {estimate.total_size_mb.toFixed(1)} MB · ~{estimate.estimated_minutes.toFixed(1)} min · Drives: {estimate.drives_required.join(', ')}
            </span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {!estimate
              ? <button className="btn-outline" onClick={getEstimate} style={{ fontSize: 12 }}>Get Estimate</button>
              : <button className="btn-primary" onClick={submitRequest} disabled={requesting} style={{ fontSize: 12 }}>
                  {requesting ? 'Submitting...' : 'Submit Request'}
                </button>
            }
            <button className="btn-outline" onClick={() => { setSelected([]); setEstimate(null) }} style={{ fontSize: 12 }}>
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {total > 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{total.toLocaleString()} results found</div>}

      {results.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                <th style={{ width: 36, padding: '10px 12px' }}></th>
                {['File Name', 'Employee', 'Drive', 'Shelf', 'Size', 'Est. Time', 'Modified'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.file.id}
                  style={{ borderTop: '1px solid var(--border)', background: selected.includes(r.file.id) ? 'rgba(79,110,247,0.08)' : 'transparent' }}
                  onMouseEnter={e => !selected.includes(r.file.id) && (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => !selected.includes(r.file.id) && (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '10px 12px' }}>
                    <input type="checkbox" checked={selected.includes(r.file.id)} onChange={() => toggleSelect(r.file.id)} />
                  </td>
                  <td style={{ padding: '10px 12px', maxWidth: 260 }}>
                    <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.file.file_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.file.file_path}</div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div>{r.employee_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.emp_code}</div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><HardDrive size={12} color="var(--text-muted)" /> {r.drive_number}</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
                    {r.shelf_location ? <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11} /> Row {r.shelf_location.row_number} · {r.shelf_location.shelf} · Slot {r.shelf_location.slot}</span> : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{formatBytes(r.file.file_size_bytes)}</td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} /> {r.estimated_retrieval_seconds < 60 ? `${r.estimated_retrieval_seconds}s` : `${(r.estimated_retrieval_seconds/60).toFixed(1)}m`}</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {r.file.file_modified_at ? new Date(r.file.file_modified_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {results.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Search size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontSize: 14 }}>Search for files across all indexed drives</div>
        </div>
      )}
    </div>
  )
}
