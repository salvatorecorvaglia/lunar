import { useEffect } from 'react'
import { useTransferStore } from '@/stores/transfer-store'
import { useInvalidateSftp, useInvalidateLocalDir } from '@/hooks/use-sftp'

/**
 * Subscribes to IPC transfer events (progress, complete, error) and
 * routes them into the Zustand transfer store. Also invalidates
 * SFTP/local directory caches on transfer completion.
 *
 * Mount this once at the app level so events are always captured.
 */
export function useTransferEventListener(): void {
  const { updateProgress, completeTransfer, errorTransfer } = useTransferStore()
  const invalidateSftp = useInvalidateSftp()
  const invalidateLocal = useInvalidateLocalDir()

  useEffect(() => {
    const cleanupProgress = window.api.transfers.onProgress((event) => {
      updateProgress(event.transferId, event.transferred, event.bytesPerSec)
    })

    const cleanupComplete = window.api.transfers.onComplete((event) => {
      // Look up sessionId from the transfer before marking complete
      const transfer = useTransferStore.getState().transfers.get(event.transferId)
      const sessionId = transfer?.sessionId
      completeTransfer(event.transferId)
      // Invalidate both directory caches so the UI refreshes
      if (sessionId) {
        invalidateSftp(sessionId, undefined)
      }
      invalidateLocal(undefined)
    })

    const cleanupError = window.api.transfers.onError((event) => {
      errorTransfer(event.transferId, event.error)
    })

    return () => {
      cleanupProgress()
      cleanupComplete()
      cleanupError()
    }
  }, [updateProgress, completeTransfer, errorTransfer, invalidateSftp, invalidateLocal])
}

/**
 * Cancel a transfer by ID. Delegates to main process.
 */
export function cancelTransfer(transferId: string): void {
  window.api.transfers.cancel(transferId)
}
