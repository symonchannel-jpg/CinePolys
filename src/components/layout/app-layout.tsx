"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Sidebar } from "./sidebar"
import { Omnibar } from "./omnibar"
import { NotificationPanel } from "./notification-panel"
import { useSession } from "next-auth/react"
import { useProject } from "@/lib/project-context"
import { ThemeToggle } from "./theme-toggle"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArchiveButton } from "@/components/ui/archive-button"
import { ToastProvider, useToast } from "@/components/ui/toast"
import { Menu, Search, Plus, Pencil } from "lucide-react"
import { ColorPicker } from "@/components/ui/color-picker"

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const { data: session } = useSession()
  const { currentProjectId, setCurrentProjectId, projects, refreshProjects, currentProject, projectOrder, setProjectOrder } = useProject()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Edit project modal
  const [editOpen, setEditOpen] = useState(false)
  const [editProject, setEditProject] = useState<any>(null)
  const [editName, setEditName] = useState("")
  const [editIcon, setEditIcon] = useState("🎬")
  const [editColor, setEditColor] = useState("#3b82f6")

  // Create project modal
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newIcon, setNewIcon] = useState("🎬")
  const [newColor, setNewColor] = useState("#3b82f6")

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const dragSrcIndex = useRef<number>(-1)

  const isAdminOrHod = session?.user?.role === "ADMIN" || session?.user?.role === "HOD"

  function openEditProject(proj: any) {
    setEditProject(proj)
    setEditName(proj.name)
    setEditIcon(proj.icon || "🎬")
    setEditColor(proj.color || "#3b82f6")
    setEditOpen(true)
  }

  async function handleUpdateProject() {
    if (!editProject) return
    const res = await fetch(`/api/projects/${editProject.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, icon: editIcon, color: editColor }),
    })
    if (res.ok) {
      setEditOpen(false)
      refreshProjects()
    } else {
      toast({ title: "Error al actualizar proyecto", variant: "error" })
    }
  }

  async function handleCreateProject() {
    if (!newName.trim()) return
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), icon: newIcon, color: newColor }),
    })
    if (res.ok) {
      setCreateOpen(false)
      setNewName("")
      refreshProjects()
    } else {
      toast({ title: "Error al crear proyecto", variant: "error" })
    }
  }

  // Drag handlers
  function handleDragStart(e: React.DragEvent, id: string, index: number) {
    setDraggedId(id)
    dragSrcIndex.current = index
    e.dataTransfer.effectAllowed = "move"
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    if (draggedId === id) return
    setDragOverId(id)
  }

  function handleDragLeave() {
    setDragOverId(null)
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    setDragOverId(null)
    if (!draggedId || draggedId === targetId) return

    const fromIndex = projectOrder.findIndex((id) => id === draggedId)
    const toIndex = projectOrder.findIndex((id) => id === targetId)
    if (fromIndex === -1 || toIndex === -1) return

    const newOrder = [...projectOrder]
    newOrder.splice(fromIndex, 1)
    newOrder.splice(toIndex, 0, draggedId!)
    setProjectOrder(newOrder)
    setDraggedId(null)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Project tabs bar */}
        <div className="flex h-12 items-center border-b border-border bg-muted/20 px-2 gap-1 overflow-x-auto scrollbar-none">
          {projects.map((p, idx) => (
            <div
              key={p.id}
              draggable={isAdminOrHod}
              onDragStart={(e) => handleDragStart(e, p.id, idx)}
              onDragOver={(e) => handleDragOver(e, p.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, p.id)}
              onClick={() => setCurrentProjectId(p.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") setCurrentProjectId(p.id) }}
              className={`
                group flex items-center gap-2 rounded-t-md px-3 py-1 text-sm font-medium border border-transparent border-b-0 min-h-[34px]
                transition-all duration-200 cursor-pointer data-open:animate-jelly
                ${currentProjectId === p.id
                  ? "bg-background text-foreground border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                }
                ${draggedId === p.id ? "opacity-50" : ""}
                ${dragOverId === p.id ? "border-primary" : ""}
              `}
              title={p.name}
              style={{ borderTopColor: p.color || undefined }}
            >
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color || "#3b82f6" }}></span>
              <span className="max-w-[120px] truncate">{p.name}</span>
              {isAdminOrHod && p.id !== "default-project" && (
                <div className="ml-1 flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => openEditProject(p)}
                    className="size-5 rounded-full hover:bg-primary/10 hover:text-primary text-muted-foreground flex items-center justify-center transition-colors animate-jelly"
                    title="Editar proyecto"
                  >
                    <Pencil size={11} strokeWidth={2} />
                  </button>
                  <ArchiveButton
                    onArchive={async () => {
                      await fetch(`/api/projects/${p.id}`, { method: "DELETE" })
                      setProjectOrder((prev) => prev.filter((id) => id !== p.id))
                      refreshProjects()
                    }}
                    itemName={`"${p.name}"`}
                    size="xs"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive size-5"
                    title="Archivar proyecto"
                  />
                </div>
              )}
            </div>
          ))}
          {isAdminOrHod && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger render={
                <Button variant="ghost" className="flex items-center gap-1 rounded-t-md px-3 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-background/40 min-h-[34px]" title="Crear nuevo proyecto">
                  <Plus size={14} strokeWidth={2} className="animate-jelly" />
                  <span className="hidden sm:inline">Nuevo</span>
                </Button>
              } />
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Crear nuevo proyecto</DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre del proyecto" />
                  </div>
                  <ColorPicker value={newColor} onChange={setNewColor} label="Color del proyecto" />
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => setCreateOpen(false)} className="animate-jelly">Cancelar</Button>
                    <Button onClick={handleCreateProject} className="animate-jelly">Crear</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Edit Project Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar proyecto</DialogTitle>
            </DialogHeader>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <ColorPicker value={editColor} onChange={setEditColor} label="Color del proyecto" />
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditOpen(false)} className="animate-jelly">Cancelar</Button>
                <Button onClick={handleUpdateProject} className="animate-jelly">Guardar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Main header */}
        <header className="flex h-14 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-sm px-4 animate-in fade-in duration-300">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>

          {/* Current project indicator */}
          {currentProject && (
            <div className="flex items-center gap-2 text-sm animate-in slide-in-from-left-4 duration-300">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: currentProject.color || "#3b82f6" }}
              ></div>
              <div>
                <p className="font-medium text-foreground">{currentProject.name}</p>
                {currentProject.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{currentProject.description}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex-1" />

          <ThemeToggle />

          <NotificationPanel />

          <button
            onClick={() => {
              const event = new KeyboardEvent("keydown", { metaKey: true, key: "k" })
              document.dispatchEvent(event)
            }}
            className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:border-primary/30"
          >
            <Search size={14} strokeWidth={1.75} />
            <span className="hidden sm:inline">Buscar...</span>
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-xs">
              ⌘K
            </kbd>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 flex flex-col">
          <div key={currentProjectId || "none"} className="animate-in fade-in duration-500 flex-1">
            {children}
          </div>
        </main>
      </div>
      <Omnibar />
    </div>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </ToastProvider>
  )
}
