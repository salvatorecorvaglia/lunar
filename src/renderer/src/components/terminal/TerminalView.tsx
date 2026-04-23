import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { useTerminalStore } from '@/stores/terminal-store'
import { useConnectionStore } from '@/stores/connection-store'
import { useConnections } from '@/hooks/use-connections'
import { TerminalTabs } from './TerminalTabs'
import { SplitPane } from './SplitPane'

export function TerminalView() {
  const { splitTree, activeTabId, sessions } = useTerminalStore()
  const { data: connections = [] } = useConnections()

  const handleNewTab = useCallback(() => {
    // Open connection form or use last connection
    const { activeConnectionId } = useConnectionStore.getState()
    if (activeConnectionId) {
      connectToHost(activeConnectionId)
    } else {
      useConnectionStore.getState().openCreateForm()
    }
  }, [])

  return (
    <div className="flex h-full flex-col">
      <TerminalTabs onNewTab={handleNewTab} />
      <div className="flex-1 overflow-hidden bg-[#282a36]">
        {splitTree ? (
          <SplitPane node={splitTree} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No active terminal sessions
          </div>
        )}
      </div>
    </div>
  )
}

export async function connectToHost(connectionId: string): Promise<void> {
  const sessionId = uuidv4()
  const { addSession, updateSessionStatus } = useTerminalStore.getState()

  // Get connection info for display
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

  // Listen for status updates for this session
  const cleanupStatus = window.api.ssh.onStatus((event) => {
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
