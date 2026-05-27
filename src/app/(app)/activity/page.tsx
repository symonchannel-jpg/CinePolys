"use client"

import { useProject } from "@/lib/project-context"
import { useQuery } from "@tanstack/react-query"

const actionLabels: Record<string, string> = {
  CREATED: "creó",
  UPDATED: "actualizó",
  ARCHIVED: "archivó",
  STATUS_CHANGED: "cambió el estado de",
  PRIORITY_CHANGED: "cambió la prioridad de",
  ASSIGNED: "asignó",
  COMMENTED: "comentó en",
  COMMENT_DELETED: "eliminó un comentario en",
  VERSION_ADDED: "agregó versión de",
  BREAKDOWN_ADDED: "agregó elemento a",
  BREAKDOWN_UPDATED: "actualizó elemento de",
}

const actionIcons: Record<string, string> = {
  CREATED: "➕",
  UPDATED: "✏️",
  ARCHIVED: "🗑️",
  STATUS_CHANGED: "🔄",
  PRIORITY_CHANGED: "⚡",
  ASSIGNED: "👤",
  COMMENTED: "💬",
  COMMENT_DELETED: "🗑️",
  VERSION_ADDED: "📚",
  BREAKDOWN_ADDED: "📋",
  BREAKDOWN_UPDATED: "📝",
}

const entityTypeLabels: Record<string, string> = {
  task: "la tarea",
  script: "el guion",
  casting: "el actor",
  location: "la locación",
  vfx: "el plano VFX",
  dailies: "el llamado",
}

function getEntityTitle(act: any) {
  if (act.task) return act.task.title
  if (act.script) return act.script.title
  if (act.casting) return act.casting.name
  if (act.location) return act.location.name
  if (act.vfxShot) return act.vfxShot.shotId
  if (act.callSheet) return `Llamado ${new Date(act.callSheet.date).toLocaleDateString()}`
  return null
}

function getEntityType(act: any) {
  if (act.taskId) return "task"
  if (act.scriptId) return "script"
  if (act.castingId) return "casting"
  if (act.locationId) return "location"
  if (act.vfxShotId) return "vfx"
  if (act.callSheetId) return "dailies"
  return null
}

export default function ActivityPage() {
  const { currentProjectId, currentProject } = useProject()

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activity", currentProjectId],
    queryFn: () =>
      currentProjectId
        ? fetch(`/api/projects/${currentProjectId}/activity`).then((r) => r.json())
        : [],
    enabled: !!currentProjectId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  if (!currentProjectId) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Selecciona un proyecto para ver la actividad
      </div>
    )
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Actividad del proyecto</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {currentProject?.name} · {activities.length} eventos
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">Sin actividad registrada</p>
          <p className="text-sm">Los cambios aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((act: any) => {
            const entityType = getEntityType(act)
            const entityTitle = getEntityTitle(act)
            const entityLabel = entityType ? entityTypeLabels[entityType] || "" : ""

            const details = (() => {
              try {
                if (!act.details) return null
                const d = JSON.parse(act.details)
                if (act.action === "STATUS_CHANGED") return `${d.from || "?"} → ${d.to}`
                if (act.action === "PRIORITY_CHANGED") return `${d.from || "?"} → ${d.to}`
                if (d.fields) return `(${d.fields.join(", ")})`
                return null
              } catch {
                return null
              }
            })()

            return (
              <div key={act.id} className="flex gap-3 rounded-lg border border-border bg-card p-4 animate-jelly">
                <div className="text-lg shrink-0 mt-0.5">
                  {actionIcons[act.action] || "ℹ️"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-medium text-foreground">{act.user.name}</span>{" "}
                      <span className="text-muted-foreground">{actionLabels[act.action] || act.action}</span>{" "}
                      {entityLabel && <span className="text-muted-foreground">{entityLabel}</span>}{" "}
                      {entityTitle && (
                        <span className="text-primary font-medium">{entityTitle}</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{timeAgo(act.createdAt)}</span>
                  </div>
                  {details && (
                    <p className="text-xs text-muted-foreground/70 mt-1">{details}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
