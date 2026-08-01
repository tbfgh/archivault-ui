// AccountPage.jsx
// Shared self-service account page — used at both /admin/account and
// /portal/account so every role (superadmin, admin, employee) can secure
// their own account without needing another user to do it for them.
import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api'
import { KeyRound, UserCircle } from 'lucide-react'

const EMPTY_FORM = { current_password: '', new_password: '', confirm_password: '' }

export default function AccountPage() {
  const { user: storeUser } = useAuthStore()
  const [me, setMe] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    authApi.me().then(r => setMe(r.data)).catch(() => {})
  }, [])

  const displayName = me?.full_name || storeUser?.full_name
  const displayRole = me?.role || storeUser?.role

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.new_password.length < 8) {
      setError('New password must be at least 8 characters long.')
      return
    }
    if (form.new_password !== form.confirm_password) {
      setError('New password and confirmation do not match.')
      return
    }
    if (form.new_password === form.current_password) {
      setError('New password must be different from your current password.')
      return
    }

    setSaving(true)
    try {
      await authApi.changePassword(form.current_password, form.new_password)
      setSuccess('Password changed successfully.')
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: 28, maxWidth: 520 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <UserCircle size={20} />
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>My Account</h1>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Signed in as</div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{displayName}</div>
        {me?.email && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{me.email}</div>}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 6 }}>{displayRole}</div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <KeyRound size={16} /> Change Password
        </h2>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 12 }}>
            <label>Current Password *</label>
            <input
              type="password" autoComplete="current-password"
              value={form.current_password}
              onChange={e => setForm({ ...form, current_password: e.target.value })}
              required
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>New Password *</label>
            <input
              type="password" autoComplete="new-password"
              value={form.new_password}
              onChange={e => setForm({ ...form, new_password: e.target.value })}
              required minLength={8}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>At least 8 characters.</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Confirm New Password *</label>
            <input
              type="password" autoComplete="new-password"
              value={form.confirm_password}
              onChange={e => setForm({ ...form, confirm_password: e.target.value })}
              required minLength={8}
            />
          </div>
          {error && <div style={{ color: 'var(--error)', fontSize: 12, marginBottom: 12 }}>{error}</div>}
          {success && <div style={{ color: 'var(--success)', fontSize: 12, marginBottom: 12 }}>{success}</div>}
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
