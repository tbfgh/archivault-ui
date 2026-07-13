import React, { useEffect, useState } from 'react'
import { departmentApi } from '../../api'
import { Plus, X, Pencil, Trash2 } from 'lucide-react'

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editingDept, setEditingDept] = useState(null) // department being renamed
  const [assigningUser, setAssigningUser] = useState(null) // user being edited
  const [form, setForm] = useState({ name: '', slug: '' })

  const load = async () => {
    setLoading(true)
    try {
      const [deptRes, userRes] = await Promise.all([
        departmentApi.list(),
        departmentApi.usersWithDepartments(),
      ])
      setDepartments(deptRes.data)
      setUsers(userRes.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const slugify = (name) => name.trim().toLowerCase().replace(/\s+/g, '-')

  const submitCreate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await departmentApi.create(form)
      setShowCreate(false)
      setForm({ name: '', slug: '' })
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create department')
    }
  }

  const submitRename = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await departmentApi.rename(editingDept.id, form)
      setEditingDept(null)
      setForm({ name: '', slug: '' })
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to rename department')
    }
  }

  const handleDelete = async (dept) => {
    if (!window.confirm(`Delete department "${dept.name}"?`)) return
    try {
      await departmentApi.remove(dept.id)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete department')
    }
  }

  if (loading) return <div style={{ padding: 28, color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Departments</h1>
        <button className="btn-primary" onClick={() => { setForm({ name: '', slug: '' }); setShowCreate(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> New Department
        </button>
      </div>

      {error && <div style={{ color: 'var(--error)', fontSize: 13, marginBottom: 16 }}>{error}</div>}

      <div className="card" style={{ overflow: 'hidden', marginBottom: 28 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['Name', 'Slug', 'Employees', 'Users with access', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {departments.map(d => (
              <tr key={d.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 500 }}>{d.name}</td>
                <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}><code>{d.slug}</code></td>
                <td style={{ padding: '12px 14px' }}>{d.employee_count}</td>
                <td style={{ padding: '12px 14px' }}>{d.user_count}</td>
                <td style={{ padding: '12px 14px', display: 'flex', gap: 8 }}>
                  <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => { setForm({ name: d.name, slug: d.slug }); setEditingDept(d) }}>
                    <Pencil size={12} /> Rename
                  </button>
                  <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => handleDelete(d)}>
                    <Trash2 size={12} /> Delete
                  </button>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No departments yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>User Access</h2>
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['User', 'Role', 'Department Access', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 500 }}>{u.full_name}</td>
                <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{u.role}</td>
                <td style={{ padding: '12px 14px' }}>
                  {u.role === 'superadmin'
                    ? <em style={{ color: 'var(--text-muted)' }}>All departments (superadmin)</em>
                    : (u.departments.map(d => d.name).join(', ') || <em style={{ color: 'var(--text-muted)' }}>None assigned</em>)}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {u.role !== 'superadmin' && (
                    <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }}
                      onClick={() => setAssigningUser(u)}>
                      Edit access
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(showCreate || editingDept) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ padding: 24, width: 380 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>{editingDept ? 'Rename Department' : 'New Department'}</h2>
              <button onClick={() => { setShowCreate(false); setEditingDept(null) }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={editingDept ? submitRename : submitCreate}>
              <div style={{ marginBottom: 12 }}>
                <label>Name</label>
                <input value={form.name}
                  onChange={e => setForm({ name: e.target.value, slug: slugify(e.target.value) })}
                  required placeholder="e.g. Finance" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Slug</label>
                <input value={form.slug} onChange={e => setForm({ ...form, slug: slugify(e.target.value) })} required />
              </div>
              <button className="btn-primary" type="submit" style={{ width: '100%' }}>
                {editingDept ? 'Save Changes' : 'Create Department'}
              </button>
            </form>
          </div>
        </div>
      )}

      {assigningUser && (
        <AssignDepartmentsModal
          user={assigningUser}
          allDepartments={departments}
          onCancel={() => setAssigningUser(null)}
          onSave={async (departmentIds) => {
            try {
              await departmentApi.assign(assigningUser.id, departmentIds)
              setAssigningUser(null)
              load()
            } catch (err) {
              setError(err.response?.data?.detail || 'Failed to update access')
            }
          }}
        />
      )}
    </div>
  )
}

function AssignDepartmentsModal({ user, allDepartments, onCancel, onSave }) {
  const [selected, setSelected] = useState(new Set(user.departments.map(d => d.id)))

  const toggle = (id) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ padding: 24, width: 380 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Edit access for {user.full_name}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, maxHeight: 260, overflowY: 'auto' }}>
          {allDepartments.map(d => (
            <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggle(d.id)} />
              {d.name}
            </label>
          ))}
          {allDepartments.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No departments exist yet.</span>}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-outline" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave([...selected])}>Save</button>
        </div>
      </div>
    </div>
  )
}
