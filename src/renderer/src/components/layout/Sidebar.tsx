import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Server,
  Clock,
  Search,
  Settings,
  ChevronRight,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { useConnectionStore } from '@/stores/connection-store'
import { useConnections } from '@/hooks/use-connections'
import { connectToHost } from '@/components/terminal/TerminalView'

export function Sidebar() {
  const { sidebarOpen, sidebarWidth, setSettingsOpen } = useUIStore()
  const { openCreateForm, quickConnectValue, setQuickConnectValue } = useConnectionStore()
  const { data: connections = [] } = useConnections()

  const recentConnections = [...connections]
    .filter((c) => c.lastConnectedAt)
    .sort((a, b) => (b.lastConnectedAt || 0) - (a.lastConnectedAt || 0))
    .slice(0, 5)

  return (
    <AnimatePresence mode="wait">
      {sidebarOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: sidebarWidth, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="flex h-full flex-col border-r border-border bg-sidebar overflow-hidden no-select"
        >
          {/* Quick Connect */}
          <div className="p-3">
            <div className="relative">
              <Zap className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="user@host:port"
                value={quickConnectValue}
                onChange={(e) => setQuickConnectValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && quickConnectValue.trim()) {
                    // TODO: Quick connect logic
                  }
                }}
                className="w-full rounded-lg border border-border bg-background/50 py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Connections Header */}
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Connections
            </span>
            <button
              onClick={() => openCreateForm()}
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title="New connection"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Connection List */}
          <div className="flex-1 overflow-y-auto px-1.5">
            {connections.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <Server className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-xs text-muted-foreground">No connections yet</p>
                <button
                  onClick={() => openCreateForm()}
                  className="mt-2 text-xs text-sidebar-primary hover:underline"
                >
                  Add your first connection
                </button>
              </div>
            ) : (
              <div className="space-y-0.5">
                {connections.map((conn) => (
                  <ConnectionItem key={conn.id} connection={conn} />
                ))}
              </div>
            )}

            {/* Recent Connections */}
            {recentConnections.length > 0 && (
              <>
                <div className="mt-4 flex items-center gap-1.5 px-2 py-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Recent
                  </span>
                </div>
                <div className="space-y-0.5">
                  {recentConnections.map((conn) => (
                    <ConnectionItem key={`recent-${conn.id}`} connection={conn} compact />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="border-t border-border p-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function ConnectionItem({
  connection,
  compact = false
}: {
  connection: { id: string; name: string; host: string; username: string; colorTag?: string }
  compact?: boolean
}) {
  const { setActiveConnectionId } = useConnectionStore()
  const { setActiveView } = useUIStore()

  const handleConnect = () => {
    setActiveConnectionId(connection.id)
    setActiveView('terminal')
    connectToHost(connection.id)
  }

  return (
    <button
      onClick={handleConnect}
      className={cn(
        'group flex w-full items-center gap-2 rounded-lg px-2.5 text-left transition-colors hover:bg-sidebar-accent',
        compact ? 'py-1.5' : 'py-2'
      )}
    >
      <div
        className={cn(
          'h-2 w-2 rounded-full flex-shrink-0',
          connection.colorTag || 'bg-emerald-500'
        )}
        style={connection.colorTag ? { backgroundColor: connection.colorTag } : undefined}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-sidebar-foreground">
          {connection.name}
        </div>
        {!compact && (
          <div className="truncate text-[11px] text-muted-foreground">
            {connection.username}@{connection.host}
          </div>
        )}
      </div>
      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  )
}
