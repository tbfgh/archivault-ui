import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { isApiConfigured } from './utils/apiConfig'

import SetupPage from './pages/SetupPage'
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
import DepartmentsPage from './pages/admin/DepartmentsPage'
import BatchesPage from './pages/admin/BatchesPage'
import BackupPage from './pages/admin/BackupPage'
import AccountPage from './pages/AccountPage'

import PortalLayout from './pages/portal/PortalLayout'
import PortalDashboard from './pages/portal/PortalDashboard'
import PortalBrowse from './pages/portal/PortalBrowse'
import PortalRequests from './pages/portal/PortalRequests'

function RequireApiConfig({ children }) {
  if (!isApiConfigured()) return <Navigate to="/setup" replace />
  return children
}

function RequireAuth({ children, adminOnly = false, superadminOnly = false }) {
  const { isAuthenticated, role } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (adminOnly && role === 'employee') return <Navigate to="/portal" replace />
  if (superadminOnly && role !== 'superadmin') return <Navigate to="/admin" replace />
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
        <Route path="/setup" element={<SetupPage />} />

        <Route path="/login" element={
          <RequireApiConfig>
            {isAuthenticated
              ? <Navigate to={role === 'employee' ? '/portal' : '/admin'} replace />
              : <LoginPage />}
          </RequireApiConfig>
        } />

        {/* Admin routes */}
        <Route path="/admin" element={<RequireApiConfig><RequireAuth adminOnly><AdminLayout /></RequireAuth></RequireApiConfig>}>
          <Route index element={<Dashboard />} />
          <Route path="drives" element={<DrivesPage />} />
          <Route path="drives/:id" element={<DriveDetail />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="employees/:id" element={<EmployeeDetail />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="tokens" element={<TokensPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="departments" element={<RequireAuth superadminOnly><DepartmentsPage /></RequireAuth>} />
          <Route path="batches" element={<RequireAuth superadminOnly><BatchesPage /></RequireAuth>} />
          <Route path="backup" element={<RequireAuth superadminOnly><BackupPage /></RequireAuth>} />
        </Route>

        {/* Employee portal routes */}
        <Route path="/portal" element={<RequireApiConfig><RequireEmployee><PortalLayout /></RequireEmployee></RequireApiConfig>}>
          <Route index element={<PortalDashboard />} />
          <Route path="browse" element={<PortalBrowse />} />
          <Route path="requests" element={<PortalRequests />} />
          <Route path="account" element={<AccountPage />} />
        </Route>

        <Route path="/" element={
          !isApiConfigured()
            ? <Navigate to="/setup" replace />
            : isAuthenticated
              ? <Navigate to={role === 'employee' ? '/portal' : '/admin'} replace />
              : <Navigate to="/login" replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
