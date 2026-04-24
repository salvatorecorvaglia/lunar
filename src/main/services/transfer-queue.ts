import { stat } from 'fs/promises'
import { basename } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { IPC } from '@shared/constants'
import type { TransferType } from '@shared/types/transfer'
import { sftpManager } from './sftp-manager'
import { emitToRenderer } from './emit'

interface QueuedTransfer {
  id: string
  type: TransferType
  sessionId: string
  localPath: string
  remotePath: string
  fileName: string
  size: number
  cancelled: boolean
  lastEmitTime: number
  lastTransferred: number
}

class TransferQueue {
  private queue: QueuedTransfer[] = []
  private active = new Map<string, QueuedTransfer>()
  private maxConcurrent = 3

  setMaxConcurrent(max: number): void {
    this.maxConcurrent = Math.max(1, Math.min(10, max))
    this.processQueue()
  }

  async enqueue(
    type: TransferType,
    sessionId: string,
    localPath: string,
    remotePath: string
  ): Promise<string> {
    const transferId = uuidv4()
    const fileName = basename(type === 'upload' ? localPath : remotePath)

    // Get file size
    let size = 0
    try {
      if (type === 'upload') {
        const stats = await stat(localPath)
        size = stats.size
      } else {
        size = await sftpManager.statSize(sessionId, remotePath)
      }
    } catch {
      // Size unknown, will be reported by progress callback
    }

    const transfer: QueuedTransfer = {
      id: transferId,
      type,
      sessionId,
      localPath,
      remotePath,
      fileName,
      size,
      cancelled: false,
      lastEmitTime: Date.now(),
      lastTransferred: 0
    }

    this.queue.push(transfer)

    // Notify renderer of queued transfer
    emitToRenderer(IPC.TRANSFER_PROGRESS, {
      transferId,
      transferred: 0,
      total: size,
      bytesPerSec: 0
    })

    this.processQueue()
    return transferId
  }

  cancel(transferId: string): void {
    // Check queue first
    const queueIndex = this.queue.findIndex((t) => t.id === transferId)
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1)
      emitToRenderer(IPC.TRANSFER_ERROR, {
        transferId,
        error: 'Cancelled'
      })
      return
    }

    // Mark active transfer as cancelled
    const active = this.active.get(transferId)
    if (active) {
      active.cancelled = true
    }
  }

  private processQueue(): void {
    while (this.active.size < this.maxConcurrent && this.queue.length > 0) {
      const transfer = this.queue.shift()!
      this.active.set(transfer.id, transfer)
      this.executeTransfer(transfer)
    }
  }

  private async executeTransfer(transfer: QueuedTransfer): Promise<void> {
    const { id, type, sessionId, localPath, remotePath } = transfer

    try {
      const onProgress = (transferred: number, _chunk: number, total: number) => {
        if (transfer.cancelled) return

        // Calculate speed (throttle to every 200ms)
        const now = Date.now()
        const elapsed = (now - transfer.lastEmitTime) / 1000
        if (elapsed >= 0.2) {
          const delta = transferred - transfer.lastTransferred
          const bytesPerSec = Math.round(delta / elapsed)
          transfer.lastEmitTime = now
          transfer.lastTransferred = transferred

          // Update size if we didn't know it
          if (transfer.size === 0 && total > 0) {
            transfer.size = total
          }

          emitToRenderer(IPC.TRANSFER_PROGRESS, {
            transferId: id,
            transferred,
            total: transfer.size || total,
            bytesPerSec
          })
        }
      }

      if (type === 'download') {
        await sftpManager.fastDownload(sessionId, remotePath, localPath, onProgress)
      } else {
        await sftpManager.fastUpload(sessionId, localPath, remotePath, onProgress)
      }

      if (transfer.cancelled) {
        emitToRenderer(IPC.TRANSFER_ERROR, { transferId: id, error: 'Cancelled' })
      } else {
        emitToRenderer(IPC.TRANSFER_COMPLETE, { transferId: id })
      }
    } catch (err: unknown) {
      emitToRenderer(IPC.TRANSFER_ERROR, {
        transferId: id,
        error: err instanceof Error ? err.message : 'Transfer failed'
      })
    } finally {
      this.active.delete(id)
      this.processQueue()
    }
  }

  getActiveCount(): number {
    return this.active.size
  }

  getQueuedCount(): number {
    return this.queue.length
  }

  cancelAll(): void {
    for (const transfer of this.active.values()) {
      transfer.cancelled = true
    }
    for (const transfer of this.queue) {
      emitToRenderer(IPC.TRANSFER_ERROR, {
        transferId: transfer.id,
        error: 'Cancelled'
      })
    }
    this.queue = []
  }
}

export const transferQueue = new TransferQueue()
