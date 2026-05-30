"use client"

import { useState } from "react"
import { useProject } from "@/lib/project-context"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SelectValueI18n } from "@/components/ui/select-i18n"
import { useCreateVFXShot, useUsers } from "@/lib/api-hooks"

interface CreateVFXDialogProps {
  onCreated?: () => void
  trigger?: React.ReactNode
}

export function CreateVFXDialog({ onCreated, trigger }: CreateVFXDialogProps) {
  const { currentProjectId } = useProject()
  const { toast } = useToast()
  const createVFX = useCreateVFXShot()
  const { data: users = [] } = useUsers()

  const [open, setOpen] = useState(false)
  const [shotId, setShotId] = useState("")
  const [description, setDescription] = useState("")
  const [complexity, setComplexity] = useState("MEDIUM")
  const [assignedToId, setAssignedToId] = useState("")
  const [notes, setNotes] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!shotId.trim() || !currentProjectId) return

    try {
      await createVFX.mutateAsync({
        shotId: shotId.trim(),
        description: description.trim() || null,
        complexity,
        assignedToId: assignedToId || null,
        notes: notes.trim() || null,
        projectId: currentProjectId,
      })
      toast({ title: "Plano VFX creado", variant: "success" })
      setOpen(false)
      setShotId("")
      setDescription("")
      setComplexity("MEDIUM")
      setAssignedToId("")
      setNotes("")
      onCreated?.()
    } catch {
      toast({ title: "Error al crear plano VFX", variant: "error" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">+ Nuevo VFX</Button>} />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Plano VFX</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Shot ID</Label>
            <Input
              value={shotId}
              onChange={(e) => setShotId(e.target.value)}
              placeholder="Ej: SC01_SH010"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del efecto..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Complejidad</Label>
              <Select value={complexity} onValueChange={(v) => setComplexity(v || "MEDIUM")}>
                <SelectTrigger><SelectValueI18n labels={{ LOW: "Baja", MEDIUM: "Media", HIGH: "Alta" }} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baja</SelectItem>
                  <SelectItem value="MEDIUM">Media</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Asignado a</Label>
              <Select value={assignedToId} onValueChange={(v) => setAssignedToId(v || "")}>
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
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createVFX.isPending}>
              {createVFX.isPending ? "Creando..." : "Crear Plano"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}