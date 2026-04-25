import { create } from 'zustand'

export type ActiveView = 'terminal' | 'sftp'
export type AppTheme = 'dark' | 'light'

function getInitialTheme(): AppTheme {
  try {
    const saved = localStorage.getItem('lunar-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // localStorage may be unavailable
  }
  // Fall back to system preference
  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: light)').matches
  ) {
    return 'light'
  }
  return 'dark'
}

function applyTheme(theme: AppTheme): void {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  // Enable smooth theme transitions after initial load
  if (!root.classList.contains('theme-transition')) {
    requestAnimationFrame(() => root.classList.add('theme-transition'))
  }
  try {
    localStorage.setItem('lunar-theme', theme)
  } catch {
    // localStorage may be unavailable
  }
}

// Apply on load
const initialTheme = getInitialTheme()
applyTheme(initialTheme)

interface UIState {
  sidebarOpen: boolean
  sidebarWidth: number
  commandPaletteOpen: boolean
  theme: AppTheme
  activeView: ActiveView
  settingsOpen: boolean

  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarWidth: (width: number) => void
  toggleCommandPalette: () => void
  setCommandPaletteOpen: (open: boolean) => void
  setTheme: (theme: AppTheme) => void
  toggleTheme: () => void
  setActiveView: (view: ActiveView) => void
  setSettingsOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  sidebarWidth: 260,
  commandPaletteOpen: false,
  theme: initialTheme,
  activeView: 'terminal',
  settingsOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setTheme: (theme) => {
    applyTheme(theme)
    window.api.settings.set('theme', JSON.stringify(theme))
    set({ theme })
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    window.api.settings.set('theme', JSON.stringify(next))
    set({ theme: next })
  },
  setActiveView: (view) => set({ activeView: view }),
  setSettingsOpen: (open) => set({ settingsOpen: open })
}))
