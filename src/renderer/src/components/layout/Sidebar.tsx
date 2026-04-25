import { useMemo, memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Server,
  Clock,
  Settings,
  ChevronRight,
  ChevronDown,
  Loader2,
  Pencil,
  Trash2,
  Terminal,
  FolderClosed
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useUIStore } from '@/stores/ui-store'
import { useConnectionStore } from '@/stores/connection-store'
import { useTerminalStore } from '@/stores/terminal-store'
import { useConnections, useDeleteConnection } from '@/hooks/use-connections'
import { connectToHost } from '@/lib/ssh'
import { ContextMenu, type ContextMenuItem } from '@/components/common/ContextMenu'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

export function Sidebar() {
  const { sidebarOpen, sidebarWidth, setSettingsOpen } = useUIStore()
  const { openCreateForm } = useConnectionStore()
  const { data: connections, isLoading } = useConnections()
  const connectionList = useMemo(() => connections ?? [], [connections])

  const recentConnections = useMemo(
    () =>
      [...connectionList]
        .filter((c) => c.lastConnectedAt)
        .sort((a, b) => (b.lastConnectedAt || 0) - (a.lastConnectedAt || 0))
        .slice(0, 5),
    [connectionList]
  )

  const groupedConnections = useMemo(() => {
    const groups = new Map<string, typeof connectionList>()
    for (const conn of connectionList) {
      const folder = conn.folder || 'default'
      const list = groups.get(folder) ?? []
      list.push(conn)
      groups.set(folder, list)
    }
    return groups
  }, [connectionList])

  const hasNonDefaultFolders = useMemo(
    () => Array.from(groupedConnections.keys()).some((k) => k !== 'default'),
    [groupedConnections]
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
            ) : !hasNonDefaultFolders ? (
              <div className="space-y-0.5">
                {connectionList.map((conn) => (
                  <ConnectionItem key={conn.id} connection={conn} />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {Array.from(groupedConnections.entries()).map(([folder, conns]) => (
                  <FolderGroup key={folder} name={folder} connections={conns} />
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

function FolderGroup({
  name,
  connections
}: {
  name: string
  connections: {
    id: string
    name: string
    host: string
    username: string
    colorTag?: string
    folder: string
  }[]
}) {
  const [open, setOpen] = useState(true)
  const isDefault = name === 'default'

  if (isDefault) {
    return (
      <div className="space-y-0.5">
        {connections.map((conn) => (
          <ConnectionItem key={conn.id} connection={conn} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground/70 hover:text-muted-foreground hover:bg-sidebar-accent/40 cursor-pointer"
      >
        <ChevronDown
          className={cn('h-3 w-3 transition-transform duration-150', !open && '-rotate-90')}
        />
        <FolderClosed className="h-3 w-3" />
        <span className="truncate">{name}</span>
        <span className="ml-auto text-[10px] text-muted-foreground/50">{connections.length}</span>
      </button>
      {open && (
        <div className="ml-2 space-y-0.5 border-l border-border/40 pl-1">
          {connections.map((conn) => (
            <ConnectionItem key={conn.id} connection={conn} />
          ))}
        </div>
      )}
    </div>
  )
}

const ConnectionItem = memo(function ConnectionItem({
  connection,
  compact = false
}: {
  connection: { id: string; name: string; host: string; username: string; colorTag?: string }
  compact?: boolean
}) {
  const { activeConnectionId, setActiveConnectionId, openEditForm } = useConnectionStore()
  const { setActiveView } = useUIStore()
  const { sessions } = useTerminalStore()
  const deleteMutation = useDeleteConnection()
  const [confirmDelete, setConfirmDelete] = useState(false)
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

    // If already connected, switch to the existing tab instead of opening a new one
    const existingSession = Array.from(sessions.values()).find(
      (s) =>
        s.connectionId === connection.id &&
        (s.status === 'connected' || s.status === 'connecting' || s.status === 'reconnecting')
    )
    if (existingSession) {
      useTerminalStore.getState().setActiveTab(existingSession.id)
      return
    }

    connectToHost(connection.id)
  }

  const contextMenuItems: ContextMenuItem[] = [
    {
      label: 'Connect',
      icon: <Terminal className="h-3.5 w-3.5" />,
      onClick: handleConnect
    },
    {
      label: 'Edit',
      icon: <Pencil className="h-3.5 w-3.5" />,
      onClick: () => openEditForm(connection.id)
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: () => setConfirmDelete(true),
      destructive: true,
      separator: true
    }
  ]

  return (
    <>
      <ContextMenu items={contextMenuItems}>
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
      </ContextMenu>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete connection?"
        message={`"${connection.name}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          deleteMutation.mutate(connection.id, {
            onSuccess: () => toast.success('Connection deleted'),
            onError: () => toast.error('Failed to delete connection')
          })
          setConfirmDelete(false)
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
})
