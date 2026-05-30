"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreatePostScreeningNote } from "@/lib/api-hooks"

interface CreateNoteDialogProps {
  cutId: string
  cutName: string
  onCreated?: () => void
  trigger?: React.ReactNode
}

const CATEGORIES = [
  { value: "EDIT", label: "🎬 Montaje" },
  { value: "COLOR", label: "🎨 Color" },
  { value: "SOUND", label: "🔊 Sonido" },
  { value: "VFX", label: "🌌 VFX" },
  { value: "OTHER", label: "📁 Otro" },
]

export function CreateNoteDialog({ cutId, cutName, onCreated, trigger }: CreateNoteDialogProps) {
  const { toast } = useToast()
  const createNote = useCreatePostScreeningNote()

  const [open, setOpen] = useState(false)
  const [timecode, setTimecode] = useState("")
  const [category, setCategory] = useState("EDIT")
  const [content, setContent] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!timecode.trim() || !content.trim()) return

    try {
      await createNote.mutateAsync({
        cutId,
        timecode: timecode.trim(),
        category,
        content: content.trim(),
      })
      toast({ title: "Nota agregada", variant: "success" })
      setOpen(false)
      setTimecode("")
      setContent("")
      setCategory("EDIT")
      onCreated?.()
    } catch {
      toast({ title: "Error al crear nota", variant: "error" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/5">
          + Agregar Nota
        </Button>
      } />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Nota de Visionado</DialogTitle>
          <p className="text-xs text-muted-foreground">Corte: {cutName}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Timecode</Label>
              <Input
                value={timecode}
                onChange={(e) => setTimecode(e.target.value)}
                placeholder="01:04:12:15"
                className="font-mono"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={category} onValueChange={(v) => setCategory(v || "EDIT")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Detalle de la nota</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="¿Qué se vio mal? ¿Qué corregir?"
              rows={3}
              required
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createNote.isPending}>
              {createNote.isPending ? "Agregando..." : "Agregar Nota"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}