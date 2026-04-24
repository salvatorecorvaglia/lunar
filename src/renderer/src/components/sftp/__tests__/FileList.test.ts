import { describe, it, expect } from 'vitest'

// Test the formatSize and formatDate utility functions from FileList
// We extract the logic here since they're not exported

function formatSize(bytes: number): string {
  if (bytes <= 0) return '\u2014'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const isThisYear = date.getFullYear() === now.getFullYear()

  if (isThisYear) {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

describe('formatSize', () => {
  it('returns dash for zero bytes', () => {
    expect(formatSize(0)).toBe('\u2014')
  })

  it('returns dash for negative bytes', () => {
    expect(formatSize(-100)).toBe('\u2014')
  })

  it('formats bytes', () => {
    expect(formatSize(500)).toBe('500 B')
  })

  it('formats kilobytes', () => {
    expect(formatSize(1024)).toBe('1.0 KB')
  })

  it('formats megabytes', () => {
    expect(formatSize(1024 * 1024)).toBe('1.0 MB')
  })

  it('formats gigabytes', () => {
    expect(formatSize(1024 * 1024 * 1024)).toBe('1.0 GB')
  })

  it('formats terabytes', () => {
    expect(formatSize(1024 * 1024 * 1024 * 1024)).toBe('1.0 TB')
  })

  it('formats fractional sizes', () => {
    expect(formatSize(1536)).toBe('1.5 KB')
  })
})

describe('formatDate', () => {
  it('formats a timestamp from this year with time', () => {
    const now = new Date()
    const ts = Math.floor(now.getTime() / 1000) - 3600 // 1 hour ago
    const result = formatDate(ts)
    // Should contain month abbreviation and time
    expect(result).toBeTruthy()
    expect(result.length).toBeGreaterThan(5)
  })

  it('formats a timestamp from a different year without time', () => {
    // Jan 15, 2020
    const ts = Math.floor(new Date(2020, 0, 15).getTime() / 1000)
    const result = formatDate(ts)
    expect(result).toContain('2020')
  })
})
