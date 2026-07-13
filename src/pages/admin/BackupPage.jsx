import React, { useEffect, useState, useCallback, useRef } from 'react'
import { backupApi } from '../../api'
import { DatabaseBackup, Download, Trash2, Upload, RotateCcw } from 'lucide-react'

const POLL_MS = 2000

export default function BackupPage() {
  const [backups, setBackups] = useState([])
  const [safety, setSafety] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [restoreStatus, setRestoreStatus] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null) // { type: 'existing'|'upload', filename?, file? }
  const [error, setError] = useState('')
  const pollRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [b, s] = await Promise.all([backupApi.list(), backupApi.safetyList()])
      setBackups(b.data)
      setSafety(s.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load backups')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await backupApi.restoreStatus()
        setRestoreStatus(data)
        if (data.state === 'done') {
          clearInterval(pollRef.current)
          setTimeout(() => {
            localStorage.clear()
            window.location.href = '/login'
          }, 2500)
        }
        if (data.state === 'error') {
          clearInterval(pollRef.current)
        }
      } catch {
        // transient 503 during restore is expected — keep polling
      }
    }, POLL_MS)
  }

  const handleCreateBackup = async () => {
    setCreating(true)
    setError('')
    try {
      await backupApi.create()
      await load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Backup creation failed')
    } finally {
      setCreating(false)
    }
  }

  const handleDownload = (filename) => {
    // Uses the api client's baseURL + auth header via a direct window.open won't carry the
    // Authorization header, so route through backupApi to fetch as a blob instead.
    backupApi.download(filename).then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)
    }).catch(() => setError('Download failed'))
  }

  const handleDeleteBackup = async (filename) => {
    if (!window.confirm(`Delete backup "${filename}"? This cannot be undone.`)) return
    try {
      await backupApi.remove(filename)
      await load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete backup')
    }
  }

  const confirmAndRestore = async () => {
    if (!confirmTarget) return
    setError('')
    try {
      if (confirmTarget.type === 'existing') {
        await backupApi.restoreExisting(confirmTarget.filename)
      } else {
        const formData = new FormData()
        formData.append('file', confirmTarget.file)
        await backupApi.restoreUpload(formData)
      }
      setRestoreStatus({ state: 'queued', detail: 'Restore starting' })
      startPolling()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start restore')
    } finally {
      setConfirmTarget(null)
    }
  }

  const restoreInProgress = restoreStatus && !['idle', 'done', 'error'].includes(restoreStatus.state)

  if (loading) return <div style={{ padding: 28, color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <DatabaseBackup size={20} />
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Backup & Restore</h1>
      </div>

      {error && <div style={{ color: 'var(--error)', fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {restoreInProgress && (
        <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
          <strong>Restore in progress:</strong> {restoreStatus.detail}
          <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>
            The system will be unavailable to other users until this completes. Don't close this tab.
          </div>
        </div>
      )}
      {restoreStatus?.state === 'error' && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
          Restore failed: {restoreStatus.detail}. A safety snapshot of the previous state was taken before this attempt — see below.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600 }}>Backups</h2>
        <button className="btn-primary" onClick={handleCreateBackup} disabled={creating || restoreInProgress}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <DatabaseBackup size={14} /> {creating ? 'Creating…' : 'Create Backup Now'}
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden', marginBottom: 28 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['Filename', 'Size', 'Created', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {backups.map(b => (
              <tr key={b.filename} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 14px' }}>{b.filename}</td>
                <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{formatBytes(b.size_bytes)}</td>
                <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{new Date(b.created_at).toLocaleString()}</td>
                <td style={{ padding: '10px 14px', display: 'flex', gap: 8 }}>
                  <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => handleDownload(b.filename)}>
                    <Download size={12} /> Download
                  </button>
                  <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 4 }}
                    disabled={restoreInProgress}
                    onClick={() => setConfirmTarget({ type: 'existing', filename: b.filename })}>
                    <RotateCcw size={12} /> Restore
                  </button>
                  <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => handleDeleteBackup(b.filename)}>
                    <Trash2 size={12} /> Delete
                  </button>
                </td>
              </tr>
            ))}
            {backups.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No backups yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <details style={{ marginBottom: 28 }}>
        <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
          Pre-restore safety snapshots ({safety.length})
        </summary>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0' }}>
          Automatically created right before each restore, in case the file you restored wasn't the one you meant to use.
        </p>
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <tbody>
              {safety.map(s => (
                <tr key={s.filename} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px' }}>{s.filename}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{formatBytes(s.size_bytes)}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{new Date(s.created_at).toLocaleString()}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px', color: 'var(--error)' }}
                      disabled={restoreInProgress}
                      onClick={() => setConfirmTarget({ type: 'existing', filename: s.filename })}>
                      Restore this instead
                    </button>
                  </td>
                </tr>
              ))}
              {safety.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>None yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </details>

      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Restore from Uploaded File</h2>
      <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Upload size={16} style={{ color: 'var(--text-muted)' }} />
        <input type="file" accept=".tar.gz" disabled={restoreInProgress}
          onChange={(e) => {
            const file = e.target.files[0]
            if (file) setConfirmTarget({ type: 'upload', file })
          }} />
      </div>

      {confirmTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ padding: 24, width: 420 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
              Restore from "{confirmTarget.type === 'existing' ? confirmTarget.filename : confirmTarget.file.name}"?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              This will overwrite the current database with the contents of this backup.
              A safety snapshot of the current state will be taken automatically first,
              but this action should not be taken lightly.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setConfirmTarget(null)}>Cancel</button>
              <button className="btn-primary" style={{ background: 'var(--error)' }} onClick={confirmAndRestore}>
                Yes, restore now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}
