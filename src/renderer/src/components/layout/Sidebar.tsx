import { useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Server, Clock, Settings, ChevronRight, Zap, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { useConnectionStore } from '@/stores/connection-store'
import { useTerminalStore } from '@/stores/terminal-store'
import { useConnections } from '@/hooks/use-connections'
import { connectToHost } from '@/components/terminal/TerminalView'

export function Sidebar() {
  const { sidebarOpen, sidebarWidth, setSettingsOpen } = useUIStore()
  const { openCreateForm, quickConnectValue, setQuickConnectValue } = useConnectionStore()
  const { data: connections, isLoading } = useConnections()
  const connectionList = connections ?? []

  const recentConnections = useMemo(
    () =>
      [...connectionList]
        .filter((c) => c.lastConnectedAt)
        .sort((a, b) => (b.lastConnectedAt || 0) - (a.lastConnectedAt || 0))
        .slice(0, 5),
    [connectionList]
  )

  return (
    <AnimatePresence mode="wait">
      {sidebarOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: sidebarWidth, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="flex h-full flex-col border-r border-border/60 bg-sidebar overflow-hidden no-select"
          style={{ willChange: 'width' }}
        >
          {/* Quick Connect */}
          <div className="p-3 pb-2">
            <div className="relative">
              <Zap className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
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
                className="form-input pl-8 !py-[7px] !text-xs !bg-background/40"
              />
            </div>
          </div>

          {/* Connections Header */}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Connections
            </span>
            <button
              onClick={() => openCreateForm()}
              className="btn-icon !p-1"
              title="New connection"
              aria-label="New connection"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Connection List */}
          <div className="flex-1 overflow-y-auto px-1.5 pb-2">
            {isLoading ? (
              <div className="space-y-2 px-2 py-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="skeleton h-2.5 w-2.5 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-3 w-3/4" />
                      <div className="skeleton h-2.5 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : connectionList.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <Server className="mx-auto h-8 w-8 text-muted-foreground/30" />
                <p className="mt-3 text-xs font-medium text-muted-foreground/70">
                  No connections yet
                </p>
                <button
                  onClick={() => openCreateForm()}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-sidebar-primary hover:underline"
                >
                  <Plus className="h-3 w-3" />
                  Add your first connection
                </button>
              </div>
            ) : (
              <div className="space-y-0.5">
                {connectionList.map((conn) => (
                  <ConnectionItem key={conn.id} connection={conn} />
                ))}
              </div>
            )}

            {/* Recent Connections */}
            {recentConnections.length > 0 && (
              <>
                <div className="mx-2 my-3 h-px bg-border/50" />
                <div className="flex items-center gap-1.5 px-2.5 pb-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground/60" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
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

          {/* Settings */}
          <div className="border-t border-border/60 p-1.5">
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
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

const ConnectionItem = memo(function ConnectionItem({
  connection,
  compact = false
}: {
  connection: { id: string; name: string; host: string; username: string; colorTag?: string }
  compact?: boolean
}) {
  const { activeConnectionId, setActiveConnectionId } = useConnectionStore()
  const { setActiveView } = useUIStore()
  const { sessions } = useTerminalStore()
  const isActive = activeConnectionId === connection.id
  const isConnected = Array.from(sessions.values()).some(
    (s) => s.connectionId === connection.id && s.status === 'connected'
  )
  const isConnecting = Array.from(sessions.values()).some(
    (s) =>
      s.connectionId === connection.id && (s.status === 'connecting' || s.status === 'reconnecting')
  )

  const handleConnect = () => {
    setActiveConnectionId(connection.id)
    setActiveView('terminal')
    connectToHost(connection.id)
  }

  return (
    <button
      onClick={handleConnect}
      className={cn(
        'group flex w-full items-center gap-2.5 rounded-lg px-2.5 text-left',
        compact ? 'py-[7px]' : 'py-2',
        isActive
          ? 'bg-sidebar-accent border-l-[3px] border-l-sidebar-primary pl-[7px]'
          : 'hover:bg-sidebar-accent/60'
      )}
    >
      {/* Status dot */}
      <div className="relative flex-shrink-0">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: connection.colorTag || '#22c55e' }}
        />
        {isConnected && (
          <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-[1.5px] border-sidebar bg-emerald-500 animate-pulse-dot" />
        )}
        {isConnecting && (
          <Loader2 className="absolute -right-1 -top-1 h-3 w-3 text-amber-500 animate-spin" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-sidebar-foreground">
          {connection.name}
        </div>
        {!compact && (
          <div className="truncate text-[11px] text-muted-foreground/70">
            {connection.username}@{connection.host}
          </div>
        )}
      </div>

      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/70 flex-shrink-0 transition-colors" />
    </button>
  )
})
