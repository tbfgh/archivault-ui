import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api'
import { LayoutDashboard, HardDrive, Users, FileSearch, ClipboardList, UserCog, Key, LogOut, Menu, X } from 'lucide-react'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/drives', label: 'Drives', icon: HardDrive },
  { to: '/admin/employees', label: 'Employees', icon: Users },
  { to: '/admin/files', label: 'File Search', icon: FileSearch },
  { to: '/admin/requests', label: 'Requests', icon: ClipboardList },
  { to: '/admin/users', label: 'Users', icon: UserCog },
  { to: '/admin/tokens', label: 'Indexer Tokens', icon: Key },
]

export default function AdminLayout() {
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/login')
  }

  const sidebarStyle = {
    width: sidebarOpen ? 220 : 64,
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    transition: 'width 0.2s ease',
    flexShrink: 0,
    overflow: 'hidden'
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div style={{ padding: '16px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setSidebarOpen(p => !p)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          {sidebarOpen && <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)', whiteSpace: 'nowrap' }}>ArchiveVault</span>}
        </div>

        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
              borderRadius: 8, marginBottom: 2, textDecoration: 'none',
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              background: isActive ? 'rgba(79,110,247,0.12)' : 'transparent',
              fontSize: 13, fontWeight: isActive ? 600 : 400,
              whiteSpace: 'nowrap', overflow: 'hidden',
              transition: 'all 0.15s'
            })}>
              <Icon size={17} style={{ flexShrink: 0 }} />
              {sidebarOpen && label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          {sidebarOpen && (
            <div style={{ padding: '8px 10px', marginBottom: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{user?.full_name}</div>
              <div style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.5px' }}>{user?.role}</div>
            </div>
          )}
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
            borderRadius: 8, width: '100%', background: 'none', border: 'none',
            color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13,
            whiteSpace: 'nowrap', overflow: 'hidden'
          }}>
            <LogOut size={17} style={{ flexShrink: 0 }} />
            {sidebarOpen && 'Sign Out'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        <Outlet />
      </main>
    </div>
  )
}
