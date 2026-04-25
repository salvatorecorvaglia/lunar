import { ipcMain } from 'electron'
import { IPC } from '@shared/constants'
import { sshManager } from '../services/ssh-manager'
import { assertNonEmptyString, assertBoundedInt } from '../lib/validate'
import type { SshConnectParams, SshSendDataParams, SshResizeParams } from '@shared/types/terminal'

export function registerSshHandlers(): void {
  ipcMain.handle(IPC.SSH_CONNECT, async (_event, params: SshConnectParams) => {
    assertNonEmptyString(params.sessionId, 'sessionId')
    assertNonEmptyString(params.connectionId, 'connectionId')
    return sshManager.connect(params.sessionId, params.connectionId)
  })

  ipcMain.handle(IPC.SSH_DISCONNECT, (_event, sessionId: string) => {
    assertNonEmptyString(sessionId, 'sessionId')
    sshManager.disconnect(sessionId)
  })

  ipcMain.handle(IPC.SSH_SEND_DATA, (_event, params: SshSendDataParams) => {
    assertNonEmptyString(params.sessionId, 'sessionId')
    sshManager.sendData(params.sessionId, params.data)
  })

  ipcMain.handle(IPC.SSH_RESIZE, (_event, params: SshResizeParams) => {
    assertNonEmptyString(params.sessionId, 'sessionId')
    assertBoundedInt(params.cols, 'cols', 1, 500)
    assertBoundedInt(params.rows, 'rows', 1, 500)
    sshManager.resize(params.sessionId, params.cols, params.rows)
  })
}
