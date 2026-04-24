import { useEffect, useState, useMemo, useRef } from 'react'
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
  Server
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

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

const dialogVariants = {
  initial: { opacity: 0, y: -10, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  exit: { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.1 } }
}

export function CommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setActiveView,
    toggleSidebar,
    theme,
    setTheme,
    setSettingsOpen
  } = useUIStore()
  const { setTerminalTheme } = useTerminalStore()
  const { openCreateForm } = useConnectionStore()
  const { data: connections = [] } = useConnections()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('')
      setSelectedIndex(0)
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
  }, [
    connections,
    theme,
    openCreateForm,
    setActiveView,
    toggleSidebar,
    setTheme,
    setSettingsOpen,
    setTerminalTheme
  ])

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

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return
    const selected = listRef.current.querySelector('[data-selected="true"]')
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const executeCommand = (cmd: Command) => {
    cmd.action()
    setCommandPaletteOpen(false)
  }

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
        executeCommand(filtered[selectedIndex])
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
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setCommandPaletteOpen(false)}
          />
          <motion.div
            variants={dialogVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2"
          >
            <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-xl">
              {/* Search input */}
              <div className="flex items-center border-b border-border/60 px-3">
                <Search className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Type a command..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 border-none bg-transparent py-3 pl-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
                  autoFocus
                />
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[300px] overflow-y-auto p-1.5">
                {filtered.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground/60">
                    No commands found
                  </div>
                ) : (
                  Array.from(grouped.entries()).map(([category, cmds]) => (
                    <div key={category}>
                      <div className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                        {category}
                      </div>
                      {cmds.map((cmd) => {
                        const index = flatIndex++
                        const isSelected = index === selectedIndex
                        return (
                          <button
                            key={cmd.id}
                            data-selected={isSelected}
                            onClick={() => executeCommand(cmd)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm cursor-pointer',
                              isSelected ? 'bg-accent text-foreground' : 'text-muted-foreground'
                            )}
                          >
                            <div
                              className={cn(
                                'flex-shrink-0',
                                isSelected ? 'text-foreground' : 'text-muted-foreground/60'
                              )}
                            >
                              {cmd.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[13px]">{cmd.label}</div>
                              {cmd.description && (
                                <div className="truncate text-[11px] text-muted-foreground/60">
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
              <div className="flex items-center justify-between border-t border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground/50">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-border/60 bg-muted/50 px-1 py-px font-mono text-[10px]">
                      ↑↓
                    </kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-border/60 bg-muted/50 px-1 py-px font-mono text-[10px]">
                      ↵
                    </kbd>
                    select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-border/60 bg-muted/50 px-1 py-px font-mono text-[10px]">
                      esc
                    </kbd>
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
