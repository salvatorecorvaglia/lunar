import { useCallback, useMemo, useState } from 'react'
import { ChevronRight, Home, RefreshCw, ArrowUp, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FileList } from './FileList'
import type { FileEntry } from '@shared/types/sftp'

export type { FileEntry }

interface FilePaneProps {
  title: string
  path: string
  entries: FileEntry[]
  isLoading: boolean
  error: Error | null
  selection: Set<string>
  onPathChange: (path: string) => void
  onSelect: (name: string) => void
  onRefresh: () => void
  onDragStart?: (entry: FileEntry, e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  onFileOpen?: (entry: FileEntry) => void
  onRename?: (entry: FileEntry) => void
  onDelete?: (entry: FileEntry) => void
  onCopyPath?: (entry: FileEntry) => void
  onPreview?: (entry: FileEntry) => void
  showHidden?: boolean
  onToggleHidden?: () => void
  side: 'local' | 'remote'
}

function splitBreadcrumbs(path: string): { name: string; path: string }[] {
  const parts = path.split('/').filter(Boolean)
  const crumbs = [{ name: '/', path: '/' }]

  let current = ''
  for (const part of parts) {
    current += '/' + part
    crumbs.push({ name: part, path: current })
  }

  return crumbs
}

export function FilePane({
  title,
  path,
  entries,
  isLoading,
  error,
  selection,
  onPathChange,
  onSelect,
  onRefresh,
  onDragStart,
  onDrop,
  onFileOpen,
  onRename,
  onDelete,
  onCopyPath,
  onPreview,
  showHidden = true,
  onToggleHidden,
  side
}: FilePaneProps) {
  const breadcrumbs = splitBreadcrumbs(path)
  const [dragOver, setDragOver] = useState(false)

  const visibleEntries = useMemo(
    () => (showHidden ? entries : entries.filter((e) => !e.name.startsWith('.'))),
    [entries, showHidden]
  )

  const navigateUp = useCallback(() => {
    const parent = path.split('/').slice(0, -1).join('/') || '/'
    onPathChange(parent)
  }, [path, onPathChange])

  const handleOpen = useCallback(
    (entry: FileEntry) => {
      if (entry.isDirectory) {
        onPathChange(entry.path)
      } else {
        onFileOpen?.(entry)
      }
    },
    [onPathChange, onFileOpen]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      setDragOver(false)
      onDrop?.(e)
    },
    [onDrop]
  )

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden',
        dragOver && 'ring-2 ring-inset ring-primary/40 bg-primary/[0.02]'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-2.5 py-1.5 no-select">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'inline-block h-2 w-2 rounded-full',
              side === 'local' ? 'bg-blue-500' : 'bg-emerald-500'
            )}
          />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {onToggleHidden && (
            <button
              onClick={onToggleHidden}
              className="btn-icon !p-1"
              title={showHidden ? 'Hide dotfiles' : 'Show dotfiles'}
              aria-label={showHidden ? 'Hide dotfiles' : 'Show dotfiles'}
            >
              {showHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          )}
          <button onClick={navigateUp} className="btn-icon !p-1" title="Go up" aria-label="Go up">
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onRefresh}
            className="btn-icon !p-1"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-0.5 overflow-x-auto border-b border-border/60 px-2.5 py-1 text-xs no-select">
        <button
          onClick={() => onPathChange('/')}
          className="flex-shrink-0 rounded p-0.5 text-muted-foreground/70 hover:text-foreground hover:bg-accent cursor-pointer"
          title="Root"
        >
          <Home className="h-3 w-3" />
        </button>
        {breadcrumbs.slice(1).map((crumb) => (
          <span key={crumb.path} className="flex items-center gap-0.5">
            <ChevronRight className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
            <button
              onClick={() => onPathChange(crumb.path)}
              className="truncate text-muted-foreground/70 hover:text-foreground max-w-[120px] cursor-pointer"
              title={crumb.path}
            >
              {crumb.name}
            </button>
          </span>
        ))}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-hidden">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
            <span className="text-xs text-destructive">
              {error.message || 'Failed to load directory'}
            </span>
            <button
              onClick={onRefresh}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Try again
            </button>
          </div>
        ) : (
          <FileList
            entries={visibleEntries}
            selection={selection}
            onSelect={onSelect}
            onOpen={handleOpen}
            onDragStart={onDragStart}
            onRename={onRename}
            onDelete={onDelete}
            onCopyPath={onCopyPath}
            onPreview={onPreview}
            emptyMessage={isLoading ? 'Loading...' : 'Empty directory'}
          />
        )}
      </div>
    </div>
  )
}
