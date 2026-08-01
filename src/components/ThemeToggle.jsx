import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'

export default function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useThemeStore()
  const isLight = theme === 'light'

  return (
    <button
      onClick={toggleTheme}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'none', border: '1px solid var(--border)',
        borderRadius: 8, cursor: 'pointer', color: 'var(--text-muted)',
        padding: compact ? 6 : '6px 10px', fontSize: 12,
        whiteSpace: 'nowrap', overflow: 'hidden'
      }}
    >
      {isLight ? <Moon size={15} /> : <Sun size={15} />}
      {!compact && (isLight ? 'Dark mode' : 'Light mode')}
    </button>
  )
}
