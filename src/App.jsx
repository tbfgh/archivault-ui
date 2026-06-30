import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

import LoginPage from './pages/LoginPage'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import DrivesPage from './pages/admin/DrivesPage'
import DriveDetail from './pages/admin/DriveDetail'
import EmployeesPage from './pages/admin/EmployeesPage'
import EmployeeDetail from './pages/admin/EmployeeDetail'
import FilesPage from './pages/admin/FilesPage'
import RequestsPage from './pages/admin/RequestsPage'
import UsersPage from './pages/admin/UsersPage'
import TokensPage from './pages/admin/TokensPage'

import PortalLayout from './pages/portal/PortalLayout'
import PortalDashboard from './pages/portal/PortalDashboard'
import PortalBrowse from './pages/portal/PortalBrowse'
import PortalRequests from './pages/portal/PortalRequests'

function RequireAuth({ children, adminOnly = false }) {
  const { isAuthenticated, role } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (adminOnly && role === 'employee') return <Navigate to="/portal" replace />
  return children
}

function RequireEmployee({ children }) {
  const { isAuthenticated, role } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role !== 'employee') return <Navigate to="/admin" replace />
  return children
}

export default function App() {
  const { isAuthenticated, role } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          isAuthenticated
            ? <Navigate to={role === 'employee' ? '/portal' : '/admin'} replace />
            : <LoginPage />
        } />

        {/* Admin routes */}
        <Route path="/admin" element={<RequireAuth adminOnly><AdminLayout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="drives" element={<DrivesPage />} />
          <Route path="drives/:id" element={<DriveDetail />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="employees/:id" element={<EmployeeDetail />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="tokens" element={<TokensPage />} />
        </Route>

        {/* Employee portal routes */}
        <Route path="/portal" element={<RequireEmployee><PortalLayout /></RequireEmployee>}>
          <Route index element={<PortalDashboard />} />
          <Route path="browse" element={<PortalBrowse />} />
          <Route path="requests" element={<PortalRequests />} />
        </Route>

        <Route path="/" element={
          isAuthenticated
            ? <Navigate to={role === 'employee' ? '/portal' : '/admin'} replace />
            : <Navigate to="/login" replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
