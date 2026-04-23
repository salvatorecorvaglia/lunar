import { useCallback } from 'react'
import {
  ChevronRight,
  Home,
  RefreshCw,
  FolderPlus,
  ArrowUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FileList } from './FileList'

interface FilePaneProps {
  title: string
  path: string
  entries: any[]
  isLoading: boolean
  error: any
  selection: Set<string>
  onPathChange: (path: string) => void
  onSelect: (name: string) => void
  onRefresh: () => void
  onDragStart?: (entry: any, e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
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
  side
}: FilePaneProps) {
  const breadcrumbs = splitBreadcrumbs(path)

  const navigateUp = useCallback(() => {
    const parent = path.split('/').slice(0, -1).join('/') || '/'
    onPathChange(parent)
  }, [path, onPathChange])

  const handleOpen = useCallback(
    (entry: any) => {
      if (entry.isDirectory) {
        onPathChange(entry.path)
      }
    },
    [onPathChange]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={onDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/20 px-2 py-1 no-select">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={navigateUp}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Go up"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onRefresh}
            className={cn(
              'rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
              isLoading && 'animate-spin'
            )}
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-0.5 overflow-x-auto border-b border-border px-2 py-1 text-xs no-select">
        <button
          onClick={() => onPathChange('/')}
          className="flex-shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="h-3 w-3" />
        </button>
        {breadcrumbs.slice(1).map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-0.5">
            <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <button
              onClick={() => onPathChange(crumb.path)}
              className="truncate text-muted-foreground hover:text-foreground transition-colors max-w-[120px]"
            >
              {crumb.name}
            </button>
          </span>
        ))}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-hidden">
        {error ? (
          <div className="flex h-full items-center justify-center p-4 text-center text-xs text-destructive">
            {error.message || 'Failed to load directory'}
          </div>
        ) : (
          <FileList
            entries={entries}
            selection={selection}
            onSelect={onSelect}
            onOpen={handleOpen}
            onDragStart={onDragStart}
            emptyMessage={isLoading ? 'Loading...' : 'Empty directory'}
          />
        )}
      </div>
    </div>
  )
}
