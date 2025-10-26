'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import PersistentChatSidebar from './PersistentChatSidebar'

interface ResizableChatPanelProps {
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
}

export default function ResizableChatPanel({
  defaultWidth = 420,
  minWidth = 300,
  maxWidth = 800
}: ResizableChatPanelProps) {
  const [width, setWidth] = useState(defaultWidth)
  const [isResizing, setIsResizing] = useState(false)
  const [isDraggingRight, setIsDraggingRight] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const resizeHandleRef = useRef<HTMLDivElement>(null)

  // Load saved width from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('chatPanelWidth')
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10)
      if (parsedWidth >= minWidth && parsedWidth <= maxWidth) {
        setWidth(parsedWidth)
      }
    }
  }, [minWidth, maxWidth])

  // Handle mouse move during resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing && !isDraggingRight) return

    if (isDraggingRight) {
      // Dragging right handle (right side of screen) - expands panel
      const newWidth = width + e.movementX
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth)
      }
    } else {
      // Dragging left handle (left side of screen) - compacts dashboard, expands panel
      const newWidth = width - e.movementX
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth)
      }
    }
  }, [isResizing, isDraggingRight, width, minWidth, maxWidth])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isResizing || isDraggingRight) {
      setIsResizing(false)
      setIsDraggingRight(false)
      // Save width to localStorage
      localStorage.setItem('chatPanelWidth', width.toString())
    }
  }, [isResizing, isDraggingRight, width])

  // Add event listeners
  useEffect(() => {
    if (isResizing || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = 'default'
        document.body.style.userSelect = 'auto'
      }
    }
  }, [isResizing, isDraggingRight, handleMouseMove, handleMouseUp])

  const handleLeftHandleMouseDown = () => {
    setIsResizing(true)
  }

  const handleRightHandleMouseDown = () => {
    setIsDraggingRight(true)
  }

  return (
    <div
      ref={panelRef}
      className="relative flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 h-full overflow-hidden group"
      style={{ width: `${width}px` }}
    >
      {/* Left Resize Handle - Compress dashboard, expand panel */}
      <div
        ref={resizeHandleRef}
        onMouseDown={handleLeftHandleMouseDown}
        className="absolute left-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 dark:hover:bg-blue-400 hover:w-1.5 hover:shadow-lg transition-all opacity-0 group-hover:opacity-100 bg-gray-300 dark:bg-gray-600 z-50"
        title="Drag left to expand messenger"
      />

      {/* Right Resize Handle - Compact panel, expand dashboard */}
      <div
        onMouseDown={handleRightHandleMouseDown}
        className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 dark:hover:bg-blue-400 hover:w-1.5 hover:shadow-lg transition-all opacity-0 group-hover:opacity-100 bg-gray-300 dark:bg-gray-600 z-50"
        title="Drag right to expand dashboard"
      />

      {/* Width Indicator - Shows during resize */}
      {(isResizing || isDraggingRight) && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-500/5 pointer-events-none z-40">
          <div className="bg-blue-600 dark:bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium shadow-lg">
            {width}px
          </div>
        </div>
      )}

      {/* Chat Panel Content */}
      <div className="flex-1 overflow-hidden">
        <PersistentChatSidebar />
      </div>
    </div>
  )
}
