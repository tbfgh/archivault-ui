import axios from 'axios'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api/v1`,
  headers: { 'Content-Type': 'application/json' }
})

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 — redirect to login
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const r = await axios.post(
            `${import.meta.env.VITE_API_URL || ''}/api/v1/auth/refresh`,
            { refresh_token: refresh }
          )
          localStorage.setItem('access_token', r.data.access_token)
          localStorage.setItem('refresh_token', r.data.refresh_token)
          original.headers.Authorization = `Bearer ${r.data.access_token}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      } else {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  refresh: (refresh_token) => api.post('/auth/refresh', { refresh_token }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

// ── Admin ─────────────────────────────────────────────────────
export const adminApi = {
  stats: () => api.get('/admin/stats'),
  users: () => api.get('/admin/users'),
  createUser: (d) => api.post('/admin/users', d),
  updateUser: (id, d) => api.patch(`/admin/users/${id}`, d),
}

// ── Employees ─────────────────────────────────────────────────
export const employeeApi = {
  list: (params) => api.get('/employees', { params }),
  get: (id) => api.get(`/employees/${id}`),
  create: (d) => api.post('/employees', d),
  update: (id, d) => api.patch(`/employees/${id}`, d),
  drives: (id) => api.get(`/employees/${id}/drives`),
  files: (id, params) => api.get(`/employees/${id}/files`, { params }),
}

// ── Drives ────────────────────────────────────────────────────
export const driveApi = {
  list: (params) => api.get('/drives', { params }),
  get: (id) => api.get(`/drives/${id}`),
  create: (d) => api.post('/drives', d),
  update: (id, d) => api.patch(`/drives/${id}`, d),
  employees: (id) => api.get(`/drives/${id}/employees`),
}

// ── Files ─────────────────────────────────────────────────────
export const fileApi = {
  search: (params) => api.get('/files', { params }),
  get: (id) => api.get(`/files/${id}`),
  estimate: (fileIds) => api.get('/files/retrieval-estimate', { params: { file_ids: fileIds.join(',') } }),
}

// ── Requests ──────────────────────────────────────────────────
export const requestApi = {
  list: () => api.get('/requests'),
  create: (d) => api.post('/requests', d),
  get: (id) => api.get(`/requests/${id}`),
  updateStatus: (id, d) => api.patch(`/requests/${id}/status`, d),
}

// ── Indexer Tokens ────────────────────────────────────────────
export const indexerApi = {
  tokens: () => api.get('/indexer/tokens'),
  createToken: (d) => api.post('/indexer/token', d),
  revokeToken: (id) => api.delete(`/indexer/token/${id}`),
}
