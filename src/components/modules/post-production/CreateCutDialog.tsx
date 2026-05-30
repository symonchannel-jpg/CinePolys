"use client"

import { useState } from "react"
import { useProject } from "@/lib/project-context"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCreatePostCut } from "@/lib/api-hooks"

interface CreateCutDialogProps {
  onCreated?: () => void
  trigger?: React.ReactNode
}

export function CreateCutDialog({ onCreated, trigger }: CreateCutDialogProps) {
  const { currentProjectId } = useProject()
  const { toast } = useToast()
  const createCut = useCreatePostCut()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [version, setVersion] = useState("1")
  const [videoUrl, setVideoUrl] = useState("")
  const [notes, setNotes] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    if (!currentProjectId) {
      toast({ title: "Selecciona un proyecto primero", variant: "error" })
      return
    }

    try {
      await createCut.mutateAsync({
        name: name.trim(),
        version: Number(version) || 1,
        videoUrl: videoUrl.trim() || null,
        notes: notes.trim() || null,
        projectId: currentProjectId,
      })
      toast({ title: "Corte creado", variant: "success" })
      setOpen(false)
      setName("")
      setVersion("1")
      setVideoUrl("")
      setNotes("")
      onCreated?.()
    } catch {
      toast({ title: "Error al crear corte", variant: "error" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">+ Nuevo Corte</Button>} />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Corte</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del Corte</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Rough Cut, Assembly, Fine Cut..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Versión</Label>
            <Input
              type="number"
              min="1"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Enlace de Video (opcional)</Label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://frame.io/v2/..."
            />
          </div>
          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas sobre este corte..."
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createCut.isPending}>
              {createCut.isPending ? "Creando..." : "Crear Corte"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}