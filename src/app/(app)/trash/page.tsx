"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useProject } from "@/lib/project-context"
import { useQueryClient } from "@tanstack/react-query"

interface TrashItem {
  id: string
  title?: string
  name?: string
  shotId?: string
  date?: string
  character?: string | null
  department?: { name: string } | null
  assignedTo?: { name: string } | null
  archivedAt?: string
}

export default function TrashPage() {
  const { currentProjectId } = useProject()
  const qc = useQueryClient()
  const [data, setData] = useState<{
    tasks: TrashItem[]
    scripts: TrashItem[]
    locations: TrashItem[]
    casting: TrashItem[]
    callSheets: TrashItem[]
    vfxShots: TrashItem[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadData() {
    if (!currentProjectId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/trash?projectId=${currentProjectId}`)
      if (res.ok) {
        setData(await res.json())
      }
    } catch (error) {
      console.error("Error al cargar papelera:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentProjectId])

  async function restore(type: string, id: string) {
    try {
      const res = await fetch("/api/trash", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      })
      if (!res.ok) return
      loadData()
      const queryMap: Record<string, string[]> = {
        task: ["tasks"],
        script: ["scripts"],
        location: ["locations"],
        casting: ["casting"],
        dailies: ["dailies"],
        vfx: ["vfx-shots"],
      }
      const keys = queryMap[type]
      if (keys) keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }))
    } catch (error) {
      console.error("Error al restaurar elemento:", error)
    }
  }

  if (loading) return <div className="text-center py-12 text-muted-foreground">Cargando...</div>

  if (!currentProjectId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Selecciona un proyecto activo para ver su papelera
      </div>
    )
  }

  const total = (data?.tasks.length || 0) + (data?.scripts.length || 0) + (data?.locations.length || 0) + (data?.casting.length || 0) + (data?.callSheets.length || 0) + (data?.vfxShots.length || 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Papelera</h1>
        <p className="text-sm text-muted-foreground mt-1">{total} elemento{total !== 1 ? "s" : ""} archivados</p>
      </div>

      {total === 0 ? (
        <div className="text-center py-12 text-muted-foreground">La papelera está vacía</div>
      ) : (
        <div className="space-y-8">
          {data!.tasks.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Tareas ({data!.tasks.length})</h2>
              <div className="space-y-2">
                {data!.tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-4 rounded-lg border border-border bg-card/50 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{t.title}</span>
                        {t.department && <Badge variant="outline" className="text-xs">{t.department.name}</Badge>}
                      </div>
                      {t.assignedTo && <p className="text-xs text-muted-foreground mt-0.5">Asignado a: {t.assignedTo.name}</p>}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => restore("task", t.id)}>Restaurar</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data!.scripts.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Guiones ({data!.scripts.length})</h2>
              <div className="space-y-2">
                {data!.scripts.map((s) => (
                  <div key={s.id} className="flex items-center gap-4 rounded-lg border border-border bg-card/50 p-4">
                    <span className="flex-1 font-medium text-foreground">{s.title}</span>
                    <Button variant="outline" size="sm" onClick={() => restore("script", s.id)}>Restaurar</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data!.locations.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Locaciones ({data!.locations.length})</h2>
              <div className="space-y-2">
                {data!.locations.map((l) => (
                  <div key={l.id} className="flex items-center gap-4 rounded-lg border border-border bg-card/50 p-4">
                    <span className="flex-1 font-medium text-foreground">{l.name}</span>
                    <Button variant="outline" size="sm" onClick={() => restore("location", l.id)}>Restaurar</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data!.casting.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Actores ({data!.casting.length})</h2>
              <div className="space-y-2">
                {data!.casting.map((c) => (
                  <div key={c.id} className="flex items-center gap-4 rounded-lg border border-border bg-card/50 p-4">
                    <span className="flex-1 font-medium text-foreground">{c.name}{c.character ? ` (${c.character})` : ""}</span>
                    <Button variant="outline" size="sm" onClick={() => restore("casting", c.id)}>Restaurar</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data!.callSheets.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Llamados ({data!.callSheets.length})</h2>
              <div className="space-y-2">
                {data!.callSheets.map((cs) => (
                  <div key={cs.id} className="flex items-center gap-4 rounded-lg border border-border bg-card/50 p-4">
                    <span className="flex-1 font-medium text-foreground">{cs.date ? new Date(cs.date).toLocaleDateString("es") : "Sin fecha"}</span>
                    <Button variant="outline" size="sm" onClick={() => restore("dailies", cs.id)}>Restaurar</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data!.vfxShots.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Planos VFX ({data!.vfxShots.length})</h2>
              <div className="space-y-2">
                {data!.vfxShots.map((v) => (
                  <div key={v.id} className="flex items-center gap-4 rounded-lg border border-border bg-card/50 p-4">
                    <span className="flex-1 font-medium text-foreground">{v.shotId || v.name || v.title}</span>
                    <Button variant="outline" size="sm" onClick={() => restore("vfx", v.id)}>Restaurar</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
