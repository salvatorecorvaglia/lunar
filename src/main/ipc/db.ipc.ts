import { ipcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { IPC } from '@shared/constants'
import { getDatabase, type ConnectionRow } from '../services/database'
import type {
  Connection,
  CreateConnectionInput,
  UpdateConnectionInput
} from '@shared/types/connection'
import { storeCredential, deleteCredential } from '../services/credential-store'

function rowToConnection(row: ConnectionRow): Connection {
  return {
    id: row.id,
    name: row.name,
    host: row.host,
    port: row.port,
    username: row.username,
    authType: row.auth_type,
    privateKeyPath: row.private_key_path || undefined,
    folder: row.folder,
    colorTag: row.color_tag || undefined,
    startupCommand: row.startup_command || undefined,
    lastConnectedAt: row.last_connected_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function registerDbHandlers(): void {
  const db = getDatabase()

  ipcMain.handle(IPC.CONNECTION_LIST, () => {
    const rows = db.prepare('SELECT * FROM connections ORDER BY name ASC').all() as ConnectionRow[]
    return rows.map(rowToConnection)
  })

  ipcMain.handle(IPC.CONNECTION_GET, (_event, id: string) => {
    const row = db.prepare('SELECT * FROM connections WHERE id = ?').get(id) as
      | ConnectionRow
      | undefined
    return row ? rowToConnection(row) : null
  })

  ipcMain.handle(IPC.CONNECTION_CREATE, (_event, input: CreateConnectionInput) => {
    // Validate required fields
    if (!input.name?.trim()) throw new Error('Connection name is required')
    if (!input.host?.trim()) throw new Error('Host is required')
    if (!input.username?.trim()) throw new Error('Username is required')
    if (typeof input.port !== 'number' || input.port < 1 || input.port > 65535) {
      throw new Error('Port must be between 1 and 65535')
    }

    const id = uuidv4()
    const now = Math.floor(Date.now() / 1000)

    db.prepare(
      `
      INSERT INTO connections (id, name, host, port, username, auth_type, private_key_path, folder, color_tag, startup_command, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      id,
      input.name,
      input.host,
      input.port,
      input.username,
      input.authType,
      input.privateKeyPath || null,
      input.folder || 'default',
      input.colorTag || null,
      input.startupCommand || null,
      now,
      now
    )

    // Store password/passphrase if provided
    if (input.password) {
      storeCredential(id, input.password)
    } else if (input.passphrase) {
      storeCredential(id, input.passphrase)
    }

    const row = db.prepare('SELECT * FROM connections WHERE id = ?').get(id) as ConnectionRow
    return rowToConnection(row)
  })

  ipcMain.handle(IPC.CONNECTION_UPDATE, (_event, input: UpdateConnectionInput) => {
    const now = Math.floor(Date.now() / 1000)
    const existing = db.prepare('SELECT * FROM connections WHERE id = ?').get(input.id) as
      | ConnectionRow
      | undefined

    if (!existing) {
      throw new Error(`Connection not found: ${input.id}`)
    }

    const fields: string[] = ['updated_at = ?']
    const values: (string | number | null)[] = [now]

    if (input.name !== undefined) {
      fields.push('name = ?')
      values.push(input.name)
    }
    if (input.host !== undefined) {
      fields.push('host = ?')
      values.push(input.host)
    }
    if (input.port !== undefined) {
      fields.push('port = ?')
      values.push(input.port)
    }
    if (input.username !== undefined) {
      fields.push('username = ?')
      values.push(input.username)
    }
    if (input.authType !== undefined) {
      fields.push('auth_type = ?')
      values.push(input.authType)
    }
    if (input.privateKeyPath !== undefined) {
      fields.push('private_key_path = ?')
      values.push(input.privateKeyPath || null)
    }
    if (input.folder !== undefined) {
      fields.push('folder = ?')
      values.push(input.folder)
    }
    if (input.colorTag !== undefined) {
      fields.push('color_tag = ?')
      values.push(input.colorTag || null)
    }
    if (input.startupCommand !== undefined) {
      fields.push('startup_command = ?')
      values.push(input.startupCommand || null)
    }

    values.push(input.id)

    db.prepare(`UPDATE connections SET ${fields.join(', ')} WHERE id = ?`).run(...values)

    // Update credential if provided
    if (input.password) {
      storeCredential(input.id, input.password)
    } else if (input.passphrase) {
      storeCredential(input.id, input.passphrase)
    }

    const row = db.prepare('SELECT * FROM connections WHERE id = ?').get(input.id) as ConnectionRow
    return rowToConnection(row)
  })

  ipcMain.handle(IPC.CONNECTION_DELETE, (_event, id: string) => {
    db.prepare('DELETE FROM connections WHERE id = ?').run(id)
    deleteCredential(id)
  })

  // Settings
  ipcMain.handle(IPC.SETTINGS_GET, (_event, key: string) => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
      | { value: string }
      | undefined
    return row?.value ?? null
  })

  ipcMain.handle(IPC.SETTINGS_SET, (_event, { key, value }: { key: string; value: string }) => {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
  })

  ipcMain.handle(IPC.SETTINGS_GET_ALL, () => {
    const rows = db.prepare('SELECT key, value FROM settings').all() as {
      key: string
      value: string
    }[]
    const settings: Record<string, unknown> = {}
    for (const row of rows) {
      try {
        settings[row.key] = JSON.parse(row.value)
      } catch {
        settings[row.key] = row.value
      }
    }
    return settings
  })
}
