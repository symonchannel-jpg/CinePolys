"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { playNotificationSound } from "@/lib/sound"
import { useNotifications, useMarkNotificationsRead, useClearReadNotifications } from "@/lib/api-hooks"
import { useSSE } from "@/lib/sse-hook"

export function NotificationPanel() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useSSE()

  const { data, isLoading } = useNotifications()
  const markRead = useMarkNotificationsRead()
  const clearRead = useClearReadNotifications()

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  function markAllRead() {
    markRead.mutate({ markAll: true })
  }

  function handleClearRead() {
    clearRead.mutate()
  }

  async function handleClickNotification(n: { id: string; link: string | null; read: boolean }) {
    if (!n.read) {
      markRead.mutate({ notificationId: n.id })
    }
    if (n.link) router.push(n.link)
    setOpen(false)
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "ahora"
    if (mins < 60) return `hace ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `hace ${hours}h`
    const days = Math.floor(hours / 24)
    return `hace ${days}d`
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg"
        title="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground animate-jelly">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-popover shadow-xl z-50 overflow-hidden animate-scale-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Notificaciones</span>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[11px] text-primary hover:underline">
                  Leer todas
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={handleClearRead} className="text-[11px] text-muted-foreground hover:text-foreground">
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mb-2 text-muted-foreground/60" />
                <p className="text-sm">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map((n: { id: string; title: string; message: string | null; type: string; link: string | null; read: boolean; createdAt: string }) => (
                <button
                  key={n.id}
                  onClick={() => handleClickNotification(n)}
                  className={`w-full text-left px-4 py-3 transition-colors border-b border-border/50 last:border-0 hover:bg-muted/30 ${
                    !n.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-base shrink-0">
                      {n.type === "task_created" ? "📋" : n.type === "task_assigned" ? "👤" : n.type === "comment" ? "💬" : "ℹ️"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${!n.read ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.message}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
