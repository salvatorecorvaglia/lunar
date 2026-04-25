import { useEffect, useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Unplug, Plus } from 'lucide-react'
import { useSftpStore } from '@/stores/sftp-store'
import { useTerminalStore } from '@/stores/terminal-store'
import { useTransferStore } from '@/stores/transfer-store'
import { useConnectionStore } from '@/stores/connection-store'
import {
  useSftpDirectory,
  useLocalDirectory,
  useInvalidateSftp,
  useInvalidateLocalDir
} from '@/hooks/use-sftp'
import { FilePane, type FileEntry } from './FilePane'
import { TransferQueue } from './TransferQueue'
import { FilePreview } from './FilePreview'

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
    setLocalSelection,
    setRemoteSelection,
    showHiddenFiles,
    toggleHiddenFiles
  } = useSftpStore()

  const { sessions } = useTerminalStore()
  const invalidateSftp = useInvalidateSftp()
  const invalidateLocal = useInvalidateLocalDir()
  const [splitRatio, setSplitRatio] = useState(0.5)
  const [resizing, setResizing] = useState(false)
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
      window.api.shell
        .homeDir()
        .then(setLocalPath)
        .catch(() => {
          setLocalPath('/')
        })
    }
  }, [localPath, setLocalPath])

  const {
    data: remoteEntries = [],
    isLoading: remoteLoading,
    error: remoteError
  } = useSftpDirectory(sftpSessionId, remotePath)

  const {
    data: localEntries = [],
    isLoading: localLoading,
    error: localError
  } = useLocalDirectory(localPath)

  const { addTransfer } = useTransferStore()

  // Drag-and-drop: remote -> local (download)
  const handleLocalDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      const remoteSrc = e.dataTransfer.getData('remote-path')
      const fileName = e.dataTransfer.getData('file-name')
      const fileSize = parseInt(e.dataTransfer.getData('file-size') || '0', 10)
      if (!remoteSrc || !sftpSessionId) return

      const localDest = await window.api.shell.joinPath(localPath, fileName)
      try {
        const transferId = await window.api.sftp.download({
          sessionId: sftpSessionId,
          remotePath: remoteSrc,
          localPath: localDest
        })
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
      } catch (err: unknown) {
        toast.error(`Download failed: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
    [sftpSessionId, localPath, addTransfer]
  )

  // Drag-and-drop: local -> remote (upload)
  const handleRemoteDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      const localSrc = e.dataTransfer.getData('local-path')
      const rawFileName = e.dataTransfer.getData('file-name')
      const fileSize = parseInt(e.dataTransfer.getData('file-size') || '0', 10)
      if (!localSrc || !sftpSessionId) return

      // Sanitize filename to prevent path traversal
      const fileName = rawFileName.split('/').pop()?.split('\\').pop() || rawFileName
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
      } catch (err: unknown) {
        toast.error(`Upload failed: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
    [sftpSessionId, remotePath, addTransfer]
  )

  const handleLocalDragStart = useCallback((entry: FileEntry, e: React.DragEvent) => {
    e.dataTransfer.setData('local-path', entry.path)
    e.dataTransfer.setData('file-name', entry.name)
    e.dataTransfer.setData('file-size', String(entry.size || 0))
  }, [])

  const handleRemoteDragStart = useCallback((entry: FileEntry, e: React.DragEvent) => {
    e.dataTransfer.setData('remote-path', entry.path)
    e.dataTransfer.setData('file-name', entry.name)
    e.dataTransfer.setData('file-size', String(entry.size || 0))
  }, [])

  const { setPreviewFile } = useSftpStore()

  // Preview remote file on double-click
  const handleRemoteFileOpen = useCallback(
    async (entry: FileEntry) => {
      if (!sftpSessionId) return
      try {
        const content = await window.api.sftp.readFile({
          sessionId: sftpSessionId,
          path: entry.path
        })
        const ext = entry.name.split('.').pop()?.toLowerCase() || ''
        const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp']
        const type = imageExts.includes(ext)
          ? `image/${ext === 'jpg' ? 'jpeg' : ext === 'svg' ? 'svg+xml' : ext}`
          : 'text/plain'
        setPreviewFile({ name: entry.name, content, type })
      } catch (err: unknown) {
        toast.error(`Preview failed: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
    [sftpSessionId, setPreviewFile]
  )

  // Rename remote file/directory
  const handleRemoteRename = useCallback(
    async (entry: FileEntry) => {
      if (!sftpSessionId) return
      const newName = window.prompt('Rename to:', entry.name)
      if (!newName || newName === entry.name) return

      const parentPath = entry.path.substring(0, entry.path.lastIndexOf('/')) || '/'
      const newPath = parentPath === '/' ? `/${newName}` : `${parentPath}/${newName}`
      try {
        await window.api.sftp.rename({
          sessionId: sftpSessionId,
          oldPath: entry.path,
          newPath
        })
        toast.success(`Renamed to ${newName}`)
        invalidateSftp(sftpSessionId, remotePath)
      } catch (err: unknown) {
        toast.error(`Rename failed: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
    [sftpSessionId, remotePath, invalidateSftp]
  )

  // Delete remote file/directory
  const handleRemoteDelete = useCallback(
    async (entry: FileEntry) => {
      if (!sftpSessionId) return
      const confirmed = window.confirm(
        `Delete "${entry.name}"${entry.isDirectory ? ' and all its contents' : ''}?`
      )
      if (!confirmed) return

      try {
        await window.api.sftp.delete({
          sessionId: sftpSessionId,
          path: entry.path,
          isDirectory: entry.isDirectory
        })
        toast.success(`Deleted ${entry.name}`)
        invalidateSftp(sftpSessionId, remotePath)
      } catch (err: unknown) {
        toast.error(`Delete failed: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
    [sftpSessionId, remotePath, invalidateSftp]
  )

  // Copy remote path to clipboard
  const handleRemoteCopyPath = useCallback((entry: FileEntry) => {
    navigator.clipboard.writeText(entry.path)
    toast.success('Path copied to clipboard')
  }, [])

  // Create directory on remote
  const handleRemoteMkdir = useCallback(async () => {
    if (!sftpSessionId) return
    const name = window.prompt('New folder name:')
    if (!name) return

    const newPath = remotePath === '/' ? `/${name}` : `${remotePath}/${name}`
    try {
      await window.api.sftp.mkdir({ sessionId: sftpSessionId, path: newPath })
      toast.success(`Created folder "${name}"`)
      invalidateSftp(sftpSessionId, remotePath)
    } catch (err: unknown) {
      toast.error(`Failed to create folder: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [sftpSessionId, remotePath, invalidateSftp])

  // Resize handle
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setResizing(true)
    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width
      setSplitRatio(Math.max(0.2, Math.min(0.8, ratio)))
    }
    const onMouseUp = () => {
      setResizing(false)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

  if (!sftpSessionId || !sessions.get(sftpSessionId)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
          <Unplug className="h-7 w-7 text-muted-foreground/30" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground/60">No active connection</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Connect to a server first, then switch to SFTP view
          </p>
        </div>
        <button
          onClick={() => useConnectionStore.getState().openCreateForm()}
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          New Connection
        </button>
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
            showHidden={showHiddenFiles}
            onToggleHidden={toggleHiddenFiles}
            onSelectAll={() => setLocalSelection(new Set(localEntries.map((e) => e.name)))}
            side="local"
          />
        </div>

        {/* Resize handle */}
        <div className="relative w-px flex-shrink-0 cursor-col-resize">
          <div
            className={`absolute inset-0 bg-border ${resizing ? 'bg-primary/60' : 'hover:bg-primary/40'}`}
            style={{ transition: 'background-color 150ms' }}
          />
          <div
            onMouseDown={handleResizeMouseDown}
            className="absolute -left-1.5 -right-1.5 inset-y-0 cursor-col-resize"
          />
        </div>

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
            onFileOpen={handleRemoteFileOpen}
            onRename={handleRemoteRename}
            onDelete={handleRemoteDelete}
            onCopyPath={handleRemoteCopyPath}
            onPreview={handleRemoteFileOpen}
            showHidden={showHiddenFiles}
            onToggleHidden={toggleHiddenFiles}
            onMkdir={handleRemoteMkdir}
            onSelectAll={() => setRemoteSelection(new Set(remoteEntries.map((e) => e.name)))}
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
