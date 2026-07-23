import { create } from 'zustand'

const storedRole = localStorage.getItem('role') || null
const storedName = localStorage.getItem('full_name') || null

export const useAuthStore = create((set) => ({
  // Rehydrated from localStorage so full_name/role survive a page refresh —
  // previously `user` stayed null until the next login() call, which broke
  // any component reading user?.role or user?.full_name after a hard reload.
  user: storedRole ? { role: storedRole, full_name: storedName } : null,
  role: storedRole,
  isAuthenticated: !!localStorage.getItem('access_token'),

  login: (data) => {
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    localStorage.setItem('role', data.role)
    localStorage.setItem('full_name', data.full_name)
    set({
      isAuthenticated: true,
      role: data.role,
      user: { full_name: data.full_name, role: data.role }
    })
  },

  logout: () => {
    localStorage.clear()
    set({ isAuthenticated: false, role: null, user: null })
  },

  setUser: (user) => set({ user, role: user.role })
}))
