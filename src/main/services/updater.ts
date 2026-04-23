import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'
import { IPC } from '@shared/constants'

let updateAvailable = false
let updateVersion = ''

export function initAutoUpdater(): void {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    updateAvailable = true
    updateVersion = info.version
    notifyRenderer('update-available', { version: info.version })
  })

  autoUpdater.on('update-not-available', () => {
    updateAvailable = false
  })

  autoUpdater.on('download-progress', (progress) => {
    notifyRenderer('update-download-progress', {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond
    })
  })

  autoUpdater.on('update-downloaded', () => {
    notifyRenderer('update-downloaded', {})
  })

  autoUpdater.on('error', (err) => {
    console.error('[Updater] Error:', err.message)
  })

  // Check for updates after a short delay
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {})
  }, 5000)
}

export function checkForUpdate(): { available: boolean; version?: string } {
  autoUpdater.checkForUpdates().catch(() => {})
  return { available: updateAvailable, version: updateVersion || undefined }
}

export function installUpdate(): void {
  autoUpdater.downloadUpdate().then(() => {
    autoUpdater.quitAndInstall(false, true)
  })
}

function notifyRenderer(event: string, data: any): void {
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send(`app:${event}`, data)
    }
  }
}
