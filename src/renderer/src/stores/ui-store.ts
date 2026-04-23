import { create } from 'zustand'

export type ActiveView = 'terminal' | 'sftp'
export type AppTheme = 'dark' | 'light'

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
  setActiveView: (view: ActiveView) => void
  setSettingsOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarWidth: 260,
  commandPaletteOpen: false,
  theme: 'dark',
  activeView: 'terminal',
  settingsOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setTheme: (theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },
  setActiveView: (view) => set({ activeView: view }),
  setSettingsOpen: (open) => set({ settingsOpen: open })
}))
