import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  role: localStorage.getItem('role') || null,
  isAuthenticated: !!localStorage.getItem('access_token'),

  login: (data) => {
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    localStorage.setItem('role', data.role)
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
