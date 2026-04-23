import { ipcMain } from 'electron'
import { IPC } from '@shared/constants'
import { checkForUpdate, installUpdate } from '../services/updater'

export function registerAppHandlers(): void {
  ipcMain.handle(IPC.APP_CHECK_UPDATE, () => {
    return checkForUpdate()
  })

  ipcMain.handle(IPC.APP_INSTALL_UPDATE, () => {
    installUpdate()
  })
}
