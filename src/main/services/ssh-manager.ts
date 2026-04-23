import { Client, type ClientChannel, type ConnectConfig } from 'ssh2'
import { readFileSync } from 'fs'
import { BrowserWindow } from 'electron'
import { IPC } from '@shared/constants'
import type { SessionStatus } from '@shared/types/terminal'
import { getDatabase } from './database'
import { retrieveCredential } from './credential-store'

interface SshSession {
  id: string
  connectionId: string
  client: Client
  shell: ClientChannel | null
  status: SessionStatus
  reconnectAttempts: number
  reconnectTimer: ReturnType<typeof setTimeout> | null
}

class SshManager {
  private sessions = new Map<string, SshSession>()

  private emitToRenderer(channel: string, data: any): void {
    const windows = BrowserWindow.getAllWindows()
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, data)
      }
    }
  }

  private setStatus(session: SshSession, status: SessionStatus): void {
    session.status = status
    this.emitToRenderer(IPC.SSH_ON_STATUS, {
      sessionId: session.id,
      status
    })
  }

  async connect(sessionId: string, connectionId: string): Promise<{ success: boolean; error?: string }> {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM connections WHERE id = ?').get(connectionId) as any
    if (!row) {
      return { success: false, error: 'Connection not found' }
    }

    const client = new Client()

    const session: SshSession = {
      id: sessionId,
      connectionId,
      client,
      shell: null,
      status: 'connecting',
      reconnectAttempts: 0,
      reconnectTimer: null
    }

    this.sessions.set(sessionId, session)
    this.setStatus(session, 'connecting')

    return new Promise((resolve) => {
      const connectConfig: ConnectConfig = {
        host: row.host,
        port: row.port,
        username: row.username,
        keepaliveInterval: 10000,
        keepaliveCountMax: 3,
        readyTimeout: 30000
      }

      // Set up auth
      const credential = retrieveCredential(connectionId)

      if (row.auth_type === 'password') {
        connectConfig.password = credential || undefined
      } else if (row.auth_type === 'key' || row.auth_type === 'key+passphrase') {
        try {
          const keyPath = row.private_key_path.replace(/^~/, process.env.HOME || '')
          connectConfig.privateKey = readFileSync(keyPath)
          if (row.auth_type === 'key+passphrase' && credential) {
            connectConfig.passphrase = credential
          }
        } catch (err: any) {
          this.sessions.delete(sessionId)
          return resolve({ success: false, error: `Failed to read key: ${err.message}` })
        }
      }

      client.on('ready', () => {
        session.reconnectAttempts = 0
        this.setStatus(session, 'connected')

        // Update last_connected_at
        db.prepare('UPDATE connections SET last_connected_at = ? WHERE id = ?').run(
          Math.floor(Date.now() / 1000),
          connectionId
        )

        client.shell(
          { term: 'xterm-256color', cols: 80, rows: 24 },
          (err, stream) => {
            if (err) {
              resolve({ success: false, error: err.message })
              return
            }

            session.shell = stream

            stream.on('data', (data: Buffer) => {
              this.emitToRenderer(IPC.SSH_ON_DATA, {
                sessionId,
                data: data.toString('utf-8')
              })
            })

            stream.on('close', () => {
              this.handleDisconnect(sessionId)
            })

            stream.stderr.on('data', (data: Buffer) => {
              this.emitToRenderer(IPC.SSH_ON_DATA, {
                sessionId,
                data: data.toString('utf-8')
              })
            })

            // Run startup command if configured
            if (row.startup_command) {
              stream.write(row.startup_command + '\n')
            }

            resolve({ success: true })
          }
        )
      })

      client.on('error', (err) => {
        this.emitToRenderer(IPC.SSH_ON_ERROR, {
          sessionId,
          error: err.message
        })

        if (session.status === 'connecting') {
          this.sessions.delete(sessionId)
          resolve({ success: false, error: err.message })
        } else {
          this.handleDisconnect(sessionId)
        }
      })

      client.on('close', () => {
        if (session.status === 'connected') {
          this.handleDisconnect(sessionId)
        }
      })

      client.connect(connectConfig)
    })
  }

  private handleDisconnect(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    if (session.status === 'disconnected') return

    this.setStatus(session, 'disconnected')
    this.emitToRenderer(IPC.SSH_ON_CLOSE, { sessionId })

    // Auto-reconnect
    this.attemptReconnect(sessionId)
  }

  private attemptReconnect(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const maxAttempts = 5
    if (session.reconnectAttempts >= maxAttempts) {
      this.setStatus(session, 'error')
      return
    }

    session.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, session.reconnectAttempts - 1), 30000)

    this.setStatus(session, 'reconnecting')

    session.reconnectTimer = setTimeout(async () => {
      const sess = this.sessions.get(sessionId)
      if (!sess || sess.status === 'connected') return

      // Clean up old client
      try {
        sess.client.end()
      } catch {}

      // Create new client for reconnect
      const newClient = new Client()
      sess.client = newClient

      this.sessions.delete(sessionId)
      const result = await this.connect(sessionId, sess.connectionId)

      if (!result.success) {
        this.attemptReconnect(sessionId)
      }
    }, delay)
  }

  sendData(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId)
    if (session?.shell) {
      session.shell.write(data)
    }
  }

  resize(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId)
    if (session?.shell) {
      session.shell.setWindow(rows, cols, rows * 16, cols * 8)
    }
  }

  disconnect(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    if (session.reconnectTimer) {
      clearTimeout(session.reconnectTimer)
    }

    try {
      session.shell?.close()
      session.client.end()
    } catch {}

    session.status = 'disconnected'
    this.sessions.delete(sessionId)
  }

  getSession(sessionId: string): SshSession | undefined {
    return this.sessions.get(sessionId)
  }

  disconnectAll(): void {
    for (const sessionId of this.sessions.keys()) {
      this.disconnect(sessionId)
    }
  }
}

export const sshManager = new SshManager()
