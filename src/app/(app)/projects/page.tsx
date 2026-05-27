"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useProject } from "@/lib/project-context"
import { Button } from "@/components/ui/button"
import { ArchiveButton } from "@/components/ui/archive-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, RotateCcw, FolderKanban, FolderOpen, ChevronDown, ChevronRight, Trash2, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#f43f5e", "#f59e0b",
  "#10b981", "#0ea5e9", "#ef4444", "#64748b",
]

interface ProjectWithCount {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  status: string | null
  createdAt: string
  archivedAt: string | null
  _count: { tasks: number }
}

export default function ProjectsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { setCurrentProjectId, currentProjectId, refreshProjects } = useProject()
  const role = session?.user?.role
  const isAdminOrHod = role === "ADMIN" || role === "HOD"
  const isAdmin = role === "ADMIN"

  const [active, setActive] = useState<ProjectWithCount[]>([])
  const [archived, setArchived] = useState<ProjectWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newColor, setNewColor] = useState("#6366f1")
  const [creating, setCreating] = useState(false)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/projects?includeArchived=true")
      if (res.ok) {
        const data = await res.json()
        setActive(data.active || [])
        setArchived(data.archived || [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { loadProjects() }, [loadProjects])

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || null,
          color: newColor,
        }),
      })
      if (res.ok) {
        setCreateOpen(false)
        setNewName("")
        setNewDescription("")
        setNewColor("#6366f1")
        refreshProjects()
        loadProjects()
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleArchive(id: string) {
    await fetch(`/api/projects/${id}`, { method: "DELETE" })
    refreshProjects()
    loadProjects()
  }

  async function handleRestore(id: string) {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archivedAt: null }),
    })
    refreshProjects()
    loadProjects()
  }

  function handleSelect(id: string) {
    setCurrentProjectId(id)
    router.push("/dashboard")
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 rounded-xl border border-border bg-muted/30 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proyectos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {active.length} {active.length === 1 ? "proyecto activo" : "proyectos activos"}
            {archived.length > 0 && ` · ${archived.length} archivados`}
          </p>
        </div>
        {isAdminOrHod && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={
              <Button>
                <Plus size={16} strokeWidth={2} />
                Nuevo proyecto
              </Button>
            } />
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Crear nuevo proyecto</DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nombre del proyecto"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Breve descripción del proyecto"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewColor(color)}
                        className="h-8 w-8 rounded-full border border-border cursor-pointer transition-all duration-200 hover:scale-110 flex items-center justify-center shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {newColor === color && (
                          <Check size={14} className="text-white drop-shadow-sm" />
                        )}
                      </button>
                    ))}
                    <label className="h-8 px-3 rounded-full border border-border bg-muted/40 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-all duration-200 flex items-center gap-1.5 shrink-0 select-none">
                      <input
                        type="color"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="sr-only"
                      />
                      <span className="h-3 w-3 rounded-full border border-border/50" style={{ backgroundColor: PRESET_COLORS.includes(newColor) ? "#fff" : newColor }} />
                      Personalizado
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
                    {creating ? "Creando..." : "Crear proyecto"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Active projects grid */}
      {active.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-border rounded-xl bg-card">
          <FolderKanban size={48} strokeWidth={1.5} className="text-muted-foreground/40 mb-4" />
          <h3 className="text-base font-semibold text-foreground mb-1">No hay proyectos</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            {isAdminOrHod
              ? "Crea tu primer proyecto para empezar a gestionar tu producción."
              : "Espera a que un administrador cree un proyecto y te asigne a él."}
          </p>
          {isAdminOrHod && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} strokeWidth={2} className="mr-1" />
              Crear proyecto
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((project) => (
            <div
              key={project.id}
              className={cn(
                "group relative rounded-xl border bg-card transition-all duration-200 hover:shadow-sm overflow-hidden",
                currentProjectId === project.id
                  ? "border-primary ring-1 ring-primary/20"
                  : "border-border hover:border-primary/30"
              )}
            >
              {/* Color strip */}
              <div
                className="h-1.5 w-full shrink-0"
                style={{ backgroundColor: project.color || "#6366f1" }}
              />

              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
                    {project.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{project.description}</p>
                    )}
                  </div>
                  {currentProjectId === project.id && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Activo
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FolderOpen size={12} strokeWidth={1.5} />
                    {project._count.tasks} {project._count.tasks === 1 ? "tarea" : "tareas"}
                  </span>
                  <span>
                    Creado {new Date(project.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => handleSelect(project.id)}
                    className="flex-1 rounded-lg bg-primary/10 text-primary text-xs font-medium py-1.5 hover:bg-primary/20 transition-colors"
                  >
                    {currentProjectId === project.id ? "Ir al Dashboard" : "Seleccionar"}
                  </button>
                  {isAdminOrHod && project.id !== "default-project" && (
                    <ArchiveButton
                      onArchive={() => handleArchive(project.id)}
                      itemName={`"${project.name}"`}
                      size="icon-sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      title="Archivar proyecto"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Archived projects */}
      {archived.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center justify-between w-full px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Trash2 size={16} strokeWidth={1.75} className="text-muted-foreground" />
              Proyectos archivados
              <span className="text-xs font-normal text-muted-foreground">({archived.length})</span>
            </span>
            {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {showArchived && (
            <div className="border-t border-border divide-y divide-border">
              {archived.map((project) => (
                <div key={project.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: project.color || "#6366f1" }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {project._count.tasks} tareas · Archivado {project.archivedAt && new Date(project.archivedAt).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(project.id)}
                      className="shrink-0"
                    >
                      <RotateCcw size={12} strokeWidth={2} className="mr-1" />
                      Restaurar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
