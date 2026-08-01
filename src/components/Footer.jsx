import React, { useEffect, useState } from 'react'
import { metaApi } from '../api'

export default function Footer() {
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    metaApi.get().then(r => setMeta(r.data)).catch(() => {})
  }, [])

  const year = new Date().getFullYear()

  return (
    <footer style={{
      padding: '14px 28px',
      borderTop: '1px solid var(--border)',
      color: 'var(--text-muted)',
      fontSize: 12,
      display: 'flex',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8
    }}>
      <span>
        {meta?.app_name || 'ArchiveVault'}
        {meta?.version && <> · v{meta.version}</>}
      </span>
      <span>© {year} {meta?.company_name || ''}</span>
    </footer>
  )
}
