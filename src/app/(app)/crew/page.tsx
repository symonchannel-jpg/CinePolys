"use client"

import { useSession } from "next-auth/react"
import { useProject } from "@/lib/project-context"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useUsers } from "@/lib/api-hooks"

const roleLabels: Record<string, string> = { ADMIN: "Admin", HOD: "Jefe Depto.", CREW: "Crew" }

export default function CrewPage() {
  const { data: session } = useSession()
  const { currentProjectId } = useProject()
  const queryClient = useQueryClient()
  const { data: users, isLoading: loadingUsers } = useUsers()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState("")

  // Fetch crew assignments from schedule (who's working which days)
  const { data: schedule } = useQuery({
    queryKey: ["schedule", currentProjectId],
    queryFn: async () => {
      const res = await fetch(`/api/schedule?projectId=${currentProjectId}`)
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
    enabled: !!currentProjectId,
  })

  const updateRole = useMutation({
    mutationFn: async ({ userId, productionRole }: { userId: string; productionRole: string }) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productionRole }),
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setEditingId(null)
    },
  })

  // Build a map of user -> upcoming days they're assigned to
  const crewAssignments: Record<string, any[]> = {}
  if (schedule) {
    const days = Array.isArray(schedule) ? schedule : []
    days.forEach((day: any) => {
      if (day.status === "COMPLETED" || day.status === "CANCELLED") return
      if (day.dailyCrew) {
        day.dailyCrew.forEach((dc: any) => {
          if (!crewAssignments[dc.userId]) crewAssignments[dc.userId] = []
          crewAssignments[dc.userId].push({
            dayNumber: day.dayNumber,
            date: day.date,
            role: dc.role,
            callTime: dc.callTime,
          })
        })
      }
    })
  }

  const crewMembers = (users || []).filter((u: any) => u.role !== "ADMIN")

  if (!currentProjectId) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Selecciona un proyecto</div>
  }

  const isAdmin = session?.user?.role === "ADMIN"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Equipo de producción</h1>
      </div>

      {loadingUsers ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl border border-border bg-muted/30" />
          ))}
        </div>
      ) : crewMembers.length === 0 ? (
        <p className="text-muted-foreground">No hay miembros en el equipo. Agrega usuarios desde Admin.</p>
      ) : (
        <div className="space-y-2">
          {crewMembers.map((user: any) => (
            <div key={user.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {user.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {editingId === user.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          className="rounded-lg border border-border bg-background px-3 py-1 text-sm"
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                        >
                          <option value="">— Sin rol —</option>
                          <option value="Director">Director</option>
                          <option value="Director de Fotografía">Director de Fotografía</option>
                          <option value="Productor">Productor</option>
                          <option value="Asistente de Dirección">Asistente de Dirección</option>
                          <option value="Script Supervisor">Script Supervisor</option>
                          <option value="Sonidista">Sonidista</option>
                          <option value="Gaffer">Gaffer</option>
                          <option value="Electricista">Electricista</option>
                          <option value="Director de Arte">Director de Arte</option>
                          <option value="Maquillaje">Maquillaje</option>
                          <option value="Vestuario">Vestuario</option>
                          <option value="Editor">Editor</option>
                          <option value="Colorista">Colorista</option>
                          <option value="Música / Sound Design">Música / Sound Design</option>
                          <option value="VFX">VFX</option>
                          <option value="Producción General">Producción General</option>
                          <option value="Catering">Catering</option>
                          <option value="Transporte">Transporte</option>
                        </select>
                        <button
                          onClick={() => updateRole.mutate({ userId: user.id, productionRole: editRole })}
                          className="rounded-lg bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-lg border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted/50"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                          {user.productionRole || "Sin rol"}
                        </span>
                       <span className="rounded-full bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                          {roleLabels[user.role] || user.role}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => { setEditingId(user.id); setEditRole(user.productionRole || "") }}
                            className="text-xs text-primary hover:underline"
                          >
                            Editar rol
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Show upcoming assignments */}
              {crewAssignments[user.id] && crewAssignments[user.id].length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {crewAssignments[user.id].map((a: any, i: number) => {
                    const d = new Date(a.date)
                    return (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/30 px-2.5 py-0.5 text-xs">
                        📅 Día {a.dayNumber}
                        {a.role && <span className="text-muted-foreground">({a.role})</span>}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
