import React, { useEffect, useState } from 'react'
import { employeeApi, departmentApi } from '../../api'
import { useNavigate } from 'react-router-dom'
import { Search, Users, Plus, X } from 'lucide-react'

const EMPTY_FORM = {
  emp_code: '', full_name: '', department_id: '', designation: '',
  email: '', phone: '', date_joined: '', date_left: '', notes: ''
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const load = async (q = '') => {
    setLoading(true)
    try { const r = await employeeApi.list({ search: q || undefined, limit: 100 }); setEmployees(r.data) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    departmentApi.list().then(r => setDepartments(r.data)).catch(() => setDepartments([]))
  }, [])

  const submitCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await employeeApi.create({
        emp_code: form.emp_code.trim(),
        full_name: form.full_name.trim(),
        department_id: form.department_id ? parseInt(form.department_id) : null,
        designation: form.designation || null,
        email: form.email || null,
        phone: form.phone || null,
        date_joined: form.date_joined || null,
        date_left: form.date_left || null,
        notes: form.notes || null,
      })
      setShowCreate(false)
      setForm(EMPTY_FORM)
      load(search)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create employee')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Ex-Employees</h1>
        <button className="btn-primary" onClick={() => { setForm(EMPTY_FORM); setError(''); setShowCreate(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> New Employee
        </button>
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

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ padding: 24, width: 440, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>New Employee</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={submitCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label>Employee Code *</label>
                  <input value={form.emp_code} onChange={e => setForm({ ...form, emp_code: e.target.value })} required placeholder="e.g. EMP2041" />
                </div>
                <div>
                  <label>Full Name *</label>
                  <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required placeholder="e.g. John Malik" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label>Department</label>
                  <select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
                    <option value="">— None —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label>Designation</label>
                  <input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Accountant" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label>Phone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label>Date Joined</label>
                  <input type="date" value={form.date_joined} onChange={e => setForm({ ...form, date_joined: e.target.value })} />
                </div>
                <div>
                  <label>Date Left</label>
                  <input type="date" value={form.date_left} onChange={e => setForm({ ...form, date_left: e.target.value })} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              {error && <div style={{ color: 'var(--error)', fontSize: 12, marginBottom: 12 }}>{error}</div>}
              <button className="btn-primary" type="submit" disabled={saving} style={{ width: '100%' }}>
                {saving ? 'Creating...' : 'Create Employee'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
