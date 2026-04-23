import { safeStorage } from 'electron'
import { getDatabase } from './database'

// Store credentials in a dedicated SQLite table with encrypted values
function ensureTable(): void {
  const db = getDatabase()
  db.exec(`
    CREATE TABLE IF NOT EXISTS credentials (
      connection_id TEXT PRIMARY KEY,
      encrypted_data BLOB NOT NULL
    )
  `)
}

export function storeCredential(connectionId: string, secret: string): void {
  ensureTable()
  const db = getDatabase()

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption is not available on this system')
  }

  const encrypted = safeStorage.encryptString(secret)

  db.prepare(
    'INSERT OR REPLACE INTO credentials (connection_id, encrypted_data) VALUES (?, ?)'
  ).run(connectionId, encrypted)
}

export function retrieveCredential(connectionId: string): string | null {
  ensureTable()
  const db = getDatabase()

  const row = db
    .prepare('SELECT encrypted_data FROM credentials WHERE connection_id = ?')
    .get(connectionId) as { encrypted_data: Buffer } | undefined

  if (!row) return null

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption is not available on this system')
  }

  return safeStorage.decryptString(Buffer.from(row.encrypted_data))
}

export function deleteCredential(connectionId: string): void {
  ensureTable()
  const db = getDatabase()
  db.prepare('DELETE FROM credentials WHERE connection_id = ?').run(connectionId)
}
