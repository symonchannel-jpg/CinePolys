"use client"

import { useEffect, useRef, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { playNotificationSound } from "@/lib/sound"

export function useSSE() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const eventSourceRef = useRef<EventSource | null>(null)
  const prevCountRef = useRef(0)

  const connect = useCallback(() => {
    if (!session?.user) return
    if (eventSourceRef.current?.readyState === EventSource.OPEN) return

    const es = new EventSource("/api/sse")
    eventSourceRef.current = es

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === "notification") {
          queryClient.invalidateQueries({ queryKey: ["notifications"] })

          if (data.unreadCount > prevCountRef.current && prevCountRef.current > 0) {
            playNotificationSound()
          }
          prevCountRef.current = data.unreadCount
        }
      } catch {
        // ignore parse errors
      }
    }

    es.onerror = () => {
      es.close()
      eventSourceRef.current = null
      // Reconnect after 5s
      setTimeout(connect, 5000)
    }
  }, [session?.user, queryClient])

  useEffect(() => {
    connect()
    return () => {
      eventSourceRef.current?.close()
      eventSourceRef.current = null
    }
  }, [connect])
}
