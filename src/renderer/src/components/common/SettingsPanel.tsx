import { motion, AnimatePresence } from 'framer-motion'
import { X, Monitor, Terminal, Upload, Wifi, Palette, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { useTerminalStore } from '@/stores/terminal-store'
import type { TerminalThemeName } from '@shared/types/terminal'

const TERMINAL_THEMES: { value: TerminalThemeName; label: string; color: string }[] = [
  { value: 'dracula', label: 'Dracula', color: '#282a36' },
  { value: 'nord', label: 'Nord', color: '#2e3440' },
  { value: 'tokyo-night', label: 'Tokyo Night', color: '#1a1b26' }
]

export function SettingsPanel() {
  const { settingsOpen, setSettingsOpen, theme, setTheme } = useUIStore()
  const { terminalTheme, setTerminalTheme } = useTerminalStore()

  return (
    <AnimatePresence>
      {settingsOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setSettingsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">Settings</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-6">
              {/* Appearance */}
              <Section title="Appearance" icon={<Monitor className="h-4 w-4" />}>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    App Theme
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <ThemeButton
                      active={theme === 'dark'}
                      onClick={() => setTheme('dark')}
                      icon={<Moon className="h-4 w-4" />}
                      label="Dark"
                    />
                    <ThemeButton
                      active={theme === 'light'}
                      onClick={() => setTheme('light')}
                      icon={<Sun className="h-4 w-4" />}
                      label="Light"
                    />
                  </div>
                </div>
              </Section>

              {/* Terminal */}
              <Section title="Terminal" icon={<Terminal className="h-4 w-4" />}>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Color Theme
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {TERMINAL_THEMES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setTerminalTheme(t.value)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all',
                          terminalTheme === t.value
                            ? 'border-ring bg-accent'
                            : 'border-border hover:border-ring/50'
                        )}
                      >
                        <div
                          className="h-6 w-full rounded"
                          style={{ backgroundColor: t.color }}
                        />
                        <span className="text-[11px] font-medium">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Font Size
                  </label>
                  <p className="text-xs text-muted-foreground">14px (JetBrains Mono)</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Scrollback
                  </label>
                  <p className="text-xs text-muted-foreground">10,000 lines</p>
                </div>
              </Section>

              {/* SSH */}
              <Section title="SSH" icon={<Wifi className="h-4 w-4" />}>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Auto-reconnect</span>
                    <span className="text-foreground">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Keep-alive interval</span>
                    <span className="text-foreground">10s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Max reconnect attempts</span>
                    <span className="text-foreground">5</span>
                  </div>
                </div>
              </Section>

              {/* Transfers */}
              <Section title="Transfers" icon={<Upload className="h-4 w-4" />}>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Concurrent transfers</span>
                    <span className="text-foreground">3</span>
                  </div>
                </div>
              </Section>

              {/* About */}
              <div className="pt-4 border-t border-border text-center text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Lunar</p>
                <p className="mt-0.5">SSH Terminal & SFTP File Manager</p>
                <p className="mt-0.5">v1.0.0</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function Section({
  title,
  icon,
  children
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="space-y-3 pl-6">{children}</div>
    </div>
  )
}

function ThemeButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all',
        active
          ? 'border-ring bg-accent text-foreground'
          : 'border-border text-muted-foreground hover:border-ring/50'
      )}
    >
      {icon}
      {label}
    </button>
  )
}
