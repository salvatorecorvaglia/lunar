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
    <div className="flex h-9 items-center border-b border-border/60 bg-card/60 no-select">
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
        className="btn-icon mx-1 !p-1.5 flex-shrink-0"
        title="New tab"
        aria-label="New tab"
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
        return <div className="h-2 w-2 rounded-full bg-emerald-500" />
      case 'connecting':
      case 'reconnecting':
        return <Loader2 className="h-3 w-3 text-amber-500 animate-spin" />
      case 'error':
        return <WifiOff className="h-3 w-3 text-destructive" />
      default:
        return <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
    }
  }

  return (
    <motion.div
      layout
      transition={{ duration: 0.15 }}
      className={cn(
        'group relative flex h-9 min-w-[120px] max-w-[200px] items-center gap-2 border-r border-border/40 px-3 text-xs cursor-pointer',
        isActive
          ? 'bg-background text-foreground'
          : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
      )}
      onClick={onActivate}
    >
      {isActive && (
        <motion.div
          layoutId="active-tab-indicator"
          className="absolute inset-x-0 top-0 h-[2px] bg-primary"
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        />
      )}
      {statusIcon()}
      <span className="truncate font-medium">{session.title || session.connectionName}</span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="ml-auto flex-shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-accent cursor-pointer"
        aria-label="Close tab"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  )
}
