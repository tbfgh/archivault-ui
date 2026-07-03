import React, { useEffect, useState } from 'react'
import { employeeApi } from '../../api'
import { useNavigate } from 'react-router-dom'
import { Search, Users } from 'lucide-react'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = async (q = '') => {
    setLoading(true)
    try { const r = await employeeApi.list({ search: q || undefined, limit: 100 }); setEmployees(r.data) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Ex-Employees</h1>
      </div>
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 340 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => { setSearch(e.target.value); load(e.target.value) }}
          placeholder="Search by name or code..." style={{ paddingLeft: 30 }} />
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 24, color: 'var(--text-muted)', textAlign: 'center' }}>Loading...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Emp Code', 'Full Name', 'Department', 'Designation', 'Date Left', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map(e => (
                <tr key={e.id} onClick={() => navigate(`/admin/employees/${e.id}`)}
                  style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}
                  onMouseEnter={ev => ev.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--accent)' }}>{e.emp_code}</td>
                  <td style={{ padding: '12px 14px' }}>{e.full_name}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{e.department || '—'}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{e.designation || '—'}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{e.date_left ? new Date(e.date_left).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--accent)', fontSize: 12 }}>View →</td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Users size={28} style={{ marginBottom: 8, opacity: 0.3 }} /><br/>No employees found
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
