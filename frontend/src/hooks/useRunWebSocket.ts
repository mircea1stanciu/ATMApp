import { useEffect, useMemo, useState } from 'react'
import type { WsRunMessage } from '@/types/domain'

interface UseRunWebSocketOptions {
  runId: string | null
  enabled: boolean
}

export function useRunWebSocket({ runId, enabled }: UseRunWebSocketOptions) {
  const [messages, setMessages] = useState<WsRunMessage[]>([])
  const [connected, setConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !runId) {
      setConnected(false)
      return
    }

    const explicitBase = import.meta.env.VITE_WS_BASE_URL as string | undefined
    const defaultBase = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8000`
    const base = explicitBase || defaultBase
    const socket = new WebSocket(`${base}/api/v1/runs/ws/${runId}`)

    socket.onopen = () => {
      setConnected(true)
      setConnectionError(null)
    }

    socket.onclose = () => {
      setConnected(false)
    }

    socket.onerror = () => {
      setConnectionError('WebSocket connection failed.')
      setConnected(false)
    }

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as WsRunMessage
        setMessages((prev) => {
          const next = [
            ...prev,
            {
              ...payload,
              timestamp: new Date().toISOString(),
            },
          ]
          return next.slice(-300)
        })
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            type: 'raw',
            data: event.data,
            timestamp: new Date().toISOString(),
          },
        ])
      }
    }

    const ping = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send('ping')
      }
    }, 15000)

    return () => {
      window.clearInterval(ping)
      socket.close()
      setConnected(false)
    }
  }, [enabled, runId])

  const groupedText = useMemo(() => {
    return messages
      .map((message) => {
        const time = message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''
        const data = message.data || message.status || ''
        return `[${time}] ${message.type.toUpperCase()}: ${data}`
      })
      .join('\n')
  }, [messages])

  return {
    messages,
    groupedText,
    connected,
    connectionError,
    clearMessages: () => setMessages([]),
  }
}
