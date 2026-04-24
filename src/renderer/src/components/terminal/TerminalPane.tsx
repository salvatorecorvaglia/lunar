import { useEffect, useRef, useCallback } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { SearchAddon } from '@xterm/addon-search'
import { WebglAddon } from '@xterm/addon-webgl'
import '@xterm/xterm/css/xterm.css'
import { useTerminalStore } from '@/stores/terminal-store'
import { terminalThemes } from '@/themes/terminal'

interface TerminalPaneProps {
  sessionId: string
}

export function TerminalPane({ sessionId }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const terminalTheme = useTerminalStore((s) => s.terminalTheme)

  const handleResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current)
    }
    resizeTimeoutRef.current = setTimeout(() => {
      const fitAddon = fitAddonRef.current
      const terminal = terminalRef.current
      if (fitAddon && terminal) {
        try {
          fitAddon.fit()
          window.api.ssh.resize({
            sessionId,
            cols: terminal.cols,
            rows: terminal.rows
          })
        } catch {}
      }
    }, 100)
  }, [sessionId])

  useEffect(() => {
    if (!containerRef.current) return

    const theme = terminalThemes[terminalTheme]

    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Menlo, Consolas, monospace',
      lineHeight: 1.2,
      letterSpacing: 0,
      scrollback: 10000,
      allowProposedApi: true,
      theme
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()
    const searchAddon = new SearchAddon()

    terminal.loadAddon(fitAddon)
    terminal.loadAddon(webLinksAddon)
    terminal.loadAddon(searchAddon)

    terminal.open(containerRef.current)

    // Try WebGL, fall back to canvas
    try {
      const webglAddon = new WebglAddon()
      webglAddon.onContextLoss(() => {
        webglAddon.dispose()
      })
      terminal.loadAddon(webglAddon)
    } catch {
      // Canvas renderer is the default fallback
    }

    fitAddon.fit()

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    // Send keystrokes to SSH
    terminal.onData((data) => {
      window.api.ssh.sendData({ sessionId, data })
    })

    // Receive data from SSH
    const cleanupData = window.api.ssh.onData((event) => {
      if (event.sessionId === sessionId) {
        terminal.write(event.data)
      }
    })

    // Handle close
    const cleanupClose = window.api.ssh.onClose((event) => {
      if (event.sessionId === sessionId) {
        terminal.write('\r\n\x1b[31m--- Connection closed ---\x1b[0m\r\n')
      }
    })

    // Handle error
    const cleanupError = window.api.ssh.onError((event) => {
      if (event.sessionId === sessionId) {
        terminal.write(`\r\n\x1b[31m--- Error: ${event.error} ---\x1b[0m\r\n`)
      }
    })

    // ResizeObserver for container size changes
    const observer = new ResizeObserver(handleResize)
    observer.observe(containerRef.current)
    resizeObserverRef.current = observer

    // Initial resize
    setTimeout(() => {
      fitAddon.fit()
      window.api.ssh.resize({
        sessionId,
        cols: terminal.cols,
        rows: terminal.rows
      })
    }, 50)

    return () => {
      cleanupData()
      cleanupClose()
      cleanupError()
      observer.disconnect()
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
      terminal.dispose()
      terminalRef.current = null
      fitAddonRef.current = null
    }
  }, [sessionId, handleResize, terminalTheme])

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden" style={{ padding: '4px' }} />
  )
}
