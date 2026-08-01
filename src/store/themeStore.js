import { create } from 'zustand'

const STORAGE_KEY = 'theme'

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

const storedTheme = localStorage.getItem(STORAGE_KEY) ||
  (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')

// Apply immediately on module load (before first paint) so there's no
// flash of the wrong theme while React mounts.
applyTheme(storedTheme)

export const useThemeStore = create((set, get) => ({
  theme: storedTheme,

  setTheme: (theme) => {
    localStorage.setItem(STORAGE_KEY, theme)
    applyTheme(theme)
    set({ theme })
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },
}))
