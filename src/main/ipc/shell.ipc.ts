import { ipcMain, dialog } from 'electron'
import { readdir, stat, lstat, writeFile } from 'fs/promises'
import { join, basename } from 'path'
import { homedir } from 'os'
import { IPC } from '@shared/constants'
import type { LocalFileEntry } from '@shared/types/sftp'

export function registerShellHandlers(): void {
  ipcMain.handle(IPC.SHELL_READDIR, async (_event, dirPath: string) => {
    const entries = await readdir(dirPath, { withFileTypes: true })
    const results: LocalFileEntry[] = []

    for (const entry of entries) {
      // Skip hidden files starting with .
      const fullPath = join(dirPath, entry.name)
      try {
        const stats = await (entry.isSymbolicLink() ? stat(fullPath) : lstat(fullPath))
        results.push({
          name: entry.name,
          path: fullPath,
          size: stats.size,
          modifiedAt: Math.floor(stats.mtimeMs / 1000),
          isDirectory: stats.isDirectory(),
          isSymlink: entry.isSymbolicLink()
        })
      } catch {
        // Skip files we can't stat (permission errors, broken symlinks)
      }
    }

    return results.sort((a, b) => {
      // Directories first, then alphabetical
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  })

  ipcMain.handle(IPC.SHELL_HOME_DIR, () => {
    return homedir()
  })

  ipcMain.handle(
    IPC.SHELL_OPEN_FILE_DIALOG,
    async (_event, options?: { filters?: { name: string; extensions: string[] }[] }) => {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: options?.filters
      })

      if (result.canceled || result.filePaths.length === 0) {
        return null
      }

      return result.filePaths[0]
    }
  )

  ipcMain.handle(
    IPC.SHELL_SAVE_FILE_DIALOG,
    async (
      _event,
      options: {
        defaultPath?: string
        filters?: { name: string; extensions: string[] }[]
        content: string
      }
    ) => {
      const result = await dialog.showSaveDialog({
        defaultPath: options.defaultPath,
        filters: options.filters
      })

      if (result.canceled || !result.filePath) return null

      await writeFile(result.filePath, options.content, 'utf-8')
      return result.filePath
    }
  )

  ipcMain.handle(
    IPC.SHELL_JOIN_PATH,
    (_event, { base, fileName }: { base: string; fileName: string }) => {
      // Sanitize: use only the basename to prevent path traversal
      const safeName = basename(fileName)
      return join(base, safeName)
    }
  )
}
