import { useState, useEffect } from 'react'
import { Minus, Square, X, Copy, Moon, Sun, Terminal, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const { theme, setTheme, activeView, setActiveView } = useUIStore()

  useEffect(() => {
    const checkMaximized = async () => {
      const maximized = await window.api.window.isMaximized()
      setIsMaximized(maximized)
    }
    checkMaximized()
  }, [])

  const handleMinimize = () => window.api.window.minimize()
  const handleMaximize = async () => {
    await window.api.window.maximize()
    const maximized = await window.api.window.isMaximized()
    setIsMaximized(maximized)
  }
  const handleClose = () => window.api.window.close()

  return (
    <div className="drag-region flex h-11 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-3 no-select">
      {/* Left: App name + view switcher */}
      <div className="no-drag flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-gradient-to-br from-blue-500 to-violet-600" />
          <span className="text-sm font-semibold tracking-tight text-foreground">Lunar</span>
        </div>

        <div className="ml-2 flex items-center rounded-lg bg-muted p-0.5">
          <button
            onClick={() => setActiveView('terminal')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all',
              activeView === 'terminal'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Terminal className="h-3.5 w-3.5" />
            Terminal
          </button>
          <button
            onClick={() => setActiveView('sftp')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all',
              activeView === 'sftp'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            SFTP
          </button>
        </div>
      </div>

      {/* Center: drag region (implicit) */}
      <div className="flex-1" />

      {/* Right: theme toggle + window controls */}
      <div className="no-drag flex items-center gap-1">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>

        <div className="mx-1 h-4 w-px bg-border" />

        <button
          onClick={handleMinimize}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {isMaximized ? <Copy className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={handleClose}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
