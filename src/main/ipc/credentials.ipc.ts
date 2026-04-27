import { ipcMain } from 'electron'
import { IPC } from '@shared/constants'
import { storeCredential, retrieveCredential, deleteCredential } from '../services/credential-store'
import { assertNonEmptyString } from '../lib/validate'
import log from '../lib/logger'

export function registerCredentialHandlers(): void {
  ipcMain.handle(
    IPC.CREDENTIAL_STORE,
    (_event, payload: { connectionId: string; secret: string }) => {
      try {
        assertNonEmptyString(payload?.connectionId, 'connectionId')
        assertNonEmptyString(payload?.secret, 'secret')
        storeCredential(payload.connectionId, payload.secret)
      } catch (err) {
        log.error('[IPC] CREDENTIAL_STORE failed:', err)
        throw err
      }
    }
  )

  ipcMain.handle(IPC.CREDENTIAL_RETRIEVE, (_event, connectionId: string) => {
    try {
      assertNonEmptyString(connectionId, 'connectionId')
      return retrieveCredential(connectionId)
    } catch (err) {
      log.error('[IPC] CREDENTIAL_RETRIEVE failed:', err)
      throw err
    }
  })

  ipcMain.handle(IPC.CREDENTIAL_DELETE, (_event, connectionId: string) => {
    try {
      assertNonEmptyString(connectionId, 'connectionId')
      deleteCredential(connectionId)
    } catch (err) {
      log.error('[IPC] CREDENTIAL_DELETE failed:', err)
      throw err
    }
  })
}
