import { ipcMain } from 'electron'
import { IPC } from '@shared/constants'
import { sshManager } from '../services/ssh-manager'
import type { SshConnectParams, SshSendDataParams, SshResizeParams } from '@shared/types/terminal'

export function registerSshHandlers(): void {
  ipcMain.handle(IPC.SSH_CONNECT, async (_event, params: SshConnectParams) => {
    return sshManager.connect(params.sessionId, params.connectionId)
  })

  ipcMain.handle(IPC.SSH_DISCONNECT, (_event, sessionId: string) => {
    sshManager.disconnect(sessionId)
  })

  ipcMain.handle(IPC.SSH_SEND_DATA, (_event, params: SshSendDataParams) => {
    sshManager.sendData(params.sessionId, params.data)
  })

  ipcMain.handle(IPC.SSH_RESIZE, (_event, params: SshResizeParams) => {
    sshManager.resize(params.sessionId, params.cols, params.rows)
  })
}
