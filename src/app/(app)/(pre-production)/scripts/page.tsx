"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArchiveButton } from "@/components/ui/archive-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SelectValueI18n, SelectI18n } from "@/components/ui/select-i18n"
import { Textarea } from "@/components/ui/textarea"
import { FormTabs } from "@/components/ui/form-tabs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProject } from "@/lib/project-context"
import {
  useScripts, useCreateScript, useArchiveScript, useUpdateScript,
  useScriptVersions, useAddScriptVersion,
  useScriptBreakdown, useCreateBreakdownItem, useUpdateBreakdownItem, useArchiveBreakdownItem,
  useCasting, useLocations, useTasks, useCreateTask, useDepartments, useUsers,
} from "@/lib/api-hooks"
import {
  SCRIPT_STATUS_COLORS as statusColors,
  SCRIPT_STATUS_LABELS as statusLabels,
} from "@/lib/constants"

const typeLabels: Record<string, string> = {
  LITERARY: "Literario",
  TECHNICAL: "Técnico",
  NARRATIVE: "Narrativo",
}

const categoryConfig: Record<string, { label: string; icon: string; color: string }> = {
  CHARACTER: { label: "Personajes", icon: "👤", color: "text-blue-400" },
  PROP: { label: "Utilería", icon: "🔧", color: "text-amber-400" },
  WARDROBE: { label: "Vestuario", icon: "👔", color: "text-purple-400" },
  LOCATION: { label: "Locaciones", icon: "📍", color: "text-green-400" },
  VEHICLE: { label: "Vehículos", icon: "🚗", color: "text-cyan-400" },
  SFX: { label: "SFX", icon: "💥", color: "text-orange-400" },
  VFX: { label: "VFX", icon: "✨", color: "text-pink-400" },
  EXTRA: { label: "Extras", icon: "👥", color: "text-teal-400" },
  OTHER: { label: "Otros", icon: "📌", color: "text-gray-400" },
}

const breakdownStatusColors: Record<string, string> = {
  PENDING: "bg-gray-500/10 text-gray-400",
  IN_PROGRESS: "bg-blue-500/10 text-blue-400",
  COMPLETED: "bg-green-500/10 text-green-400",
  BLOCKED: "bg-red-500/10 text-red-400",
}

const breakdownStatusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En Progreso",
  COMPLETED: "Completado",
  BLOCKED: "Bloqueado",
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

/* ─── Script Card ─── */
function ScriptCard({ script, onSelect, onArchive }: { script: any; onSelect: () => void; onArchive: () => void }) {
  const progress = script._count?.total ? Math.round((script._count.completed / script._count.total) * 100) : 0
  return (
    <div
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect() } }}
      tabIndex={0}
      role="button"
      className="w-full text-left rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground truncate">{script.title}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {typeLabels[script.type]} · v{script.versions?.[0]?.version || 1}
          </p>
        </div>
        <Badge className={`shrink-0 text-xs ${statusColors[script.status] || ""}`}>
          {statusLabels[script.status]}
        </Badge>
      </div>

      {script._count?.total > 0 ? (
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Desglose</span>
            <span className="text-foreground font-medium">{script._count.completed}/{script._count.total}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <div className="mb-4 py-2 text-center text-xs text-muted-foreground italic">
          Sin desglose
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border/60" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs text-muted-foreground">
          {script.pageCount ? `~${script.pageCount} min` : "Sin páginas"}
        </span>
        <ArchiveButton
          onArchive={onArchive}
          itemName={`"${script.title}"`}
          size="xs"
          variant="ghost"
          className="text-muted-foreground hover:text-destructive"
          title="Archivar guión"
        />
      </div>
    </div>
  )
}

