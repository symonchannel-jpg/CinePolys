"use client"

import { useProject } from "@/lib/project-context"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

export default function ReportsPage() {
  const { currentProjectId } = useProject()

  const { data: schedule, isLoading } = useQuery({
    queryKey: ["schedule", currentProjectId],
    queryFn: async () => {
      const res = await fetch(`/api/schedule?projectId=${currentProjectId}`)
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
    enabled: !!currentProjectId,
  })

  if (!currentProjectId) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Selecciona un proyecto</div>
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 rounded-xl border border-border bg-muted/30" />
        <div className="h-24 rounded-xl border border-border bg-muted/30" />
        <div className="h-24 rounded-xl border border-border bg-muted/30" />
      </div>
    )
  }

  const days = Array.isArray(schedule) ? schedule : []
  const completedDays = days.filter((d: any) => d.status === "COMPLETED").reverse()
  const plannedDays = days.filter((d: any) => d.status === "PLANNED")

  const totalCrewAssignments = days.reduce((acc: number, d: any) => acc + (d.dailyCrew?.length || 0), 0)
  const totalCastAssignments = days.reduce((acc: number, d: any) => acc + (d.dailyCast?.length || 0), 0)
  const totalScenesPlanned = days.reduce((acc: number, d: any) => acc + (d.scenes?.length || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reportes de Producción</h1>
        {completedDays.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {completedDays.length} día{completedDays.length !== 1 ? "s" : ""} completado{completedDays.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Resumen global */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Días de rodaje</p>
          <p className="text-2xl font-bold mt-1">{days.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Completados</p>
          <p className="text-2xl font-bold mt-1 text-success">{completedDays.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Crew asignado</p>
          <p className="text-2xl font-bold mt-1">{totalCrewAssignments}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Escenas totales</p>
          <p className="text-2xl font-bold mt-1">{totalScenesPlanned}</p>
        </div>
      </div>

      {/* Lista de días completados */}
      {completedDays.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground mb-2">No hay días de rodaje completados todavía.</p>
          <p className="text-sm text-muted-foreground/70">
            Programa días en el <Link href="/schedule" className="text-primary hover:underline">Plan de Rodaje</Link> y márcalos como completados para ver reportes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {completedDays.map((day: any) => {
            const d = new Date(day.date)
            const scenes = day.scenes || []
            const cast = day.dailyCast || []
            const crew = day.dailyCrew || []
            const confirmedScenes = scenes.filter((s: any) => s.status === "CONFIRMED")

            // Calculate estimated hours
            let hours = null
            if (day.callTime && day.wrapTime) {
              const callParts = day.callTime.split(":").map(Number)
              const wrapParts = day.wrapTime.split(":").map(Number)
              let diff = (wrapParts[0] * 60 + wrapParts[1]) - (callParts[0] * 60 + callParts[1])
              if (diff < 0) diff += 1440 // Crosses midnight
              hours = Math.round(diff / 6) / 10 // in hours, 1 decimal
            }

            return (
              <div key={day.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between bg-muted/30 px-5 py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-success/10 text-success">
                      <span className="text-xs font-bold">{d.getDate()}</span>
                      <span className="text-[10px] leading-none">{["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][d.getMonth()]}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Día {day.dayNumber}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {day.callTime || "—"} {day.wrapTime ? `→ ${day.wrapTime}` : ""}
                        {hours ? ` (${hours}h)` : ""}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-success/15 text-success">
                    COMPLETADO
                  </span>
                </div>

                {/* Body */}
                <div className="p-5 grid gap-4 sm:grid-cols-3">
                  {/* Scenes */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Escenas</p>
                    {scenes.length === 0 ? (
                      <p className="text-sm text-muted-foreground/60">Sin escenas registradas</p>
                    ) : (
                      <div className="space-y-1">
                        {scenes.map((s: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${s.status === "CONFIRMED" ? "bg-success" : "bg-warning"}`} />
                            <span>{s.sceneNumber || `#${i + 1}`}</span>
                            {s.pageCount && <span className="text-muted-foreground text-xs">({s.pageCount}p)</span>}
                            {s.synopsis && <span className="text-muted-foreground truncate">— {s.synopsis}</span>}
                          </div>
                        ))}
                        {confirmedScenes.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {confirmedScenes.length}/{scenes.length} completadas
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Crew */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Crew ({crew.length})
                    </p>
                    {crew.length === 0 ? (
                      <p className="text-sm text-muted-foreground/60">Sin crew registrado</p>
                    ) : (
                      <div className="space-y-1">
                        {crew.slice(0, 6).map((c: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                              {c.user?.name?.charAt(0) || "?"}
                            </div>
                            <span className="truncate">{c.role || c.user?.name}</span>
                          </div>
                        ))}
                        {crew.length > 6 && (
                          <p className="text-xs text-muted-foreground">+{crew.length - 6} más</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cast */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Reparto ({cast.length})
                    </p>
                    {cast.length === 0 ? (
                      <p className="text-sm text-muted-foreground/60">Sin reparto registrado</p>
                    ) : (
                      <div className="space-y-1">
                        {cast.map((c: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">🎭</span>
                            <span>{c.castingMember?.name || "—"}</span>
                            {c.callTime && <span className="text-muted-foreground text-xs">{c.callTime}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {day.notes && (
                  <div className="px-5 pb-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Notas</p>
                    <p className="text-sm text-muted-foreground bg-muted/20 rounded-lg p-3">{day.notes}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Planned days summary */}
      {plannedDays.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">Próximos días de rodaje</h3>
          <div className="flex flex-wrap gap-2">
            {plannedDays.map((day: any) => {
              const d = new Date(day.date)
              return (
                <Link
                  key={day.id}
                  href="/schedule"
                  className="inline-flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium">Día {day.dayNumber}</span>
                  <span className="text-muted-foreground">
                    {d.getDate()}/{d.getMonth() + 1}
                  </span>
                  <span className="inline-block w-2 h-2 rounded-full bg-info" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
