import { useEffect, useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { FolderOpen, Unplug } from 'lucide-react'
import { useSftpStore } from '@/stores/sftp-store'
import { useTerminalStore } from '@/stores/terminal-store'
import { useTransferStore } from '@/stores/transfer-store'
import { useSftpDirectory, useLocalDirectory, useInvalidateSftp, useInvalidateLocalDir } from '@/hooks/use-sftp'
import { FilePane } from './FilePane'
import { TransferQueue } from './TransferQueue'
import { FilePreview } from './FilePreview'
import { cn } from '@/lib/utils'

export function SftpManager() {
  const {
    localPath,
    remotePath,
    localSelection,
    remoteSelection,
    sftpSessionId,
    setLocalPath,
    setRemotePath,
    toggleLocalSelection,
    toggleRemoteSelection,
    setSftpSessionId,
    setPreviewFile
  } = useSftpStore()

  const { sessions, tabOrder } = useTerminalStore()
  const invalidateSftp = useInvalidateSftp()
  const invalidateLocal = useInvalidateLocalDir()
  const [splitRatio, setSplitRatio] = useState(0.5)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-select first connected session if none selected
  useEffect(() => {
    if (!sftpSessionId) {
      const connected = Array.from(sessions.values()).find((s) => s.status === 'connected')
      if (connected) {
        setSftpSessionId(connected.id)
      }
    }
  }, [sessions, sftpSessionId, setSftpSessionId])

  // Set local path to home directory on mount
  useEffect(() => {
    if (!localPath) {
      window.api.shell.homeDir().then(setLocalPath)
    }
  }, [localPath, setLocalPath])

  const { data: remoteEntries = [], isLoading: remoteLoading, error: remoteError } =
    useSftpDirectory(sftpSessionId, remotePath)

  const { data: localEntries = [], isLoading: localLoading, error: localError } =
    useLocalDirectory(localPath)

  const { addTransfer } = useTransferStore()

  // Drag-and-drop: remote -> local (download)
  const handleLocalDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      const remoteSrc = e.dataTransfer.getData('remote-path')
      const fileName = e.dataTransfer.getData('file-name')
      const fileSize = parseInt(e.dataTransfer.getData('file-size') || '0', 10)
      if (!remoteSrc || !sftpSessionId) return

      const localDest = localPath + '/' + fileName
      try {
        const transferId = await window.api.sftp.download({
          sessionId: sftpSessionId,
          remotePath: remoteSrc,
          localPath: localDest
        })
        // Add to store for immediate UI feedback
        addTransfer({
          id: transferId,
          type: 'download',
          localPath: localDest,
          remotePath: remoteSrc,
          fileName,
          size: fileSize,
          transferred: 0,
          status: 'queued',
          bytesPerSec: 0,
          sessionId: sftpSessionId
        })
      } catch (err: any) {
        toast.error(`Download failed: ${err.message}`)
      }
    },
    [sftpSessionId, localPath, addTransfer]
  )

  // Drag-and-drop: local -> remote (upload)
  const handleRemoteDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      const localSrc = e.dataTransfer.getData('local-path')
      const fileName = e.dataTransfer.getData('file-name')
      const fileSize = parseInt(e.dataTransfer.getData('file-size') || '0', 10)
      if (!localSrc || !sftpSessionId) return

      const remoteDest = remotePath === '/' ? `/${fileName}` : `${remotePath}/${fileName}`
      try {
        const transferId = await window.api.sftp.upload({
          sessionId: sftpSessionId,
          localPath: localSrc,
          remotePath: remoteDest
        })
        addTransfer({
          id: transferId,
          type: 'upload',
          localPath: localSrc,
          remotePath: remoteDest,
          fileName,
          size: fileSize,
          transferred: 0,
          status: 'queued',
          bytesPerSec: 0,
          sessionId: sftpSessionId
        })
      } catch (err: any) {
        toast.error(`Upload failed: ${err.message}`)
      }
    },
    [sftpSessionId, remotePath, addTransfer]
  )

  const handleLocalDragStart = useCallback((entry: any, e: React.DragEvent) => {
    e.dataTransfer.setData('local-path', entry.path)
    e.dataTransfer.setData('file-name', entry.name)
    e.dataTransfer.setData('file-size', String(entry.size || 0))
  }, [])

  const handleRemoteDragStart = useCallback((entry: any, e: React.DragEvent) => {
    e.dataTransfer.setData('remote-path', entry.path)
    e.dataTransfer.setData('file-name', entry.name)
    e.dataTransfer.setData('file-size', String(entry.size || 0))
  }, [])

  // Resize handle
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const onMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const ratio = (e.clientX - rect.left) / rect.width
        setSplitRatio(Math.max(0.2, Math.min(0.8, ratio)))
      }
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    []
  )

  if (!sftpSessionId || !sessions.get(sftpSessionId)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Unplug className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm">Connect to a server to browse files</p>
        <p className="text-xs text-muted-foreground/70">
          Use the sidebar to connect, then switch to SFTP view
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Dual pane */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Local pane */}
        <div style={{ width: `${splitRatio * 100}%` }} className="overflow-hidden">
          <FilePane
            title="Local"
            path={localPath}
            entries={localEntries}
            isLoading={localLoading}
            error={localError}
            selection={localSelection}
            onPathChange={setLocalPath}
            onSelect={toggleLocalSelection}
            onRefresh={() => invalidateLocal(localPath)}
            onDragStart={handleLocalDragStart}
            onDrop={handleLocalDrop}
            side="local"
          />
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeMouseDown}
          className="w-1 flex-shrink-0 cursor-col-resize bg-border hover:bg-ring transition-colors"
        />

        {/* Remote pane */}
        <div style={{ width: `${(1 - splitRatio) * 100}%` }} className="overflow-hidden">
          <FilePane
            title="Remote"
            path={remotePath}
            entries={remoteEntries}
            isLoading={remoteLoading}
            error={remoteError}
            selection={remoteSelection}
            onPathChange={setRemotePath}
            onSelect={toggleRemoteSelection}
            onRefresh={() => invalidateSftp(sftpSessionId!, remotePath)}
            onDragStart={handleRemoteDragStart}
            onDrop={handleRemoteDrop}
            side="remote"
          />
        </div>
      </div>

      {/* Transfer queue */}
      <TransferQueue />

      {/* File preview modal */}
      <FilePreview />
    </div>
  )
}
