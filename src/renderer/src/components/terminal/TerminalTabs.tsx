import { Plus, X, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useTerminalStore, type TerminalSession } from '@/stores/terminal-store'

interface TerminalTabsProps {
  onNewTab: () => void
}

export function TerminalTabs({ onNewTab }: TerminalTabsProps) {
  const { sessions, tabOrder, activeTabId, setActiveTab, closeTab } = useTerminalStore()

  return (
    <div className="flex h-9 items-center border-b border-border bg-background/50 no-select">
      <div className="flex flex-1 items-center overflow-x-auto">
        {tabOrder.map((sessionId) => {
          const session = sessions.get(sessionId)
          if (!session) return null

          return (
            <Tab
              key={sessionId}
              session={session}
              isActive={sessionId === activeTabId}
              onActivate={() => setActiveTab(sessionId)}
              onClose={() => closeTab(sessionId)}
            />
          )
        })}
      </div>
      <button
        onClick={onNewTab}
        className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex-shrink-0"
        title="New tab"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function Tab({
  session,
  isActive,
  onActivate,
  onClose
}: {
  session: TerminalSession
  isActive: boolean
  onActivate: () => void
  onClose: () => void
}) {
  const statusIcon = () => {
    switch (session.status) {
      case 'connected':
        return <Wifi className="h-3 w-3 text-emerald-500" />
      case 'connecting':
      case 'reconnecting':
        return <Loader2 className="h-3 w-3 text-yellow-500 animate-spin" />
      default:
        return <WifiOff className="h-3 w-3 text-muted-foreground" />
    }
  }

  return (
    <motion.div
      layout
      className={cn(
        'group relative flex h-9 min-w-0 max-w-[200px] items-center gap-1.5 border-r border-border px-3 text-xs cursor-pointer',
        isActive
          ? 'bg-background text-foreground'
          : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      )}
      onClick={onActivate}
    >
      {isActive && (
        <motion.div
          layoutId="active-tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
        />
      )}
      {statusIcon()}
      <span className="truncate">{session.title || session.connectionName}</span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="ml-auto flex-shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  )
}
