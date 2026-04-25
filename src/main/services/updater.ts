import { autoUpdater } from 'electron-updater'
import { emitToRenderer } from './emit'
import log from '../lib/logger'

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
    log.error('[Updater] Error:', err.message)
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
  autoUpdater
    .downloadUpdate()
    .then(() => {
      autoUpdater.quitAndInstall(false, true)
    })
    .catch((err) => {
      log.error('[Updater] Failed to download update:', err.message)
      notifyRenderer('update-error', { error: err.message })
    })
}

function notifyRenderer(event: string, data: unknown): void {
  emitToRenderer(`app:${event}`, data)
}
