import { useMemo, useState } from 'react'
import {
  Folder,
  File,
  FileText,
  FileImage,
  FileCode,
  FileArchive,
  ChevronUp,
  ChevronDown,
  Link2,
  FolderOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileEntry {
  name: string
  path: string
  size: number
  modifiedAt: number
  isDirectory: boolean
  isSymlink?: boolean
}

type SortField = 'name' | 'size' | 'modifiedAt'
type SortDir = 'asc' | 'desc'

interface FileListProps {
  entries: FileEntry[]
  selection: Set<string>
  onSelect: (name: string) => void
  onOpen: (entry: FileEntry) => void
  onDragStart?: (entry: FileEntry, e: React.DragEvent) => void
  emptyMessage?: string
}

function getFileIcon(entry: FileEntry) {
  if (entry.isDirectory) return <Folder className="h-4 w-4 text-blue-400" />
  if (entry.isSymlink) return <Link2 className="h-4 w-4 text-cyan-400" />

  const ext = entry.name.split('.').pop()?.toLowerCase()

  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp'].includes(ext || ''))
    return <FileImage className="h-4 w-4 text-pink-400" />
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'sh', 'bash'].includes(ext || ''))
    return <FileCode className="h-4 w-4 text-green-400" />
  if (['zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar'].includes(ext || ''))
    return <FileArchive className="h-4 w-4 text-yellow-400" />
  if (['md', 'txt', 'log', 'csv', 'json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf'].includes(ext || ''))
    return <FileText className="h-4 w-4 text-muted-foreground" />

  return <File className="h-4 w-4 text-muted-foreground" />
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '\u2014'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const isThisYear = date.getFullYear() === now.getFullYear()

  if (isThisYear) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function FileList({
  entries,
  selection,
  onSelect,
  onOpen,
  onDragStart,
  emptyMessage = 'No files'
}: FileListProps) {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1

      const mul = sortDir === 'asc' ? 1 : -1
      if (sortField === 'name') return mul * a.name.localeCompare(b.name)
      if (sortField === 'size') return mul * (a.size - b.size)
      return mul * (a.modifiedAt - b.modifiedAt)
    })
  }, [entries, sortField, sortDir])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <FolderOpen className="h-8 w-8 text-muted-foreground/20" />
        <span className="text-xs">{emptyMessage}</span>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center border-b border-border/60 bg-muted/20 text-[11px] font-medium text-muted-foreground/80 no-select">
        <button
          onClick={() => handleSort('name')}
          className="flex flex-1 items-center gap-1 px-3 py-1.5 hover:text-foreground cursor-pointer"
        >
          Name <SortIcon field="name" />
        </button>
        <button
          onClick={() => handleSort('size')}
          className="flex w-20 items-center justify-end gap-1 px-2 py-1.5 hover:text-foreground cursor-pointer"
        >
          Size <SortIcon field="size" />
        </button>
        <button
          onClick={() => handleSort('modifiedAt')}
          className="flex w-36 items-center justify-end gap-1 px-3 py-1.5 hover:text-foreground cursor-pointer"
        >
          Modified <SortIcon field="modifiedAt" />
        </button>
      </div>

      {/* File rows */}
      <div className="flex-1 overflow-y-auto">
        {sorted.map((entry) => (
          <div
            key={entry.name}
            className={cn(
              'group flex items-center text-xs cursor-pointer border-b border-transparent',
              selection.has(entry.name)
                ? 'bg-accent/80 border-b-border/30'
                : 'hover:bg-accent/30'
            )}
            onClick={() => onSelect(entry.name)}
            onDoubleClick={() => onOpen(entry)}
            draggable={!!onDragStart}
            onDragStart={(e) => onDragStart?.(entry, e)}
          >
            <div className="flex flex-1 items-center gap-2 truncate px-3 py-[7px]">
              {getFileIcon(entry)}
              <span className={cn('truncate', entry.isDirectory && 'font-medium')}>
                {entry.name}
              </span>
            </div>
            <div className="w-20 px-2 py-[7px] text-right text-muted-foreground/70 tabular-nums">
              {entry.isDirectory ? '\u2014' : formatSize(entry.size)}
            </div>
            <div className="w-36 px-3 py-[7px] text-right text-muted-foreground/70 tabular-nums">
              {formatDate(entry.modifiedAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
