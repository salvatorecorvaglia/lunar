import { useState, useRef, useCallback } from 'react'
import type { PaneNode } from '@shared/types/terminal'
import { TerminalPane } from './TerminalPane'

interface SplitPaneProps {
  node: PaneNode
}

export function SplitPane({ node }: SplitPaneProps) {
  if (node.type === 'terminal') {
    return <TerminalPane sessionId={node.sessionId} />
  }

  return <SplitContainer node={node} />
}

function SplitContainer({
  node
}: {
  node: Extract<PaneNode, { type: 'split' }>
}) {
  const [ratio, setRatio] = useState(node.ratio)
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const isHorizontal = node.direction === 'horizontal'

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isDragging.current = true
      setDragging(true)

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const newRatio = isHorizontal
          ? (e.clientX - rect.left) / rect.width
          : (e.clientY - rect.top) / rect.height

        setRatio(Math.max(0.15, Math.min(0.85, newRatio)))
      }

      const onMouseUp = () => {
        isDragging.current = false
        setDragging(false)
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [isHorizontal]
  )

  return (
    <div
      ref={containerRef}
      className={`flex h-full w-full ${isHorizontal ? 'flex-row' : 'flex-col'}`}
    >
      <div
        style={{
          [isHorizontal ? 'width' : 'height']: `${ratio * 100}%`,
          overflow: 'hidden'
        }}
      >
        <SplitPane node={node.children[0]} />
      </div>

      {/* Divider with wider hit area */}
      <div
        className={`relative flex-shrink-0 ${
          isHorizontal ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize'
        }`}
      >
        {/* Visual line */}
        <div
          className={`absolute inset-0 bg-white/[0.08] ${
            dragging ? 'bg-primary/60' : 'hover:bg-primary/40'
          }`}
          style={{ transition: 'background-color 150ms' }}
        />
        {/* Invisible hit area */}
        <div
          onMouseDown={handleMouseDown}
          className={`absolute ${
            isHorizontal
              ? '-left-1.5 -right-1.5 inset-y-0 cursor-col-resize'
              : '-top-1.5 -bottom-1.5 inset-x-0 cursor-row-resize'
          }`}
        />
      </div>

      <div
        style={{
          [isHorizontal ? 'width' : 'height']: `${(1 - ratio) * 100}%`,
          overflow: 'hidden'
        }}
      >
        <SplitPane node={node.children[1]} />
      </div>
    </div>
  )
}
