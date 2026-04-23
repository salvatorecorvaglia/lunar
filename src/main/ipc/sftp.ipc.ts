import { ipcMain } from 'electron'
import { IPC } from '@shared/constants'
import { sftpManager } from '../services/sftp-manager'
import { transferQueue } from '../services/transfer-queue'
import type {
  SftpListParams,
  SftpMkdirParams,
  SftpRenameParams,
  SftpDeleteParams,
  SftpReadFileParams,
  SftpTransferParams
} from '@shared/types/sftp'

export function registerSftpHandlers(): void {
  ipcMain.handle(IPC.SFTP_LIST, async (_event, params: SftpListParams) => {
    return sftpManager.list(params.sessionId, params.path)
  })

  ipcMain.handle(IPC.SFTP_MKDIR, async (_event, params: SftpMkdirParams) => {
    return sftpManager.mkdir(params.sessionId, params.path)
  })

  ipcMain.handle(IPC.SFTP_RENAME, async (_event, params: SftpRenameParams) => {
    return sftpManager.rename(params.sessionId, params.oldPath, params.newPath)
  })

  ipcMain.handle(IPC.SFTP_DELETE, async (_event, params: SftpDeleteParams) => {
    return sftpManager.remove(params.sessionId, params.path, params.isDirectory)
  })

  ipcMain.handle(IPC.SFTP_READ_FILE, async (_event, params: SftpReadFileParams) => {
    return sftpManager.readFile(params.sessionId, params.path, params.maxSize)
  })

  ipcMain.handle(IPC.SFTP_DOWNLOAD, async (_event, params: SftpTransferParams) => {
    return sftpManager.download(params.sessionId, params.remotePath, params.localPath)
  })

  ipcMain.handle(IPC.SFTP_UPLOAD, async (_event, params: SftpTransferParams) => {
    return sftpManager.upload(params.sessionId, params.localPath, params.remotePath)
  })

  ipcMain.handle(IPC.TRANSFER_CANCEL, (_event, transferId: string) => {
    transferQueue.cancel(transferId)
  })
}
