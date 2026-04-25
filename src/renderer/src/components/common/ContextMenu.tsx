import { useEffect, useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  destructive?: boolean
  separator?: boolean
}

interface ContextMenuProps {
  items: ContextMenuItem[]
  children: React.ReactNode
}

export function ContextMenu({ items, children }: ContextMenuProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [focusIndex, setFocusIndex] = useState(0)

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      // Adjust position to stay within viewport
      const x = Math.min(e.clientX, window.innerWidth - 180)
      const y = Math.min(e.clientY, window.innerHeight - items.length * 32 - 8)
      setPosition({ x, y })
      setFocusIndex(0)
    },
    [items.length]
  )

  const close = useCallback(() => setPosition(null), [])

  useEffect(() => {
    if (!position) return

    // Focus first item when menu opens
    requestAnimationFrame(() => {
      const firstItem = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')
      firstItem?.focus()
    })

    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close()
      }
    }
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        return
      }

      const menuItems = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')
      if (!menuItems || menuItems.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = (focusIndex + 1) % menuItems.length
        setFocusIndex(next)
        menuItems[next]?.focus()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = (focusIndex - 1 + menuItems.length) % menuItems.length
        setFocusIndex(prev)
        menuItems[prev]?.focus()
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [position, close, focusIndex])

  return (
    <>
      <div onContextMenu={handleContextMenu}>{children}</div>
      <AnimatePresence>
        {position && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            role="menu"
            className="fixed z-[70] min-w-[160px] rounded-lg border border-border/80 bg-card p-1 shadow-xl"
            style={{ left: position.x, top: position.y }}
          >
            {items.map((item, i) => (
              <div key={i}>
                {item.separator && <div className="my-1 h-px bg-border/60" role="separator" />}
                <button
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => {
                    item.onClick()
                    close()
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs cursor-pointer outline-none',
                    item.destructive
                      ? 'text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10'
                      : 'text-foreground hover:bg-accent focus-visible:bg-accent'
                  )}
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  {item.label}
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
