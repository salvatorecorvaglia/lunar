import { ipcMain } from 'electron'
import { IPC } from '@shared/constants'
import {
  storeCredential,
  retrieveCredential,
  deleteCredential
} from '../services/credential-store'

export function registerCredentialHandlers(): void {
  ipcMain.handle(
    IPC.CREDENTIAL_STORE,
    (_event, { connectionId, secret }: { connectionId: string; secret: string }) => {
      storeCredential(connectionId, secret)
    }
  )

  ipcMain.handle(IPC.CREDENTIAL_RETRIEVE, (_event, connectionId: string) => {
    return retrieveCredential(connectionId)
  })

  ipcMain.handle(IPC.CREDENTIAL_DELETE, (_event, connectionId: string) => {
    deleteCredential(connectionId)
  })
}
