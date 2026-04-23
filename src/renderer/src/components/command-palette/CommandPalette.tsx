import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Terminal,
  FolderOpen,
  Plus,
  Settings,
  Moon,
  Sun,
  PanelLeft,
  Palette,
  Server,
  Wifi
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { useTerminalStore } from '@/stores/terminal-store'
import { useConnectionStore } from '@/stores/connection-store'
import { useConnections } from '@/hooks/use-connections'
import { connectToHost } from '@/components/terminal/TerminalView'

interface Command {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  category: string
  action: () => void
  keywords?: string[]
}

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, setActiveView, toggleSidebar, theme, setTheme, setSettingsOpen } =
    useUIStore()
  const { setTerminalTheme } = useTerminalStore()
  const { openCreateForm } = useConnectionStore()
  const { data: connections = [] } = useConnections()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('')
    }
  }, [commandPaletteOpen])

  const commands: Command[] = useMemo(() => {
    const cmds: Command[] = [
      {
        id: 'new-connection',
        label: 'New Connection',
        description: 'Create a new SSH connection',
        icon: <Plus className="h-4 w-4" />,
        category: 'Connections',
        action: () => openCreateForm(),
        keywords: ['add', 'create', 'ssh']
      },
      {
        id: 'view-terminal',
        label: 'Switch to Terminal',
        icon: <Terminal className="h-4 w-4" />,
        category: 'Views',
        action: () => setActiveView('terminal'),
        keywords: ['tab', 'view']
      },
      {
        id: 'view-sftp',
        label: 'Switch to SFTP',
        icon: <FolderOpen className="h-4 w-4" />,
        category: 'Views',
        action: () => setActiveView('sftp'),
        keywords: ['files', 'browse', 'view']
      },
      {
        id: 'toggle-sidebar',
        label: 'Toggle Sidebar',
        icon: <PanelLeft className="h-4 w-4" />,
        category: 'Interface',
        action: toggleSidebar,
        keywords: ['panel', 'hide', 'show']
      },
      {
        id: 'toggle-theme',
        label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        icon: theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
        category: 'Interface',
        action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
        keywords: ['theme', 'dark', 'light', 'mode']
      },
      {
        id: 'theme-dracula',
        label: 'Terminal Theme: Dracula',
        icon: <Palette className="h-4 w-4" />,
        category: 'Terminal',
        action: () => setTerminalTheme('dracula'),
        keywords: ['theme', 'color']
      },
      {
        id: 'theme-nord',
        label: 'Terminal Theme: Nord',
        icon: <Palette className="h-4 w-4" />,
        category: 'Terminal',
        action: () => setTerminalTheme('nord'),
        keywords: ['theme', 'color']
      },
      {
        id: 'theme-tokyo-night',
        label: 'Terminal Theme: Tokyo Night',
        icon: <Palette className="h-4 w-4" />,
        category: 'Terminal',
        action: () => setTerminalTheme('tokyo-night'),
        keywords: ['theme', 'color']
      },
      {
        id: 'settings',
        label: 'Open Settings',
        icon: <Settings className="h-4 w-4" />,
        category: 'Interface',
        action: () => setSettingsOpen(true),
        keywords: ['preferences', 'config']
      }
    ]

    // Add saved connections as commands
    for (const conn of connections) {
      cmds.push({
        id: `connect-${conn.id}`,
        label: `Connect: ${conn.name}`,
        description: `${conn.username}@${conn.host}:${conn.port}`,
        icon: <Server className="h-4 w-4" />,
        category: 'Connections',
        action: () => {
          setActiveView('terminal')
          connectToHost(conn.id)
        },
        keywords: ['ssh', conn.host, conn.username]
      })
    }

    return cmds
  }, [connections, theme, openCreateForm, setActiveView, toggleSidebar, setTheme, setSettingsOpen, setTerminalTheme])

  const filtered = useMemo(() => {
    if (!query.trim()) return commands

    const q = query.toLowerCase()
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.description?.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q) ||
        cmd.keywords?.some((k) => k.includes(q))
    )
  }, [commands, query])

  const grouped = useMemo(() => {
    const groups = new Map<string, Command[]>()
    for (const cmd of filtered) {
      const list = groups.get(cmd.category) || []
      list.push(cmd)
      groups.set(cmd.category, list)
    }
    return groups
  }, [filtered])

  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action()
        setCommandPaletteOpen(false)
      }
    } else if (e.key === 'Escape') {
      setCommandPaletteOpen(false)
    }
  }

  let flatIndex = 0

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setCommandPaletteOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2"
          >
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
              {/* Search input */}
              <div className="flex items-center border-b border-border px-3">
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Type a command..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 border-none bg-transparent py-3 pl-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  autoFocus
                />
              </div>

              {/* Results */}
              <div className="max-h-[300px] overflow-y-auto p-1">
                {filtered.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No commands found
                  </div>
                ) : (
                  Array.from(grouped.entries()).map(([category, cmds]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground">
                        {category}
                      </div>
                      {cmds.map((cmd) => {
                        const index = flatIndex++
                        return (
                          <button
                            key={cmd.id}
                            onClick={() => {
                              cmd.action()
                              setCommandPaletteOpen(false)
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors',
                              index === selectedIndex
                                ? 'bg-accent text-foreground'
                                : 'text-muted-foreground hover:bg-accent/50'
                            )}
                          >
                            <div className="flex-shrink-0 text-muted-foreground">{cmd.icon}</div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm">{cmd.label}</div>
                              {cmd.description && (
                                <div className="truncate text-xs text-muted-foreground">
                                  {cmd.description}
                                </div>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>
                    <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                      ↑↓
                    </kbd>{' '}
                    navigate
                  </span>
                  <span>
                    <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                      ↵
                    </kbd>{' '}
                    select
                  </span>
                  <span>
                    <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                      esc
                    </kbd>{' '}
                    close
                  </span>
                </div>
                <span>{filtered.length} commands</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