/* ─── Main Page ─── */
function ScriptsPageContent() {
  const searchParams = useSearchParams()
  const focusId = searchParams.get("focus")
  const { currentProjectId } = useProject()
  const { data: scripts = [], isLoading } = useScripts()
  const createScript = useCreateScript()
  const archiveScript = useArchiveScript()
  const updateScript = useUpdateScript()

  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null)

  // Auto-seleccionar guion desde ?focus=
  useEffect(() => {
    if (focusId && scripts.length > 0) {
      const match = scripts.find((s: any) => s.id === focusId)
      if (match) setSelectedScriptId(focusId)
    }
  }, [focusId, scripts])
  const [createOpen, setCreateOpen] = useState(false)
  const [formTitle, setFormTitle] = useState("")
  const [formFile, setFormFile] = useState<File | null>(null)
  const [formType, setFormType] = useState("LITERARY")
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedScript = scripts.find((s: any) => s.id === selectedScriptId)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim() || !formFile) return
    const fd = new FormData()
    fd.set("title", formTitle)
    fd.set("file", formFile)
    fd.set("type", formType)
    if (currentProjectId) fd.set("projectId", currentProjectId)
    try {
      await createScript.mutateAsync(fd)
      setCreateOpen(false)
      setFormTitle("")
      setFormFile(null)
      setFormType("LITERARY")
    } catch {
      alert("Error al subir guión")
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === "application/pdf") setFormFile(file)
  }

  async function handleArchive(id: string) {
    archiveScript.mutate(id)
    if (selectedScriptId === id) setSelectedScriptId(null)
  }

  async function handleStatusChange(id: string, status: string) {
    await updateScript.mutateAsync({ id, status })
  }

  /* ─── Detail View ─── */
  if (selectedScriptId && selectedScript) {
    return (
      <ScriptDetail
        script={selectedScript}
        onBack={() => setSelectedScriptId(null)}
        onArchive={handleArchive}
        onStatusChange={handleStatusChange}
      />
    )
  }

  /* ─── List View ─── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Guiones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {scripts.length} guion{scripts.length !== 1 ? "es" : ""}
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button>Nuevo guión</Button>} />
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Subir guión</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Nombre del guión" required />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <SelectI18n
                    value={formType}
                    onValueChange={(v) => setFormType(v || "LITERARY")}
                    labels={{ LITERARY: "Literario", TECHNICAL: "Técnico", NARRATIVE: "Narrativo" }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Archivo PDF</Label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors min-h-[160px] ${
                    dragging ? "border-primary bg-primary/5" : formFile ? "border-green-500/40 bg-green-500/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => setFormFile(e.target.files?.[0] || null)} />
                  {formFile ? (
                    <div className="text-center">
                      <p className="font-medium text-foreground">{formFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(formFile.size)}</p>
                      <span onClick={(e) => { e.stopPropagation(); setFormFile(null) }} className="mt-1 inline-block text-xs text-destructive hover:underline cursor-pointer">Quitar</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-3xl mb-2">📄</p>
                      <p className="text-sm font-medium text-foreground">Arrastra tu PDF aquí</p>
                      <p className="text-xs text-muted-foreground">o haz clic para seleccionar</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Dialog Footer Actions */}
              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
                <Button type="button" variant="ghost" onClick={() => { setCreateOpen(false); setFormFile(null) }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createScript.isPending || !formFile || !formTitle.trim()}>
                  {createScript.isPending ? "Subiendo..." : "Subir guión"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">Cargando...</div>
      ) : scripts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground">No hay guiones aún</p>
          <p className="text-xs text-muted-foreground mt-1">Sube tu primer guión para comenzar el desglose</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scripts.map((s: any) => (
            <ScriptCard
              key={s.id}
              script={s}
              onSelect={() => setSelectedScriptId(s.id)}
              onArchive={() => handleArchive(s.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ScriptsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16 text-muted-foreground">Cargando...</div>}>
      <ScriptsPageContent />
    </Suspense>
  )
}

/* ─── Script Detail ─── */
function ScriptDetail({ script, onBack, onArchive, onStatusChange }: { script: any; onBack: () => void; onArchive: (id: string) => void; onStatusChange: (id: string, status: string) => void }) {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack}>← Volver</Button>
        <div className="flex-1 min-w-0 mr-auto">
          <h1 className="text-xl font-bold text-foreground truncate">{script.title}</h1>
          <p className="text-xs text-muted-foreground">
            {typeLabels[script.type]} · v{script.versions?.[0]?.version || 1}{script.pageCount ? ` · ~${script.pageCount} min` : ""}
          </p>
        </div>
        <SelectI18n
          value={script.status}
          onValueChange={(v) => onStatusChange(script.id, (v ?? "DRAFT") as string)}
          labels={{ DRAFT: "Borrador", IN_REVIEW: "En Revisión", LOCKED: "Bloqueado", IN_PRODUCTION: "En Producción" }}
        />
        <Button variant="outline" size="sm" onClick={() => onArchive(script.id)}>Archivar</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="breakdown">Desglose</TabsTrigger>
          <TabsTrigger value="versions">Versiones</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <ScriptOverview script={script} />
        </TabsContent>
        <TabsContent value="breakdown" className="mt-4">
          <ScriptBreakdown scriptId={script.id} script={script} />
        </TabsContent>
        <TabsContent value="versions" className="mt-4">
          <ScriptVersions scriptId={script.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ─── Overview Tab ─── */
function ScriptOverview({ script }: { script: any }) {
  const { data: breakdown = [], isLoading: breakdownLoading } = useScriptBreakdown(script.id)
  const total = breakdown.length
  const completed = breakdown.filter((i: any) => i.status === "COMPLETED").length
  const pending = breakdown.filter((i: any) => i.status === "PENDING").length
  const inProgress = breakdown.filter((i: any) => i.status === "IN_PROGRESS").length
  const blocked = breakdown.filter((i: any) => i.status === "BLOCKED").length

  const categories = Object.entries(categoryConfig).map(([key, cfg]) => {
    const items = breakdown.filter((i: any) => i.category === key)
    const done = items.filter((i: any) => i.status === "COMPLETED").length
    return { key, ...cfg, total: items.length, done }
  }).filter((c) => c.total > 0)

  const latestVersion = script.versions?.[0]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { value: total, label: "Elementos", color: "text-foreground" },
          { value: completed, label: "Completados", color: "text-green-400" },
          { value: inProgress, label: "En Progreso", color: "text-blue-400" },
          { value: pending, label: "Pendientes", color: "text-gray-400" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Progreso general</span>
            <span className="text-sm text-muted-foreground">{Math.round((completed / total) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${(completed / total) * 100}%` }} />
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <div key={cat.key} className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-lg mb-1">{cat.icon}</p>
              <p className="text-sm font-medium text-foreground">{cat.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{cat.done}/{cat.total}</p>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2">
                <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${cat.total > 0 ? (cat.done / cat.total) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {blocked > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-center">
          <p className="text-sm text-red-400">{blocked} elemento{blocked > 1 ? "s" : ""} bloqueado{blocked > 1 ? "s" : ""}</p>
        </div>
      )}

      {latestVersion && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Versión actual</h3>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground truncate">{latestVersion.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {latestVersion.uploadedBy?.name || "Desconocido"} · {new Date(latestVersion.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <p className="text-xs text-muted-foreground">{formatBytes(latestVersion.fileSize)}</p>
              <a href={latestVersion.filePath} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">Descargar</a>
            </div>
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No hay elementos de desglose aún</p>
          <p className="text-xs text-muted-foreground mt-1">Ve a la pestaña "Desglose" para comenzar a catalogar los elementos del guión</p>
        </div>
      )}
    </div>
  )
}

/* ─── Breakdown Tab ─── */
function ScriptBreakdown({ scriptId, script }: { scriptId: string; script: any }) {
  const [category, setCategory] = useState("")
  const { data: items = [], isLoading } = useScriptBreakdown(scriptId, category || undefined)
  const { data: casting = [] } = useCasting()
  const { data: locations = [] } = useLocations()
  const { data: tasks = [] } = useTasks()
  const createItem = useCreateBreakdownItem()
  const updateItem = useUpdateBreakdownItem()
  const archiveItem = useArchiveBreakdownItem()
  const createTask = useCreateTask()
  const { data: departments = [] } = useDepartments()
  const { data: users = [] } = useUsers()
  const [open, setOpen] = useState(false)
  const [formTitle, setFormTitle] = useState("")
  const [formCategory, setFormCategory] = useState("OTHER")
  const [formScene, setFormScene] = useState("")
  const [formPage, setFormPage] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formStatus, setFormStatus] = useState("PENDING")
  const [formNotes, setFormNotes] = useState("")
  const [activeTab, setActiveTab] = useState<"general" | "notes">("general")
  const [taskOpen, setTaskOpen] = useState(false)
  const [taskItem, setTaskItem] = useState<any>(null)
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDesc, setTaskDesc] = useState("")
  const [taskPriority, setTaskPriority] = useState("MEDIUM")
  const [taskDepartment, setTaskDepartment] = useState("")
  const [taskAssignTo, setTaskAssignTo] = useState<string[]>([])
  const [taskDueDate, setTaskDueDate] = useState("")

  const categories = [
    { value: "", label: "Todas" },
    ...Object.entries(categoryConfig).map(([key, cfg]) => ({ value: key, label: `${cfg.icon} ${cfg.label}` })),
  ]

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim()) return
    await createItem.mutateAsync({
      scriptId, title: formTitle, category: formCategory,
      scene: formScene || null, page: formPage ? parseInt(formPage) : null,
      description: formDesc || null, status: formStatus, notes: formNotes || null,
    })
    setOpen(false)
    setFormTitle(""); setFormCategory("OTHER"); setFormScene(""); setFormPage(""); setFormDesc(""); setFormStatus("PENDING"); setFormNotes("")
    setActiveTab("general")
  }

  function nextTab() { setActiveTab("notes") }
  function prevTab() { setActiveTab("general") }

  function handleCreateTask(item: any) {
    setTaskItem(item)
    setTaskTitle(`[Guion] ${item.title}`)
    setTaskDesc(item.description || `Elemento del guión: ${item.title}`)
    setTaskPriority("MEDIUM")
    setTaskDepartment("")
    setTaskAssignTo([])
    setTaskDueDate("")
    setTaskOpen(true)
  }

  async function handleTaskSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!script.projectId || !taskItem) return
    const created = await createTask.mutateAsync({
      title: taskTitle,
      description: taskDesc || null,
      status: "PENDING",
      priority: taskPriority,
      departmentId: taskDepartment || null,
      assignedToIds: taskAssignTo.length > 0 ? taskAssignTo : undefined,
      dueDate: taskDueDate || null,
      projectId: script.projectId,
    })
    if (created?.id) {
      await updateItem.mutateAsync({ scriptId, itemId: taskItem.id, taskId: created.id })
    }
    setTaskOpen(false)
    setTaskItem(null)
  }

  function getLinkedLabel(item: any) {
    if (!item.linkedId || !item.linkedType) return null
    if (item.linkedType === "casting") {
      const member = casting.find((c: any) => c.id === item.linkedId)
      return member ? `🎭 ${member.name}` : null
    }
    if (item.linkedType === "location") {
      const loc = locations.find((l: any) => l.id === item.linkedId)
      return loc ? `📍 ${loc.name}` : null
    }
    return null
  }

  if (isLoading) return <div className="flex items-center justify-center py-12 text-muted-foreground">Cargando...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <SelectI18n
          value={category}
          onValueChange={(v) => setCategory(v || "")}
          labels={{ "": "Todas", CHARACTER: "Personajes", PROP: "Utilería", WARDROBE: "Vestuario", LOCATION: "Locaciones", VEHICLE: "Vehículos", SFX: "SFX", VFX: "VFX", EXTRA: "Extras", OTHER: "Otros" }}
          placeholder="Categoría"
        />
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setActiveTab("general"); }}>
          <DialogTrigger render={<Button size="sm">Agregar elemento</Button>} />
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Elemento de desglose</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <FormTabs
                tabs={[
                  { id: "general", label: "Detalles" },
                  { id: "notes", label: "Descripción y Notas" },
                ]}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as "general" | "notes")}
              />

              {activeTab === "general" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Nombre" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoría</Label>
                      <SelectI18n
                        value={formCategory}
                        onValueChange={(v) => setFormCategory(v || "OTHER")}
                        labels={{ CHARACTER: "Personajes", PROP: "Utilería", WARDROBE: "Vestuario", LOCATION: "Locaciones", VEHICLE: "Vehículos", SFX: "SFX", VFX: "VFX", EXTRA: "Extras", OTHER: "Otros" }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Escena</Label>
                      <Input value={formScene} onChange={(e) => setFormScene(e.target.value)} placeholder="Escena" />
                    </div>
                    <div className="space-y-2">
                      <Label>Página</Label>
                      <Input value={formPage} onChange={(e) => setFormPage(e.target.value)} placeholder="Pág." type="number" min="1" />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <SelectI18n
                        value={formStatus}
                        onValueChange={(v) => setFormStatus(v || "PENDING")}
                        labels={{ PENDING: "Pendiente", IN_PROGRESS: "En Progreso", COMPLETED: "Completado", BLOCKED: "Bloqueado" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notes" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Descripción..." rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Notas</Label>
                    <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Notas adicionales..." rows={4} />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center border-t border-border pt-4 mt-6">
                <div>
                  {activeTab !== "general" && (
                    <Button type="button" variant="outline" onClick={prevTab}>
                      ← Anterior
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => { setOpen(false); setActiveTab("general"); }}>
                    Cancelar
                  </Button>
                  {activeTab === "general" ? (
                    <Button type="button" onClick={nextTab}>
                      Siguiente →
                    </Button>
                  ) : (
                    <Button type="submit" disabled={createItem.isPending || !formTitle.trim()}>
                      Agregar
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No hay elementos{category ? " en esta categoría" : ""}</p>
          <p className="text-xs text-muted-foreground mt-1">Agrega personajes, utilería, locaciones y más</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Elemento</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Cat.</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Ref.</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-right p-3 font-medium text-muted-foreground w-36">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => {
                const cfg = categoryConfig[item.category] || categoryConfig.OTHER
                const linkedLabel = getLinkedLabel(item)
                return (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span>{cfg.icon}</span>
                        <div>
                          <span className="font-medium text-foreground">{item.title}</span>
                          {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                          {item.notes && <p className="text-xs text-muted-foreground italic">{item.notes}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                    </td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">
                      <div className="space-y-0.5">
                        {item.scene && <span className="text-xs block">Esc. {item.scene}</span>}
                        {item.page && <span className="text-xs block">Pág. {item.page}</span>}
                        {linkedLabel && <span className="text-xs block text-primary">{linkedLabel}</span>}
                        {!item.scene && !item.page && !linkedLabel && <span className="text-xs">—</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      <SelectI18n
                        value={item.status}
                        onValueChange={(v) => updateItem.mutate({ scriptId, itemId: item.id, status: v })}
                        labels={{ PENDING: "Pendiente", IN_PROGRESS: "En Progreso", COMPLETED: "Completado", BLOCKED: "Bloqueado" }}
                      />
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        {!item.taskId && (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => handleCreateTask(item)}
                            title="Crear tarea"
                            className="h-7 px-2 text-xs gap-1"
                          >
                            <span className="text-xs">➕</span> Tarea
                          </Button>
                        )}
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => archiveItem.mutate({ scriptId, itemId: item.id })}
                          title="Eliminar"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <span className="text-xs">🗑️</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Task creation dialog */}
      <Dialog open={taskOpen} onOpenChange={(o) => { if (!o) { setTaskOpen(false); setTaskItem(null) } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Crear tarea desde desglose</DialogTitle></DialogHeader>
          <form onSubmit={handleTaskSubmit} className="space-y-4">
            {taskItem && (
              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1 text-xs">
                <p className="font-medium text-foreground mb-1">Origen: {taskItem.title}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                  {taskItem.scene && <span>Escena: {taskItem.scene}</span>}
                  {taskItem.page && <span>Página: {taskItem.page}</span>}
                  <span>Categoría: {categoryConfig[taskItem.category]?.label || taskItem.category}</span>
                </div>
                {taskItem.notes && <p className="text-muted-foreground italic mt-1">Notas: {taskItem.notes}</p>}
              </div>
            )}
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <SelectI18n
                  value={taskPriority}
                  onValueChange={(v) => setTaskPriority(v || "MEDIUM")}
                  labels={{ LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", URGENT: "Urgente" }}
                />
              </div>
              <div className="space-y-2">
                <Label>Departamento</Label>
                <SelectI18n
                  value={taskDepartment}
                  onValueChange={(v) => setTaskDepartment(v || "")}
                  labels={Object.fromEntries(departments.map((d: any) => [d.id, d.name]))}
                  placeholder="Sin departamento"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Asignar a</Label>
              <div className="flex flex-wrap gap-2">
                {users.filter((u: any) => u.isActive !== false).map((u: any) => (
                  <label key={u.id} className={`flex items-center gap-1.5 text-xs cursor-pointer select-none rounded-lg border px-2.5 py-1.5 transition-colors ${taskAssignTo.includes(u.id) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"}`}>
                    <input
                      type="checkbox"
                      checked={taskAssignTo.includes(u.id)}
                      onChange={(e) => {
                        if (e.target.checked) setTaskAssignTo(prev => [...prev, u.id])
                        else setTaskAssignTo(prev => prev.filter(id => id !== u.id))
                      }}
                      className="h-3.5 w-3.5 rounded-sm border-primary text-primary focus:ring-primary"
                    />
                    {u.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fecha de entrega</Label>
              <Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
              <Button type="button" variant="ghost" onClick={() => { setTaskOpen(false); setTaskItem(null) }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createTask.isPending || !taskTitle.trim()}>
                {createTask.isPending ? "Creando..." : "Crear tarea"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ─── Versions Tab ─── */
function ScriptVersions({ scriptId }: { scriptId: string }) {
  const { data: versions = [], isLoading } = useScriptVersions(scriptId)
  const addVersion = useAddScriptVersion()
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    const fd = new FormData()
    fd.set("file", file)
    if (notes) fd.set("notes", notes)
    await addVersion.mutateAsync({ scriptId, formData: fd })
    setOpen(false)
    setFile(null)
    setNotes("")
  }

  if (isLoading) return <div className="flex items-center justify-center py-12 text-muted-foreground">Cargando...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm">Nueva versión</Button>} />
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Nueva versión</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label>Archivo PDF</Label>
                <div onClick={() => fileInputRef.current?.click()} className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 hover:border-primary/40 transition-colors">
                  <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  {file ? <p className="font-medium text-foreground">{file.name}</p> : <p className="text-sm text-muted-foreground">Seleccionar PDF</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notas de cambio</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="¿Qué cambió?" rows={2} />
              </div>
              {/* Dialog Footer Actions */}
              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={addVersion.isPending || !file}>{addVersion.isPending ? "Subiendo..." : "Subir"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {versions.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No hay versiones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {versions.map((v: any) => (
            <div key={v.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">v{v.version} — {v.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.uploadedBy?.name || "Desconocido"} · {new Date(v.createdAt).toLocaleDateString()}
                  </p>
                  {v.notes && <p className="text-sm text-muted-foreground mt-1">{v.notes}</p>}
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-xs text-muted-foreground">{formatBytes(v.fileSize)}</p>
                  {v.filePath && <a href={v.filePath} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">Descargar</a>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
