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
import { useCreateTask } from "@/lib/api-hooks"
import { ArchiveButton } from "@/components/ui/archive-button"
import { useProject } from "@/lib/project-context"
import type { NoteItem } from "./FeedItem"

const CATEGORY_LABELS: Record<string, string> = {
  EDIT: "🎬 Montaje",
  COLOR: "🎨 Color",
  SOUND: "🔊 Sonido",
  VFX: "🌌 VFX",
  OTHER: "📁 Otro",
}

interface NoteDetailProps {
  note: NoteItem
  onToggleResolve: (noteId: string) => void
  onUpdate: (noteId: string, data: { status?: string; content?: string; taskId?: string }) => void
  onDelete: (noteId: string, cutId: string) => void
  isResolving: boolean
}

export function NoteDetail({ note, onToggleResolve, onUpdate, onDelete, isResolving }: NoteDetailProps) {
  const { data: session } = useSession()
  const { currentProjectId } = useProject()
  const role = (session?.user as any)?.role
  const canEdit = role === "ADMIN" || role === "HOD"
  const { toast } = useToast()
  const createTask = useCreateTask()

  const [editContent, setEditContent] = useState(note.content)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreatingTask, setIsCreatingTask] = useState(false)

  const isResolved = note.status === "RESOLVED"

  async function handleToggle() {
    onToggleResolve(note.id)
  }

  async function handleSaveEdit() {
    if (!editContent.trim()) return
    onUpdate(note.id, { content: editContent })
    setIsEditing(false)
  }

  async function handleCreateTask() {
    if (!currentProjectId) return
    setIsCreatingTask(true)
    try {
      const task = await createTask.mutateAsync({
        title: `[Montaje] TC ${note.timecode} — ${note.cut.name}`,
        description: note.content,
        projectId: currentProjectId,
        createdById: (session?.user as any)?.id,
        status: "PENDING",
        priority: "MEDIUM",
      })
      onUpdate(note.id, { taskId: task.id })
      toast({ title: "Tarea creada", variant: "success" })
    } catch {
      toast({ title: "Error al crear tarea", variant: "error" })
    } finally {
      setIsCreatingTask(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-bold bg-muted text-foreground px-2 py-1 rounded ring-1 ring-border">
            {note.timecode}
          </span>
          <Badge variant="outline" className="text-xs font-semibold">
            {CATEGORY_LABELS[note.category] || note.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {note.cut.name} v{note.cut.version}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Por {note.createdBy.name}</span>
          <span>·</span>
          <span>{new Date(note.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveEdit}>Guardar</Button>
            <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditContent(note.content) }}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "text-sm leading-relaxed p-3 rounded-lg border bg-muted/30",
            isResolved ? "line-through text-muted-foreground" : "text-foreground"
          )}
          onClick={() => canEdit && setIsEditing(true)}
          style={{ cursor: canEdit ? "text" : "default" }}
        >
          {note.content}
        </div>
      )}

      {note.taskId && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-info/5 border border-info/20">
          <Badge className="bg-info/10 text-info border-info/20 text-xs">✓ Tarea vinculada</Badge>
        </div>
      )}

      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones</p>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={isResolved ? "outline" : "default"}
            onClick={handleToggle}
            disabled={isResolving}
          >
            {isResolved ? "Marcar Pendiente" : "Marcar Resuelta"}
          </Button>

          {!note.taskId && canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCreateTask}
              disabled={isCreatingTask || isResolved}
            >
              {isCreatingTask ? "Creando..." : "Crear Tarea"}
            </Button>
          )}

          {canEdit && (
            <ArchiveButton
              onArchive={() => onDelete(note.id, note.cut.id)}
              itemName="esta nota"
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10"
              confirmTitle="Eliminar Nota"
              confirmLabel="Eliminar"
            />
          )}
        </div>
      </div>
    </div>
  )
}