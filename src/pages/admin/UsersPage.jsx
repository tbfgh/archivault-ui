import React, { useEffect, useState } from 'react'
import { adminApi, employeeApi, departmentApi } from '../../api'
import { useAuthStore } from '../../store/authStore'
import { UserPlus, X } from 'lucide-react'

const ROLE_COLOR = { superadmin: 'var(--error)', admin: 'var(--accent)', employee: 'var(--text-muted)' }

export default function UsersPage() {
  const { role } = useAuthStore()
  const isSuperadmin = role === 'superadmin'
  const [users, setUsers] = useState([])
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: 'employee', employee_id: '', department_ids: [] })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    adminApi.users().then(r => setUsers(r.data)).finally(() => setLoading(false))
    employeeApi.list({ limit: 200 }).then(r => setEmployees(r.data))
    departmentApi.list().then(r => setDepartments(r.data)).catch(() => setDepartments([]))
  }
  useEffect(() => { load() }, [])

  const toggleDept = (id) => {
    setForm(f => {
      const next = new Set(f.department_ids)
      next.has(id) ? next.delete(id) : next.add(id)
      return { ...f, department_ids: [...next] }
    })
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        ...form,
        role: isSuperadmin ? form.role : 'employee',
        employee_id: form.employee_id ? parseInt(form.employee_id) : null,
        department_ids: form.role === 'admin' ? form.department_ids : [],
      }
      await adminApi.createUser(payload)
      setShowCreate(false)
      setForm({ email: '', full_name: '', password: '', role: 'employee', employee_id: '', department_ids: [] })
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
                  {(isSuperadmin || u.role !== 'superadmin') ? (
                    <button className="btn-outline" onClick={() => toggleActive(u)} style={{ fontSize: 11, padding: '4px 10px' }}>
                      {u.is_active ? 'Disable' : 'Enable'}
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                  )}
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
                <select
                  value={isSuperadmin ? form.role : 'employee'}
                  disabled={!isSuperadmin}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                >
                  <option value="employee">Employee</option>
                  {isSuperadmin && <option value="admin">Admin</option>}
                  {isSuperadmin && <option value="superadmin">Super Admin</option>}
                </select>
                {!isSuperadmin && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Only superadmins can create admin or superadmin accounts.
                  </div>
                )}
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
              {form.role === 'admin' && (
                <div style={{ marginBottom: 16 }}>
                  <label>Department Access</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
                    {departments.length === 0 && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        No departments exist yet — create one on the Departments page first, or leave unassigned (this admin will see no data until assigned).
                      </span>
                    )}
                    {departments.map(d => (
                      <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        <input type="checkbox" checked={form.department_ids.includes(d.id)} onChange={() => toggleDept(d.id)} />
                        {d.name}
                      </label>
                    ))}
                  </div>
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
