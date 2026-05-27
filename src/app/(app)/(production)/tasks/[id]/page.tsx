"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArchiveButton } from "@/components/ui/archive-button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SelectValueI18n } from "@/components/ui/select-i18n"
import { useTask, useUpdateTask, useArchiveTask, useCreateComment } from "@/lib/api-hooks"

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  IN_PROGRESS: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  REVIEW: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  COMPLETED: "bg-green-500/10 text-green-500 border-green-500/20",
  ARCHIVED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En Progreso",
  REVIEW: "Revisión",
  COMPLETED: "Completada",
  ARCHIVED: "Archivada",
}

const priorityLabels: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
}

const actionLabels: Record<string, string> = {
  CREATED: "creó la tarea",
  STATUS_CHANGED: "cambió el estado",
  PRIORITY_CHANGED: "cambió la prioridad",
  ASSIGNED: "asignó la tarea",
  UPDATED: "actualizó la tarea",
  ARCHIVED: "archivó la tarea",
  COMMENT_DELETED: "eliminó un comentario",
}

export default function TaskDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const userId = session?.user?.id
  const role = session?.user?.role || "CREW"
  const canEdit = role === "ADMIN" || role === "HOD"

  const taskId = params.id as string
  const { data: task, isLoading, error } = useTask(taskId)

  const updateTask = useUpdateTask()
  const archiveTask = useArchiveTask()
  const createComment = useCreateComment()

  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [editPriority, setEditPriority] = useState("")

  const [commentText, setCommentText] = useState("")
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentText, setEditCommentText] = useState("")
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null)

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Cargando...</div>
  if (error || !task) {
    router.push("/tasks")
    return null
  }

  async function handleSave() {
    await updateTask.mutateAsync({
      id: task.id,
      title: editTitle,
      description: editDesc,
      status: editStatus,
      priority: editPriority,
    })
    setEditing(false)
  }

  async function handleArchive() {
    await archiveTask.mutateAsync(task.id)
    router.push("/tasks")
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return
    await createComment.mutateAsync({ taskId: task.id, content: commentText })
    setCommentText("")
  }

  async function handleEditComment(commentId: string) {
    if (!editCommentText.trim()) return
    await fetch(`/api/comments/${commentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editCommentText }),
    })
    setEditingCommentId(null)
    setEditCommentText("")
    await updateTask.mutateAsync({ id: task.id })
  }

  function renderCommentContent(content: string) {
    const parts = content.split(/(@\w+)/g)
    return parts.map((part, i) =>
      part.startsWith("@") ? (
        <span key={i} className="text-primary font-medium">{part}</span>
      ) : (
        part
      )
    )
  }

  async function handleDeleteComment(commentId: string) {
    await fetch(`/api/comments/${commentId}`, { method: "DELETE" })
    await updateTask.mutateAsync({ id: task.id })
    setDeleteCommentId(null)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <button onClick={() => router.push("/tasks")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Volver a tareas
      </button>

      {editing ? (
        <div className="space-y-4 rounded-lg border border-border bg-card p-6">
          <div className="space-y-2"><Label>Título</Label><Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} /></div>
          <div className="space-y-2"><Label>Descripción</Label><Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={4} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v || "")}>
                <SelectTrigger><SelectValueI18n labels={{ PENDING: "Pendiente", IN_PROGRESS: "En Progreso", REVIEW: "Revisión", COMPLETED: "Completada" }} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                  <SelectItem value="REVIEW">Revisión</SelectItem>
                  <SelectItem value="COMPLETED">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={editPriority} onValueChange={(v) => setEditPriority(v || "")}>
                <SelectTrigger><SelectValueI18n labels={{ LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", URGENT: "Urgente" }} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baja</SelectItem>
                  <SelectItem value="MEDIUM">Media</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={updateTask.isPending}>{updateTask.isPending ? "Guardando..." : "Guardar"}</Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">{task.title}</h1>
                <Badge className={statusColors[task.status]}>{statusLabels[task.status]}</Badge>
                <Badge variant="outline" className="text-xs">{priorityLabels[task.priority] || task.priority}</Badge>
              </div>
              {task.description && <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>}
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {task.department && <div><span className="text-foreground font-medium">Depto:</span> {task.department.name}</div>}
                {task.assignedTo && task.assignedTo.length > 0 && (
                  <div><span className="text-foreground font-medium">Asignado:</span> {task.assignedTo.map((u: { name: string }) => u.name).join(", ")}</div>
                )}
                {task.createdBy && <div><span className="text-foreground font-medium">Creado por:</span> {task.createdBy.name}</div>}
                {task.dueDate && <div><span className="text-foreground font-medium">Vence:</span> {new Date(task.dueDate).toLocaleDateString("es")}</div>}
              </div>
            </div>
            {canEdit && (
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => { setEditTitle(task.title); setEditDesc(task.description || ""); setEditStatus(task.status); setEditPriority(task.priority); setEditing(true) }}>Editar</Button>
                <ArchiveButton onArchive={handleArchive} itemName={`"${task?.title}"`} size="sm" variant="destructive" title="Archivar tarea" confirmTitle="Archivar tarea" confirmLabel="Archivar" />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Actividad</h2>
        {(!task.activities || task.activities.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin actividad registrada</p>
        ) : (
          <div className="space-y-3">
            {task.activities.map((act: { id: string; action: string; details: string | null; createdAt: string; user: { id: string; name: string } }) => (
              <div key={act.id} className="flex gap-3 text-sm">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-foreground">{act.user?.name || "Sistema"}</span>{" "}
                  <span className="text-muted-foreground">{actionLabels[act.action] || act.action}</span>
                  {act.details && (
                    <span className="text-muted-foreground/70 text-xs ml-1">
                      {(() => {
                        try {
                          const d = JSON.parse(act.details)
                          if (act.action === "STATUS_CHANGED") return `${d.from || "?"} → ${d.to}`
                          if (act.action === "PRIORITY_CHANGED") return `${d.from || "?"} → ${d.to}`
                          if (d.fields) return `(${d.fields.join(", ")})`
                          return ""
                        } catch { return "" }
                      })()}
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    {new Date(act.createdAt).toLocaleString("es")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Comentarios ({task.comments?.length || 0})</h2>

        <form onSubmit={handleAddComment} className="flex gap-3 mb-6">
          <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Escribe un comentario..." className="flex-1" />
          <Button type="submit" disabled={createComment.isPending || !commentText.trim()}>{createComment.isPending ? "..." : "Enviar"}</Button>
        </form>

        {(!task.comments || task.comments.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin comentarios aún</p>
        ) : (
          <div className="space-y-4">
            {task.comments.map((comment: { id: string; content: string; createdAt: string; author: { id: string; name: string } }) => (
              <div key={comment.id} className="flex gap-3 group">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {(comment.author?.name || "?")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <Textarea value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} rows={2} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleEditComment(comment.id)}>Guardar</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingCommentId(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{comment.author?.name || "Desconocido"}</span>
                        <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString("es")}</span>
                        {comment.author?.id === userId && (
                          <div className="hidden group-hover:flex gap-1 ml-auto">
                            <button onClick={() => { setEditingCommentId(comment.id); setEditCommentText(comment.content) }} className="text-xs text-muted-foreground hover:text-foreground">✎</button>
                            <button onClick={() => setDeleteCommentId(comment.id)} className="text-xs text-muted-foreground hover:text-destructive">✕</button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{renderCommentContent(comment.content)}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={deleteCommentId !== null}
        onOpenChange={(o) => { if (!o) setDeleteCommentId(null) }}
        title="Eliminar comentario"
        message="¿Estás seguro de eliminar este comentario? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={() => deleteCommentId && handleDeleteComment(deleteCommentId)}
      />
    </div>
  )
}
