import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function applyTheme(tema) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = tema === 'Dark' || (tema === 'System' && prefersDark)
  document.documentElement.classList.toggle('dark', isDark)
}

export const useThemeStore = create(
  persist(
    (set, get) => ({
      tema: 'System',
      setTema: (tema) => {
        applyTheme(tema)
        set({ tema })
      },
      toggleTema: () => {
        const next = get().tema === 'Dark' ? 'Light' : 'Dark'
        applyTheme(next)
        set({ tema: next })
      },
      hydrate: () => applyTheme(get().tema),
    }),
    { name: 'nodus-theme' }
  )
)
