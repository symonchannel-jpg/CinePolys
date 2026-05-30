"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { useUpdateVFXShot, useUsers } from "@/lib/api-hooks"
import { ArchiveButton } from "@/components/ui/archive-button"
import {
  VFX_STATUS_COLORS,
  VFX_STATUS_LABELS,
  COMPLEXITY_COLORS,
  COMPLEXITY_LABELS,
} from "@/lib/constants"
import type { VFXItem } from "./FeedItem"

interface VFXDetailProps {
  vfx: VFXItem
  onUpdate: (id: string, data: { status?: string; assignedToId?: string | null; description?: string }) => void
  onArchive: (id: string) => void
}

export function VFXDetail({ vfx, onUpdate, onArchive }: VFXDetailProps) {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const canEdit = role === "ADMIN" || role === "HOD"
  const { toast } = useToast()
  const { data: users = [] } = useUsers()

  const [editStatus, setEditStatus] = useState(vfx.status)
  const [editDescription, setEditDescription] = useState(vfx.description || "")
  const [editAssignee, setEditAssignee] = useState(vfx.assignedTo?.id || "")
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const statusOptions = [
    { value: "PENDING", label: "Pendiente" },
    { value: "IN_PROGRESS", label: "En Progreso" },
    { value: "REVIEW", label: "Revisión" },
    { value: "APPROVED", label: "Aprobado" },
    { value: "REJECTED", label: "Rechazado" },
  ]

  async function handleSave() {
    setIsSaving(true)
    try {
      onUpdate(vfx.id, {
        status: editStatus,
        description: editDescription,
        assignedToId: editAssignee || null,
      })
      setIsEditing(false)
      toast({ title: "VFX actualizado", variant: "success" })
    } catch {
      toast({ title: "Error al actualizar", variant: "error" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-mono text-lg font-bold text-foreground">{vfx.shotId}</h3>
            {vfx.assignedTo && (
              <p className="text-xs text-muted-foreground mt-1">Asignado a {vfx.assignedTo.name}</p>
            )}
          </div>
          <span className={cn("text-xs font-semibold px-2 py-1 rounded", COMPLEXITY_COLORS[vfx.complexity])}>
            {COMPLEXITY_LABELS[vfx.complexity]}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn("text-xs font-bold py-0.5", VFX_STATUS_COLORS[vfx.status])}>
            {VFX_STATUS_LABELS[vfx.status]}
          </Badge>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Descripción</Label>
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Estado</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v || "PENDING")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Asignado</Label>
              <Select value={editAssignee} onValueChange={(v) => setEditAssignee(v || "")}>
                <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin asignar</SelectItem>
                  {users.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="text-sm text-muted-foreground p-3 rounded-lg border bg-muted/30"
          onClick={() => canEdit && setIsEditing(true)}
          style={{ cursor: canEdit ? "text" : "default" }}
        >
          {vfx.description || "Sin descripción"}
        </div>
      )}

      {vfx.notes && (
        <div className="p-3 rounded-lg bg-muted/40 border border-border/30">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Notas</p>
          <p className="text-sm text-muted-foreground">{vfx.notes}</p>
        </div>
      )}

      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones</p>

        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                Editar
              </Button>
              <ArchiveButton
                onArchive={() => onArchive(vfx.id)}
                itemName="este plano VFX"
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10"
                confirmTitle="Archivar VFX"
                confirmLabel="Archivar"
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}