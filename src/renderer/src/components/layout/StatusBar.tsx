import { Wifi, WifiOff, Upload, Download, Activity } from 'lucide-react'
import { useTerminalStore } from '@/stores/terminal-store'
import { useTransferStore } from '@/stores/transfer-store'
import { useUIStore } from '@/stores/ui-store'

export function StatusBar() {
  const { sessions, activeTabId } = useTerminalStore()
  const { transfers, toggleQueueExpanded } = useTransferStore()
  const { theme } = useUIStore()

  const activeSession = activeTabId ? sessions.get(activeTabId) : null
  const activeSessions = Array.from(sessions.values()).filter(
    (s) => s.status === 'connected'
  ).length

  const activeTransfers = Array.from(transfers.values()).filter(
    (t) => t.status === 'active' || t.status === 'queued'
  )

  return (
    <div className="flex h-6 items-center justify-between border-t border-border bg-background/80 px-3 text-[11px] text-muted-foreground no-select">
      {/* Left */}
      <div className="flex items-center gap-3">
        {activeSession ? (
          <div className="flex items-center gap-1.5">
            {activeSession.status === 'connected' ? (
              <Wifi className="h-3 w-3 text-emerald-500" />
            ) : (
              <WifiOff className="h-3 w-3 text-destructive" />
            )}
            <span>
              {activeSession.connectionName} — {activeSession.status}
            </span>
          </div>
        ) : (
          <span>No active connection</span>
        )}

        {activeSessions > 0 && (
          <div className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            <span>{activeSessions} session{activeSessions !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {activeTransfers.length > 0 && (
          <button
            onClick={toggleQueueExpanded}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Upload className="h-3 w-3" />
            <span>{activeTransfers.length} transfer{activeTransfers.length !== 1 ? 's' : ''}</span>
          </button>
        )}
        <span className="capitalize">{theme}</span>
      </div>
    </div>
  )
}
