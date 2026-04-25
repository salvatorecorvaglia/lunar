import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Download,
  X,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  RotateCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTransferStore } from '@/stores/transfer-store'
import { cancelTransfer } from '@/hooks/use-transfers'
import type { TransferItem } from '@shared/types/transfer'
import { toast } from 'sonner'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

function formatSpeed(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`
}

export function TransferQueue() {
  const {
    transfers,
    queueExpanded,
    toggleQueueExpanded,
    clearCompleted,
    removeTransfer,
    addTransfer
  } = useTransferStore()

  const retryTransfer = async (item: TransferItem) => {
    removeTransfer(item.id)
    try {
      const transferId =
        item.type === 'download'
          ? await window.api.sftp.download({
              sessionId: item.sessionId,
              remotePath: item.remotePath,
              localPath: item.localPath
            })
          : await window.api.sftp.upload({
              sessionId: item.sessionId,
              localPath: item.localPath,
              remotePath: item.remotePath
            })
      addTransfer({
        id: transferId,
        type: item.type,
        localPath: item.localPath,
        remotePath: item.remotePath,
        fileName: item.fileName,
        size: item.size,
        transferred: 0,
        status: 'queued',
        bytesPerSec: 0,
        sessionId: item.sessionId
      })
    } catch (err: unknown) {
      toast.error(`Retry failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const items = Array.from(transfers.values())
  if (items.length === 0) return null

  const activeCount = items.filter((t) => t.status === 'active' || t.status === 'queued').length
  const completedCount = items.filter((t) => t.status === 'completed').length

  return (
    <div className="border-t border-border/60 bg-card/80">
      {/* Toggle bar */}
      <button
        onClick={toggleQueueExpanded}
        className="flex w-full items-center justify-between px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent/50 no-select cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Upload className="h-3.5 w-3.5" />
          <span className="font-medium">
            {activeCount > 0 ? `${activeCount} active` : ''}
            {activeCount > 0 && completedCount > 0 ? ', ' : ''}
            {completedCount > 0 ? `${completedCount} completed` : ''}
            {activeCount === 0 && completedCount === 0 ? 'No transfers' : ''}
          </span>
        </div>
        {queueExpanded ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5" />
        )}
      </button>

      <AnimatePresence>
        {queueExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="max-h-[30vh] overflow-y-auto">
              {items.map((item) => (
                <TransferRow
                  key={item.id}
                  item={item}
                  onRemove={() => removeTransfer(item.id)}
                  onRetry={() => retryTransfer(item)}
                />
              ))}
            </div>

            {completedCount > 0 && (
              <div className="flex justify-end border-t border-border/60 px-3 py-1">
                <button
                  onClick={clearCompleted}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear completed
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TransferRow({
  item,
  onRemove,
  onRetry
}: {
  item: TransferItem
  onRemove: () => void
  onRetry: () => void
}) {
  const percent = item.size > 0 ? Math.round((item.transferred / item.size) * 100) : 0
  const isInProgress = item.status === 'active' || item.status === 'queued'

  const handleRemove = () => {
    if (isInProgress) {
      cancelTransfer(item.id)
    }
    onRemove()
  }

  return (
    <div className="flex items-center gap-2.5 border-t border-border/40 px-3 py-2">
      {/* Icon */}
      {item.type === 'upload' ? (
        <Upload className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
      ) : (
        <Download className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
      )}

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-foreground">{item.fileName}</div>
        <div className="mt-1 flex items-center gap-2">
          {/* Progress bar */}
          {isInProgress && (
            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  item.type === 'upload' ? 'bg-blue-500' : 'bg-emerald-500'
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
          )}
          <span className="text-[10px] text-muted-foreground flex-shrink-0 tabular-nums">
            {item.status === 'active'
              ? `${percent}% \u00b7 ${formatSpeed(item.bytesPerSec)}`
              : item.status === 'queued'
                ? 'Queued'
                : item.status === 'completed'
                  ? formatBytes(item.size)
                  : item.error || 'Error'}
          </span>
        </div>
      </div>

      {/* Status icon */}
      <div className="flex-shrink-0">
        {item.status === 'active' && <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin" />}
        {item.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
        {item.status === 'error' && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
      </div>

      {/* Retry (error only) */}
      {item.status === 'error' && (
        <button
          onClick={onRetry}
          title="Retry transfer"
          className="flex-shrink-0 rounded p-0.5 text-muted-foreground/50 hover:text-foreground cursor-pointer"
          aria-label="Retry transfer"
        >
          <RotateCw className="h-3 w-3" />
        </button>
      )}

      {/* Cancel / Remove */}
      <button
        onClick={handleRemove}
        title={isInProgress ? 'Cancel transfer' : 'Remove'}
        className="flex-shrink-0 rounded p-0.5 text-muted-foreground/50 hover:text-foreground cursor-pointer"
        aria-label={isInProgress ? 'Cancel transfer' : 'Remove'}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
