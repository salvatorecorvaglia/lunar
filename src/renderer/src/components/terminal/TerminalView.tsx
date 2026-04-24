import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Terminal, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useTerminalStore } from '@/stores/terminal-store'
import { useConnectionStore } from '@/stores/connection-store'
import { terminalThemes } from '@/themes/terminal'
import { TerminalTabs } from './TerminalTabs'
import { SplitPane } from './SplitPane'

export function TerminalView() {
  const { splitTree, terminalTheme } = useTerminalStore()

  const handleNewTab = useCallback(() => {
    const { activeConnectionId } = useConnectionStore.getState()
    if (activeConnectionId) {
      connectToHost(activeConnectionId)
    } else {
      useConnectionStore.getState().openCreateForm()
    }
  }, [])

  const themeBg = terminalThemes[terminalTheme]?.background || '#282a36'

  return (
    <div className="flex h-full flex-col">
      <TerminalTabs onNewTab={handleNewTab} />
      <div className="flex-1 overflow-hidden" style={{ backgroundColor: themeBg }}>
        {splitTree ? (
          <SplitPane node={splitTree} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06]">
              <Terminal className="h-7 w-7 text-white/30" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white/40">No active sessions</p>
              <p className="mt-1 text-xs text-white/20">
                Select a connection from the sidebar to begin
              </p>
            </div>
            <button
              onClick={handleNewTab}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-medium text-white/50 hover:bg-white/[0.08] hover:text-white/70 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              New Session
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export async function connectToHost(connectionId: string): Promise<void> {
  const sessionId = uuidv4()
  const { addSession, updateSessionStatus } = useTerminalStore.getState()

  let connectionName = 'Unknown'
  try {
    const conn = await window.api.connections.get(connectionId)
    if (conn) {
      connectionName = conn.name
    }
  } catch {}

  addSession({
    id: sessionId,
    connectionId,
    connectionName,
    status: 'connecting',
    title: connectionName
  })

  // Listener lives for the session lifetime — cleanup handled on tab close
  window.api.ssh.onStatus((event) => {
    if (event.sessionId === sessionId) {
      updateSessionStatus(sessionId, event.status)
    }
  })

  try {
    const result = await window.api.ssh.connect({
      connectionId,
      sessionId
    })

    if (!result.success) {
      toast.error(`Connection failed: ${result.error}`)
      updateSessionStatus(sessionId, 'error')
    }
  } catch (err: any) {
    toast.error(`Connection error: ${err.message}`)
    updateSessionStatus(sessionId, 'error')
  }
}
