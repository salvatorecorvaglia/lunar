import type { SFTPWrapper } from 'ssh2'
import { sshManager } from './ssh-manager'
import type { SftpEntry } from '@shared/types/sftp'
import { transferQueue } from './transfer-queue'

type StepCallback = (transferred: number, chunk: number, total: number) => void

class SftpManager {
  private sftpSessions = new Map<string, SFTPWrapper>()

  async getSftp(sessionId: string): Promise<SFTPWrapper> {
    const existing = this.sftpSessions.get(sessionId)
    if (existing) return existing

    const session = sshManager.getSession(sessionId)
    if (!session) {
      throw new Error('SSH session not found')
    }

    return new Promise<SFTPWrapper>((resolve, reject) => {
      session.client.sftp((err, sftp) => {
        if (err) return reject(err)
        this.sftpSessions.set(sessionId, sftp)

        sftp.on('close', () => {
          this.sftpSessions.delete(sessionId)
        })

        resolve(sftp)
      })
    })
  }

  async list(sessionId: string, remotePath: string): Promise<SftpEntry[]> {
    const sftp = await this.getSftp(sessionId)

    return new Promise((resolve, reject) => {
      sftp.readdir(remotePath, (err, list) => {
        if (err) return reject(err)

        const entries: SftpEntry[] = list.map((item) => {
          const isDir = (item.attrs.mode & 0o40000) !== 0
          const isLink = (item.attrs.mode & 0o120000) === 0o120000
          const perms = this.formatPermissions(item.attrs.mode)

          return {
            name: item.filename,
            path: remotePath === '/' ? `/${item.filename}` : `${remotePath}/${item.filename}`,
            size: item.attrs.size,
            modifiedAt: item.attrs.mtime,
            isDirectory: isDir,
            isSymlink: isLink,
            permissions: perms,
            owner: item.attrs.uid,
            group: item.attrs.gid
          }
        })

        entries.sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
          return a.name.localeCompare(b.name)
        })

        resolve(entries)
      })
    })
  }

  async mkdir(sessionId: string, remotePath: string): Promise<void> {
    const sftp = await this.getSftp(sessionId)
    return new Promise((resolve, reject) => {
      sftp.mkdir(remotePath, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  async rename(sessionId: string, oldPath: string, newPath: string): Promise<void> {
    const sftp = await this.getSftp(sessionId)
    return new Promise((resolve, reject) => {
      sftp.rename(oldPath, newPath, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  async remove(sessionId: string, remotePath: string, isDirectory: boolean): Promise<void> {
    const sftp = await this.getSftp(sessionId)
    return new Promise((resolve, reject) => {
      if (isDirectory) {
        sftp.rmdir(remotePath, (err) => {
          if (err) return reject(err)
          resolve()
        })
      } else {
        sftp.unlink(remotePath, (err) => {
          if (err) return reject(err)
          resolve()
        })
      }
    })
  }

  async readFile(sessionId: string, remotePath: string, maxSize?: number): Promise<string> {
    const sftp = await this.getSftp(sessionId)
    const limit = maxSize || 5 * 1024 * 1024

    return new Promise((resolve, reject) => {
      sftp.stat(remotePath, (err, stats) => {
        if (err) return reject(err)
        if (stats.size > limit) {
          return reject(new Error(`File too large: ${stats.size} bytes (max: ${limit})`))
        }

        const chunks: Buffer[] = []
        const stream = sftp.createReadStream(remotePath)

        stream.on('data', (chunk: Buffer) => chunks.push(chunk))
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
        stream.on('error', reject)
      })
    })
  }

  /** Get remote file size. Used by transfer-queue to report progress totals. */
  async statSize(sessionId: string, remotePath: string): Promise<number> {
    const sftp = await this.getSftp(sessionId)
    return new Promise((resolve, reject) => {
      sftp.stat(remotePath, (err, stats) => {
        if (err) return reject(err)
        resolve(stats.size)
      })
    })
  }

  /**
   * Low-level download used by transfer-queue.
   * Caller provides a step callback for progress tracking.
   */
  async fastDownload(
    sessionId: string,
    remotePath: string,
    localPath: string,
    onStep: StepCallback
  ): Promise<void> {
    const sftp = await this.getSftp(sessionId)
    return new Promise((resolve, reject) => {
      sftp.fastGet(remotePath, localPath, { step: onStep }, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  /**
   * Low-level upload used by transfer-queue.
   * Caller provides a step callback for progress tracking.
   */
  async fastUpload(
    sessionId: string,
    localPath: string,
    remotePath: string,
    onStep: StepCallback
  ): Promise<void> {
    const sftp = await this.getSftp(sessionId)
    return new Promise((resolve, reject) => {
      sftp.fastPut(localPath, remotePath, { step: onStep }, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  /**
   * Enqueue a download via the transfer queue (max N concurrent).
   * Returns the transfer ID for tracking.
   */
  async download(sessionId: string, remotePath: string, localPath: string): Promise<string> {
    return transferQueue.enqueue('download', sessionId, localPath, remotePath)
  }

  /**
   * Enqueue an upload via the transfer queue (max N concurrent).
   * Returns the transfer ID for tracking.
   */
  async upload(sessionId: string, localPath: string, remotePath: string): Promise<string> {
    return transferQueue.enqueue('upload', sessionId, localPath, remotePath)
  }

  closeSftp(sessionId: string): void {
    const sftp = this.sftpSessions.get(sessionId)
    if (sftp) {
      sftp.end()
      this.sftpSessions.delete(sessionId)
    }
  }

  private formatPermissions(mode: number): string {
    const chars = 'rwxrwxrwx'
    let result = ''
    for (let i = 0; i < 9; i++) {
      result += mode & (1 << (8 - i)) ? chars[i] : '-'
    }
    return result
  }
}

export const sftpManager = new SftpManager()
