import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (db) return db

  const userDataPath = app.getPath('userData')
  const dbDir = join(userDataPath, 'data')

  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }

  const dbPath = join(dbDir, 'lunar.db')
  db = new Database(dbPath)

  // Enable WAL mode for better concurrent performance
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  runMigrations(db)

  return db
}

function runMigrations(db: Database.Database): void {
  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `)

  const migrations = getMigrations()
  const applied = new Set(
    db
      .prepare('SELECT name FROM _migrations')
      .all()
      .map((row: any) => row.name)
  )

  const insertMigration = db.prepare('INSERT INTO _migrations (name) VALUES (?)')

  for (const migration of migrations) {
    if (applied.has(migration.name)) continue

    const transaction = db.transaction(() => {
      db!.exec(migration.sql)
      insertMigration.run(migration.name)
    })
    transaction()
    console.log(`[DB] Applied migration: ${migration.name}`)
  }
}

function getMigrations(): { name: string; sql: string }[] {
  return [
    {
      name: '001_connections',
      sql: `
        CREATE TABLE IF NOT EXISTS connections (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          host TEXT NOT NULL,
          port INTEGER NOT NULL DEFAULT 22,
          username TEXT NOT NULL,
          auth_type TEXT NOT NULL CHECK (auth_type IN ('password', 'key', 'key+passphrase')),
          private_key_path TEXT,
          folder TEXT NOT NULL DEFAULT 'default',
          color_tag TEXT,
          startup_command TEXT,
          last_connected_at INTEGER,
          created_at INTEGER NOT NULL DEFAULT (unixepoch()),
          updated_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
      `
    },
    {
      name: '002_settings',
      sql: `
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        INSERT OR IGNORE INTO settings (key, value) VALUES
          ('theme', '"dark"'),
          ('terminal.fontFamily', '"JetBrains Mono, Menlo, Consolas, monospace"'),
          ('terminal.fontSize', '14'),
          ('terminal.theme', '"dracula"'),
          ('terminal.scrollback', '10000'),
          ('transfer.concurrency', '3'),
          ('ssh.autoReconnect', 'true'),
          ('ssh.keepAliveInterval', '10000'),
          ('ssh.maxReconnectAttempts', '5');
      `
    },
    {
      name: '003_history',
      sql: `
        CREATE TABLE IF NOT EXISTS connection_history (
          id TEXT PRIMARY KEY,
          connection_id TEXT NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
          connected_at INTEGER NOT NULL DEFAULT (unixepoch()),
          disconnected_at INTEGER,
          duration_secs INTEGER,
          error TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_history_connection ON connection_history(connection_id);
        CREATE INDEX IF NOT EXISTS idx_history_connected ON connection_history(connected_at DESC);
      `
    }
  ]
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
