import React, { useEffect, useState } from 'react'
import { adminApi, employeeApi } from '../../api'
import { UserPlus, X } from 'lucide-react'

const ROLE_COLOR = { superadmin: 'var(--error)', admin: 'var(--accent)', employee: 'var(--text-muted)' }

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [employees, setEmployees] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: 'employee', employee_id: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    adminApi.users().then(r => setUsers(r.data)).finally(() => setLoading(false))
    employeeApi.list({ limit: 200 }).then(r => setEmployees(r.data))
  }
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = { ...form, employee_id: form.employee_id ? parseInt(form.employee_id) : null }
      await adminApi.createUser(payload)
      setShowCreate(false)
      setForm({ email: '', full_name: '', password: '', role: 'employee', employee_id: '' })
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user')
    }
  }

  const toggleActive = async (u) => {
    await adminApi.updateUser(u.id, { is_active: !u.is_active })
    load()
  }

  if (loading) return <div style={{ padding: 28, color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Users</h1>
        <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <UserPlus size={15} /> New User
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: 'var(--surface2)' }}>
            {['Name', 'Email', 'Role', 'Status', 'Created', 'Actions'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 500 }}>{u.full_name}</td>
                <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{u.email}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span className="badge" style={{ background: `${ROLE_COLOR[u.role]}20`, color: ROLE_COLOR[u.role] }}>{u.role}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span className="badge" style={{ background: u.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: u.is_active ? 'var(--success)' : 'var(--error)' }}>
                    {u.is_active ? 'active' : 'disabled'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '12px 14px' }}>
                  <button className="btn-outline" onClick={() => toggleActive(u)} style={{ fontSize: 11, padding: '4px 10px' }}>
                    {u.is_active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ padding: 24, width: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Create User</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={submit}>
              <div style={{ marginBottom: 12 }}>
                <label>Full Name</label>
                <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Password</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              {form.role === 'employee' && (
                <div style={{ marginBottom: 16 }}>
                  <label>Link to Employee Record</label>
                  <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}>
                    <option value="">— Select Employee —</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.emp_code})</option>)}
                  </select>
                </div>
              )}
              {error && <div style={{ color: 'var(--error)', fontSize: 12, marginBottom: 12 }}>{error}</div>}
              <button className="btn-primary" type="submit" style={{ width: '100%' }}>Create User</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
