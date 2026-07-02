import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api'
import { LayoutDashboard, FolderOpen, ClipboardList, LogOut } from 'lucide-react'

const navItems = [
  { to: '/portal', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/portal/browse', label: 'My Files', icon: FolderOpen },
  { to: '/portal/requests', label: 'My Requests', icon: ClipboardList },
]

export default function PortalLayout() {
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>ArchiveVault</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee Portal</span>

        <nav style={{ display: 'flex', gap: 4, marginLeft: 24 }}>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              borderRadius: 7, textDecoration: 'none', fontSize: 13,
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              background: isActive ? 'rgba(79,110,247,0.12)' : 'transparent',
              fontWeight: isActive ? 600 : 400
            })}>
              <Icon size={15} /> {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.full_name}</span>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>
      <Outlet />
    </div>
  )
}
