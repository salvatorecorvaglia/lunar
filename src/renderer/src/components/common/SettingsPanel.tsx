import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'
import { X, Monitor, Terminal, Upload, Wifi, Moon, Sun, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { useTerminalStore } from '@/stores/terminal-store'
import type { TerminalThemeName } from '@shared/types/terminal'
import { DEFAULT_SETTINGS } from '@shared/types/settings'

const TERMINAL_THEMES: {
  value: TerminalThemeName
  label: string
  bg: string
  fg: string
  accent: string
}[] = [
  { value: 'dracula', label: 'Dracula', bg: '#282a36', fg: '#f8f8f2', accent: '#bd93f9' },
  { value: 'nord', label: 'Nord', bg: '#2e3440', fg: '#d8dee9', accent: '#88c0d0' },
  { value: 'tokyo-night', label: 'Tokyo Night', bg: '#1a1b26', fg: '#a9b1d6', accent: '#7aa2f7' }
]

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

const panelVariants = {
  initial: { opacity: 0, x: '100%' },
  animate: { opacity: 1, x: 0, transition: { type: 'spring', damping: 28, stiffness: 320 } },
  exit: { opacity: 0, x: '100%', transition: { duration: 0.2 } }
}

export function SettingsPanel() {
  const { settingsOpen, setSettingsOpen, theme, setTheme } = useUIStore()
  const { terminalTheme, setTerminalTheme, fontSize, setFontSize, scrollback, setScrollback } = useTerminalStore()
  const [concurrency, setConcurrency] = useState(DEFAULT_SETTINGS['transfer.concurrency'])
  const [autoReconnect, setAutoReconnect] = useState(DEFAULT_SETTINGS['ssh.autoReconnect'])
  const [appVersion, setAppVersion] = useState('0.0.0')

  // Load settings from DB on open
  useEffect(() => {
    if (!settingsOpen) return
    window.api.app.getVersion().then(setAppVersion)
    window.api.settings.getAll().then((settings: Record<string, unknown>) => {
      if (settings['terminal.fontSize'] != null) setFontSize(Number(settings['terminal.fontSize']))
      if (settings['terminal.scrollback'] != null)
        setScrollback(Number(settings['terminal.scrollback']))
      if (settings['transfer.concurrency'] != null)
        setConcurrency(Number(settings['transfer.concurrency']))
      if (settings['ssh.autoReconnect'] != null)
        setAutoReconnect(Boolean(settings['ssh.autoReconnect']))
    })
  }, [settingsOpen, setFontSize, setScrollback])

  const persistSetting = useCallback((key: string, value: unknown) => {
    window.api.settings.set(key, JSON.stringify(value))
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!settingsOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [settingsOpen, setSettingsOpen])

  return (
    <AnimatePresence>
      {settingsOpen && (
        <>
          <motion.div
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setSettingsOpen(false)}
          />
          <motion.div
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border/60 bg-card shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">Settings</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="btn-icon"
                aria-label="Close settings"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Appearance */}
              <Section title="Appearance" icon={<Monitor className="h-4 w-4" />}>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2.5 block">
                    App Theme
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <ThemeCard
                      active={theme === 'dark'}
                      onClick={() => setTheme('dark')}
                      icon={<Moon className="h-4 w-4" />}
                      label="Dark"
                      preview={
                        <div className="rounded-md bg-[hsl(240,10%,3.9%)] border border-white/10 p-2">
                          <div className="h-1.5 w-10 rounded-full bg-white/60" />
                          <div className="mt-1 h-1.5 w-7 rounded-full bg-white/30" />
                        </div>
                      }
                    />
                    <ThemeCard
                      active={theme === 'light'}
                      onClick={() => setTheme('light')}
                      icon={<Sun className="h-4 w-4" />}
                      label="Light"
                      preview={
                        <div className="rounded-md bg-white border border-black/10 p-2">
                          <div className="h-1.5 w-10 rounded-full bg-black/60" />
                          <div className="mt-1 h-1.5 w-7 rounded-full bg-black/20" />
                        </div>
                      }
                    />
                  </div>
                </div>
              </Section>

              {/* Terminal */}
              <Section title="Terminal" icon={<Terminal className="h-4 w-4" />}>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2.5 block">
                    Color Theme
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {TERMINAL_THEMES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setTerminalTheme(t.value)}
                        className={cn(
                          'group flex flex-col items-center gap-2 rounded-lg border p-3 cursor-pointer',
                          terminalTheme === t.value
                            ? 'border-ring bg-accent shadow-xs'
                            : 'border-border hover:border-border hover:bg-accent/40'
                        )}
                      >
                        {/* Mini terminal preview */}
                        <div
                          className="w-full rounded-md p-2 font-mono text-[8px] leading-tight"
                          style={{ backgroundColor: t.bg, color: t.fg }}
                        >
                          <span style={{ color: t.accent }}>$</span> ls -la
                          <br />
                          <span className="opacity-60">drwxr-xr-x</span>
                        </div>
                        <span className="text-[11px] font-medium">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <SettingRow label="Font" value="JetBrains Mono" />
                <EditableNumberRow
                  label="Font Size"
                  value={fontSize}
                  min={10}
                  max={24}
                  suffix="px"
                  onChange={(v) => {
                    setFontSize(v)
                    persistSetting('terminal.fontSize', v)
                  }}
                />
                <EditableNumberRow
                  label="Scrollback"
                  value={scrollback}
                  min={1000}
                  max={100000}
                  step={1000}
                  suffix=" lines"
                  onChange={(v) => {
                    setScrollback(v)
                    persistSetting('terminal.scrollback', v)
                  }}
                />
              </Section>

              {/* SSH */}
              <Section title="SSH" icon={<Wifi className="h-4 w-4" />}>
                <ToggleRow
                  label="Auto-reconnect"
                  enabled={autoReconnect}
                  onToggle={(v) => {
                    setAutoReconnect(v)
                    persistSetting('ssh.autoReconnect', v)
                  }}
                />
                <SettingRow label="Keep-alive interval" value="10s" />
                <SettingRow label="Max reconnect attempts" value="5" />
              </Section>

              {/* Transfers */}
              <Section title="Transfers" icon={<Upload className="h-4 w-4" />}>
                <EditableNumberRow
                  label="Concurrent transfers"
                  value={concurrency}
                  min={1}
                  max={10}
                  onChange={(v) => {
                    setConcurrency(v)
                    persistSetting('transfer.concurrency', v)
                  }}
                />
              </Section>

              {/* About */}
              <Section title="About" icon={<Info className="h-4 w-4" />}>
                <div className="rounded-lg border border-border/60 bg-background/50 p-4 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
                    <Terminal className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Lunar</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    SSH Terminal & SFTP File Manager
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground/60">v{appVersion}</p>
                </div>
              </Section>
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
      <div className="flex items-center gap-2 mb-3.5">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="space-y-3 pl-6">{children}</div>
    </div>
  )
}

function ThemeCard({
  active,
  onClick,
  icon,
  label,
  preview
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  preview: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2.5 rounded-lg border p-3 cursor-pointer',
        active
          ? 'border-ring bg-accent shadow-xs'
          : 'border-border text-muted-foreground hover:border-border hover:bg-accent/40'
      )}
    >
      {preview}
      <div className="flex items-center gap-1.5 text-sm font-medium">
        {icon}
        {label}
      </div>
    </button>
  )
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
  )
}

function ToggleRow({
  label,
  enabled,
  onToggle
}: {
  label: string
  enabled: boolean
  onToggle?: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onToggle?.(!enabled)}
        className={cn(
          'flex h-5 w-9 items-center rounded-full px-0.5 cursor-pointer transition-colors',
          enabled ? 'bg-emerald-500' : 'bg-muted'
        )}
      >
        <div
          className={cn(
            'h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
            enabled ? 'translate-x-[14px]' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  )
}

function EditableNumberRow({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  onChange
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10)
            if (!isNaN(v) && v >= min && v <= max) onChange(v)
          }}
          className="w-16 rounded border border-border bg-background px-2 py-0.5 text-right text-xs font-medium text-foreground outline-none focus:border-ring"
        />
        {suffix && <span className="text-[11px] text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  )
}
