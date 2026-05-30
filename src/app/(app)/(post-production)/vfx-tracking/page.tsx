"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useProject } from "@/lib/project-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArchiveButton } from "@/components/ui/archive-button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SelectValueI18n } from "@/components/ui/select-i18n"
import { Textarea } from "@/components/ui/textarea"
import {
  useVFXShots,
  useCreateVFXShot,
  useUpdateVFXShot,
  useArchiveVFXShot,
  useUsers,
  usePostCuts,
  useCreatePostCut,
  useUpdatePostCut,
  useArchivePostCut,
  useCreatePostScreeningNote,
  useUpdatePostScreeningNote,
  useDeletePostScreeningNote,
  usePostADRs,
  useCreatePostADR,
  useUpdatePostADR,
  useArchivePostADR,
  usePostDeliverables,
  useCreatePostDeliverable,
  useUpdatePostDeliverable,
  useArchivePostDeliverable,
  useCasting,
  useCreateTask,
} from "@/lib/api-hooks"
import {
  VFX_STATUS_COLORS as vfxStatusColors,
  VFX_STATUS_LABELS as vfxStatusLabels,
  COMPLEXITY_COLORS as complexityColors,
  COMPLEXITY_LABELS as complexityLabels,
  CUT_STATUS_COLORS as cutStatusColors,
  CUT_STATUS_LABELS as cutStatusLabels,
  ADR_STATUS_COLORS as adrStatusColors,
  ADR_STATUS_LABELS as adrStatusLabels,
  DELIVERABLE_STATUS_COLORS as deliverableStatusColors,
  DELIVERABLE_STATUS_LABELS as deliverableStatusLabels,
  DELIVERABLE_TYPE_LABELS as deliverableTypeLabels,
} from "@/lib/constants"

export default function PostProductionHub() {
  const { data: session } = useSession()
  const { currentProjectId } = useProject()
  const role = (session?.user as any)?.role
  const userId = (session?.user as any)?.id || ""
  const canEdit = role === "ADMIN" || role === "HOD"

  // ─── Main Tabs State ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"cuts" | "vfx" | "adr" | "deliverables">("cuts")

  // ─── Load Data via React Query ─────────────────────────────────────────────
  const { data: cuts = [], refetch: refetchCuts } = usePostCuts()
  const { data: shots = [], isLoading: isVFXLoading } = useVFXShots()
  const { data: adrs = [] } = usePostADRs()
  const { data: deliverables = [] } = usePostDeliverables()
  const { data: castData } = useCasting()
  const castingMembers = castData?.items || []
  const { data: users = [] } = useUsers()

  // Mutations
  const createTask = useCreateTask()

  // ─── Montaje (Cuts) States & Handlers ──────────────────────────────────────
  const [selectedCutId, setSelectedCutId] = useState<string | null>(null)
  const [createCutOpen, setCreateCutOpen] = useState(false)
  const [cutName, setCutName] = useState("")
  const [cutVersion, setCutVersion] = useState("1")
  const [cutStatus, setCutStatus] = useState("DRAFT")
  const [cutVideoUrl, setCutVideoUrl] = useState("")
  const [cutNotes, setCutNotes] = useState("")

  const createCut = useCreatePostCut()
  const updateCut = useUpdatePostCut()
  const archiveCut = useArchivePostCut()

  const selectedCut = cuts.find((c: any) => c.id === selectedCutId) || cuts[0]

  async function handleCreateCut(e: React.FormEvent) {
    e.preventDefault()
    if (!cutName.trim()) return
    await createCut.mutateAsync({
      name: cutName,
      version: Number(cutVersion) || 1,
      status: cutStatus,
      videoUrl: cutVideoUrl || null,
      notes: cutNotes || null,
      projectId: currentProjectId,
    })
    setCreateCutOpen(false)
    setCutName("")
    setCutVersion("1")
    setCutStatus("DRAFT")
    setCutVideoUrl("")
    setCutNotes("")
  }

  // ─── Screening Notes States & Handlers ──────────────────────────────────────
  const [noteTimecode, setNoteTimecode] = useState("")
  const [noteCategory, setNoteCategory] = useState("EDIT")
  const [noteContent, setNoteContent] = useState("")

  const createNote = useCreatePostScreeningNote()
  const updateNote = useUpdatePostScreeningNote()
  const deleteNote = useDeletePostScreeningNote()

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCut || !noteTimecode.trim() || !noteContent.trim()) return
    await createNote.mutateAsync({
      cutId: selectedCut.id,
      timecode: noteTimecode,
      category: noteCategory,
      content: noteContent,
    })
    setNoteTimecode("")
    setNoteContent("")
  }

  async function handleToggleNoteResolve(note: any) {
    const newStatus = note.status === "RESOLVED" ? "PENDING" : "RESOLVED"
    await updateNote.mutateAsync({
      cutId: selectedCut.id,
      noteId: note.id,
      status: newStatus,
    })
  }

  async function handleCreateTaskFromNote(note: any) {
    if (!currentProjectId) return
    try {
      const task = await createTask.mutateAsync({
        title: `[Montaje] Nota TC ${note.timecode} - ${selectedCut.name}`,
        description: `Corregir detalle de montaje detectado en corte: ${note.content}\nCategoría: ${note.category}`,
        projectId: currentProjectId,
        createdById: userId,
        status: "PENDING",
        priority: "MEDIUM",
      })

      // Link notes with the new task
      await updateNote.mutateAsync({
        cutId: selectedCut.id,
        noteId: note.id,
        taskId: task.id,
      })
      alert("¡Tarea creada y vinculada exitosamente!")
    } catch (err) {
      console.error(err)
      alert("Error al crear tarea")
    }
  }

  // ─── VFX Tracking States & Handlers ─────────────────────────────────────────
  const [vfxSearch, setVfxSearch] = useState("")
  const [vfxStatusFilter, setVfxStatusFilter] = useState("")
  const [vfxComplexityFilter, setVfxComplexityFilter] = useState("")

  const [createVfxOpen, setCreateVfxOpen] = useState(false)
  const [vfxShotId, setVfxShotId] = useState("")
  const [vfxDesc, setVfxDesc] = useState("")
  const [vfxStatus, setVfxStatus] = useState("PENDING")
  const [vfxComplexity, setVfxComplexity] = useState("MEDIUM")
  const [vfxAssignee, setVfxAssignee] = useState("")
  const [vfxNotes, setVfxNotes] = useState("")

  const createVfx = useCreateVFXShot()
  const updateVfx = useUpdateVFXShot()
  const archiveVfx = useArchiveVFXShot()

  const [vfxEditingId, setVfxEditingId] = useState<string | null>(null)
  const [vfxEditStatus, setVfxEditStatus] = useState("")

  async function handleCreateVfx(e: React.FormEvent) {
    e.preventDefault()
    if (!vfxShotId.trim()) return
    await createVfx.mutateAsync({
      shotId: vfxShotId,
      description: vfxDesc,
      status: vfxStatus,
      complexity: vfxComplexity,
      assignedToId: vfxAssignee || null,
      projectId: currentProjectId,
      notes: vfxNotes,
    })
    setCreateVfxOpen(false)
    setVfxShotId("")
    setVfxDesc("")
    setVfxStatus("PENDING")
    setVfxComplexity("MEDIUM")
    setVfxAssignee("")
    setVfxNotes("")
  }

  async function handleSaveVfxStatus(id: string) {
    await updateVfx.mutateAsync({
      id,
      status: vfxEditStatus,
    })
    setVfxEditingId(null)
  }

  const filteredVfx = shots.filter((s: any) => {
    const matchesSearch = !vfxSearch || s.shotId.toLowerCase().includes(vfxSearch.toLowerCase()) || (s.description || "").toLowerCase().includes(vfxSearch.toLowerCase())
    const matchesStatus = !vfxStatusFilter || s.status === vfxStatusFilter
    const matchesComplexity = !vfxComplexityFilter || s.complexity === vfxComplexityFilter
    return matchesSearch && matchesStatus && matchesComplexity
  })

  // ─── ADR States & Handlers ──────────────────────────────────────────────────
  const [createAdrOpen, setCreateAdrOpen] = useState(false)
  const [adrActorId, setAdrActorId] = useState("")
  const [adrScene, setAdrScene] = useState("")
  const [adrLine, setAdrLine] = useState("")
  const [adrStatus, setAdrStatus] = useState("PENDING")
  const [adrNotes, setAdrNotes] = useState("")

  const createAdr = useCreatePostADR()
  const updateAdr = useUpdatePostADR()
  const archiveAdr = useArchivePostADR()

  async function handleCreateAdr(e: React.FormEvent) {
    e.preventDefault()
    if (!adrActorId || !adrLine.trim()) return
    await createAdr.mutateAsync({
      projectId: currentProjectId,
      castingMemberId: adrActorId,
      scene: adrScene,
      line: adrLine,
      status: adrStatus,
      notes: adrNotes,
    })
    setCreateAdrOpen(false)
    setAdrActorId("")
    setAdrScene("")
    setAdrLine("")
    setAdrStatus("PENDING")
    setAdrNotes("")
  }

  async function handleCreateTaskFromAdr(adr: any) {
    if (!currentProjectId) return
    try {
      const task = await createTask.mutateAsync({
        title: `[ADR] Sesión doblaje: ${adr.castingMember?.character || "Actor"} - Escena ${adr.scene || "—"}`,
        description: `Regrabar diálogo: "${adr.line}"\nActor: ${adr.castingMember?.name}\nNotas: ${adr.notes || "Ninguna"}`,
        projectId: currentProjectId,
        createdById: userId,
        status: "PENDING",
        priority: "HIGH",
      })

      await updateAdr.mutateAsync({
        id: adr.id,
        taskId: task.id,
      })
      alert("¡Sesión programada en Tareas exitosamente!")
    } catch (err) {
      console.error(err)
      alert("Error al programar sesión")
    }
  }

  // ─── Deliverables States & Handlers ────────────────────────────────────────
  const [createDelivOpen, setCreateDelivOpen] = useState(false)
  const [delivName, setDelivName] = useState("")
  const [delivType, setDelivType] = useState("MASTER")
  const [delivStatus, setDelivStatus] = useState("PENDING")
  const [delivAssignee, setDelivAssignee] = useState("")
  const [delivNotes, setDelivNotes] = useState("")

  const createDeliv = useCreatePostDeliverable()
  const updateDeliv = useUpdatePostDeliverable()
  const archiveDeliv = useArchivePostDeliverable()

  async function handleCreateDeliv(e: React.FormEvent) {
    e.preventDefault()
    if (!delivName.trim()) return
    await createDeliv.mutateAsync({
      projectId: currentProjectId,
      name: delivName,
      type: delivType,
      status: delivStatus,
      assignedToId: delivAssignee || null,
      notes: delivNotes,
    })
    setCreateDelivOpen(false)
    setDelivName("")
    setDelivType("MASTER")
    setDelivStatus("PENDING")
    setDelivAssignee("")
    setDelivNotes("")
  }

  async function handleUpdateDelivStatus(id: string, newStatus: string) {
    await updateDeliv.mutateAsync({
      id,
      status: newStatus,
    })
  }

  async function handleUpdateDelivAssignee(id: string, userId: string) {
    await updateDeliv.mutateAsync({
      id,
      assignedToId: userId || null,
    })
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Post-Producción Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control de montaje, visionados de cortes, doblajes (ADR), efectos visuales y control de calidad final.
          </p>
        </div>
      </div>

      {/* Dynamic connected HSL tabs with badge counters */}
      <div className="flex border-b border-border space-x-1 shrink-0 scrollbar-none overflow-x-auto">
        {[
          { id: "cuts" as const, label: "🎬 Sala de Montaje", count: cuts.length },
          { id: "vfx" as const, label: "🌌 Efectos VFX", count: shots.length },
          { id: "adr" as const, label: "🎙️ Doblaje (ADR)", count: adrs.length },
          { id: "deliverables" as const, label: "📦 Entregables & QC", count: deliverables.length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-200 -mb-[2px] whitespace-nowrap",
              activeTab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {t.label}
            <span className="ml-2 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-normal">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT: CUTS & SCREENING ROOM */}
      {activeTab === "cuts" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Cuts list */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Listado de Cortes</h2>
              {canEdit && (
                <Dialog open={createCutOpen} onOpenChange={setCreateCutOpen}>
                  <DialogTrigger render={<Button size="sm">Nuevo Corte</Button>} />
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Registrar Nuevo Corte</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateCut} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nombre del Corte</Label>
                        <Input value={cutName} onChange={(e) => setCutName(e.target.value)} placeholder="Assembly, Rough Cut, Fine Cut, Picture Lock..." required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Versión (Nro)</Label>
                          <Input type="number" min="1" value={cutVersion} onChange={(e) => setCutVersion(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Estado</Label>
                          <Select value={cutStatus} onValueChange={(v) => setCutStatus(v || "DRAFT")}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DRAFT">Borrador</SelectItem>
                              <SelectItem value="IN_REVIEW">En Revisión</SelectItem>
                              <SelectItem value="COMPLETED">Aprobado / Lock</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Enlace de Video (Frame.io / Vimeo)</Label>
                        <Input value={cutVideoUrl} onChange={(e) => setCutVideoUrl(e.target.value)} placeholder="https://..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Notas</Label>
                        <Textarea value={cutNotes} onChange={(e) => setCutNotes(e.target.value)} placeholder="Comentarios generales..." rows={2} />
                      </div>
                      
                      {/* Dialog Footer Actions */}
                      <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setCreateCutOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={createCut.isPending}>
                          {createCut.isPending ? "Creando..." : "Crear Corte"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {cuts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
                No hay cortes registrados en este proyecto.
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {cuts.map((cut: any) => {
                  const isSelected = selectedCut?.id === cut.id
                  return (
                    <div
                      key={cut.id}
                      onClick={() => setSelectedCutId(cut.id)}
                      className={cn(
                        "p-4 rounded-lg border text-left cursor-pointer transition-all duration-200",
                        isSelected
                          ? "bg-card border-primary ring-1 ring-primary/20"
                          : "bg-muted/40 border-border hover:bg-muted/70 hover:translate-x-0.5"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                            {cut.name}
                            <Badge variant="outline" className="text-[10px] font-normal py-0 px-1.5">v{cut.version}</Badge>
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">{cut.notes || "Sin notas adicionales"}</p>
                        </div>
                        <Badge className={cn("text-[10px] uppercase font-bold py-0.5", cutStatusColors[cut.status])}>
                          {cutStatusLabels[cut.status]}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                        <span>{new Date(cut.createdAt).toLocaleDateString()}</span>
                        {cut.videoUrl && (
                          <a href={cut.videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold" onClick={(e) => e.stopPropagation()}>
                            Ver Video ↗
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: Selected cut details & screening notes (connected to Tasks) */}
          <div className="lg:col-span-2 space-y-4">
            {selectedCut ? (
              <div className="rounded-lg border border-border bg-card p-6 space-y-6">
                {/* Header cut */}
                <div className="flex justify-between items-start pb-4 border-b border-border">
                  <div>
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      {selectedCut.name}
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded font-normal">Versión {selectedCut.version}</span>
                    </h2>
                    {selectedCut.videoUrl && (
                      <a href={selectedCut.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block font-mono">
                        📺 {selectedCut.videoUrl}
                      </a>
                    )}
                  </div>
                  {canEdit && (
                    <ArchiveButton onArchive={() => archiveCut.mutate(selectedCut.id)} itemName="este corte" size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" title="Eliminar Corte" confirmTitle="Eliminar Corte" confirmLabel="Eliminar" />
                  )}
                </div>

                {/* Screening Note Form */}
                <div className="bg-muted/30 rounded-lg p-4 border border-border/50 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agregar Nota de Visionado</h3>
                  <form onSubmit={handleAddNote} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Timecode (hh:mm:ss:ff)</Label>
                      <Input value={noteTimecode} onChange={(e) => setNoteTimecode(e.target.value)} placeholder="01:04:12:15" className="h-9 font-mono" required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Categoría</Label>
                      <Select value={noteCategory} onValueChange={(v) => setNoteCategory(v || "EDIT")}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EDIT">🎬 Montaje</SelectItem>
                          <SelectItem value="COLOR">🎨 Color</SelectItem>
                          <SelectItem value="SOUND">🔊 Sonido</SelectItem>
                          <SelectItem value="VFX">🌌 VFX</SelectItem>
                          <SelectItem value="OTHER">📁 Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 md:col-span-2 flex gap-2 items-end">
                      <div className="flex-1 space-y-1">
                        <Label className="text-[10px]">Detalle de la nota</Label>
                        <Input value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Ej. Flash de luz molesto o desincronía audio" className="h-9" required />
                      </div>
                      <Button type="submit" size="default" className="h-9 px-4 shrink-0" disabled={createNote.isPending}>
                        + Agregar
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Screening Notes chronological checklist list */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notas de Visionado</h3>
                  {(!selectedCut.screeningNotes || selectedCut.screeningNotes.length === 0) ? (
                    <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border/70 rounded-lg">
                      No hay notas de visionado registradas en este corte aún. ¡Agrega la primera arriba!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedCut.screeningNotes.map((note: any) => {
                        const isResolved = note.status === "RESOLVED"
                        return (
                          <div
                            key={note.id}
                            className={cn(
                              "p-3 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3 text-left transition-all",
                              isResolved
                                ? "bg-muted/20 border-border/50 opacity-60"
                                : "bg-card border-border hover:border-border-accent"
                            )}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <button
                                onClick={() => handleToggleNoteResolve(note)}
                                className={cn(
                                  "h-5 w-5 rounded border flex items-center justify-center text-xs shrink-0 mt-0.5 transition-colors",
                                  isResolved
                                    ? "bg-success text-white"
                                    : "border-border hover:border-primary/50 bg-muted/40"
                                )}
                              >
                                {isResolved ? "✓" : ""}
                              </button>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono font-bold text-xs bg-muted text-foreground px-2 py-0.5 rounded ring-1 ring-border">
                                    {note.timecode}
                                  </span>
                                  <Badge variant="outline" className="text-[9px] px-1 font-semibold uppercase">
                                    {note.category}
                                  </Badge>
                                </div>
                                <p className={cn("text-sm text-foreground mt-1.5 leading-relaxed", isResolved && "line-through text-muted-foreground")}>
                                  {note.content}
                                </p>
                                <span className="text-[10px] text-muted-foreground mt-1 block">
                                  Creado por {note.createdBy?.name || "—"}
                                </span>
                              </div>
                            </div>

                            {/* Connected task creator for editing workflow */}
                            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                              {note.taskId ? (
                                <Badge className="bg-info/10 text-info border-info/20 text-[10px] font-medium flex items-center gap-1">
                                  ✓ Tarea Vinculada
                                </Badge>
                              ) : (
                                !isResolved && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCreateTaskFromNote(note)}
                                    disabled={createTask.isPending}
                                    className="h-7 text-[10px] px-2 py-0 hover:bg-primary/5 border-primary/20 text-primary"
                                  >
                                    [✓] Crear Tarea General
                                  </Button>
                                )
                              )}
                              {canEdit && (
                                <button
                                  onClick={() => deleteNote.mutate({ cutId: selectedCut.id, noteId: note.id })}
                                  className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                                  title="Eliminar nota"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground bg-card">
                Selecciona un corte del listado de la izquierda para ver su sala de visionado y notas.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: VFX SHOT TRACKER */}
      {activeTab === "vfx" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Listado de Planos de Efectos Visuales</h2>
            {canEdit && (
              <Dialog open={createVfxOpen} onOpenChange={setCreateVfxOpen}>
                <DialogTrigger render={<Button>Nuevo Plano VFX</Button>} />
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Crear plano VFX</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateVfx} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Shot ID</Label>
                        <Input value={vfxShotId} onChange={(e) => setVfxShotId(e.target.value)} placeholder="SC01_SH010" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Complejidad</Label>
                        <Select value={vfxComplexity} onValueChange={(v) => setVfxComplexity(v || "MEDIUM")}>
                          <SelectTrigger><SelectValueI18n labels={{ LOW: "Baja", MEDIUM: "Media", HIGH: "Alta" }} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Baja</SelectItem>
                            <SelectItem value="MEDIUM">Media</SelectItem>
                            <SelectItem value="HIGH">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Textarea value={vfxDesc} onChange={(e) => setVfxDesc(e.target.value)} placeholder="Descripción del plano..." rows={2} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Estado</Label>
                        <Select value={vfxStatus} onValueChange={(v) => setVfxStatus(v || "PENDING")}>
                          <SelectTrigger><SelectValueI18n labels={{ PENDING: "Pendiente", IN_PROGRESS: "En Progreso", REVIEW: "Revisión", APPROVED: "Aprobado", REJECTED: "Rechazado" }} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pendiente</SelectItem>
                            <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                            <SelectItem value="REVIEW">Revisión</SelectItem>
                            <SelectItem value="APPROVED">Aprobado</SelectItem>
                            <SelectItem value="REJECTED">Rechazado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Asignar a</Label>
                        <Select value={vfxAssignee} onValueChange={(v) => setVfxAssignee(v || "")}>
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
                      <Textarea value={vfxNotes} onChange={(e) => setVfxNotes(e.target.value)} placeholder="Notas adicionales..." rows={2} />
                    </div>
                    
                    {/* Dialog Footer Actions */}
                    <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
                      <Button type="button" variant="ghost" onClick={() => setCreateVfxOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createVfx.isPending}>
                        {createVfx.isPending ? "Creando..." : "Crear Plano"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total", count: shots.length, color: "text-foreground" },
              { label: "Pendientes", count: shots.filter((s: any) => s.status === "PENDING").length, color: "text-neutral" },
              { label: "En Progreso", count: shots.filter((s: any) => s.status === "IN_PROGRESS").length, color: "text-info" },
              { label: "En Revisión", count: shots.filter((s: any) => s.status === "REVIEW").length, color: "text-warning" },
              { label: "Aprobados", count: shots.filter((s: any) => s.status === "APPROVED").length, color: "text-success" },
            ].map((st, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-3 text-center">
                <p className={cn("text-2xl font-bold", st.color)}>{st.count}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{st.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Buscar por Shot ID..."
              value={vfxSearch}
              onChange={(e) => setVfxSearch(e.target.value)}
              className="max-w-xs h-9 text-sm"
            />
            <Select value={vfxStatusFilter} onValueChange={(v) => setVfxStatusFilter(v || "")}>
              <SelectTrigger className="w-36 h-9"><SelectValueI18n labels={{ PENDING: "Pendiente", IN_PROGRESS: "En Progreso", REVIEW: "Revisión", APPROVED: "Aprobado", REJECTED: "Rechazado" }} placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                <SelectItem value="REVIEW">Revisión</SelectItem>
                <SelectItem value="APPROVED">Aprobado</SelectItem>
                <SelectItem value="REJECTED">Rechazado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={vfxComplexityFilter} onValueChange={(v) => setVfxComplexityFilter(v || "")}>
              <SelectTrigger className="w-36 h-9"><SelectValueI18n labels={{ LOW: "Baja", MEDIUM: "Media", HIGH: "Alta" }} placeholder="Complejidad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="LOW">Baja</SelectItem>
                <SelectItem value="MEDIUM">Media</SelectItem>
                <SelectItem value="HIGH">Alta</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => { setVfxStatusFilter(""); setVfxComplexityFilter(""); setVfxSearch("") }}>
              Limpiar
            </Button>
          </div>

          {isVFXLoading ? (
            <div className="text-center py-12 text-muted-foreground">Cargando planos...</div>
          ) : filteredVfx.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg bg-card">
              No hay planos VFX que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-3 font-semibold text-muted-foreground">Shot ID</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Descripción</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Estado</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Complejidad</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Asignado</th>
                    {canEdit && <th className="text-right p-3 font-semibold text-muted-foreground">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredVfx.map((shot: any) => (
                    <tr key={shot.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono font-medium">{shot.shotId}</td>
                      <td className="p-3 text-muted-foreground max-w-xs truncate">{shot.description || "—"}</td>
                      <td className="p-3">
                        {vfxEditingId === shot.id ? (
                          <Select value={vfxEditStatus} onValueChange={(v) => setVfxEditStatus(v || "PENDING")}>
                            <SelectTrigger className="h-7 w-28 text-xs"><SelectValueI18n labels={{ PENDING: "Pendiente", IN_PROGRESS: "En Progreso", REVIEW: "Revisión", APPROVED: "Aprobado", REJECTED: "Rechazado" }} /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pendiente</SelectItem>
                              <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                              <SelectItem value="REVIEW">Revisión</SelectItem>
                              <SelectItem value="APPROVED">Aprobado</SelectItem>
                              <SelectItem value="REJECTED">Rechazado</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={cn("text-[10px] font-bold py-0.5", vfxStatusColors[shot.status])}>
                            {vfxStatusLabels[shot.status]}
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded", complexityColors[shot.complexity])}>
                          {complexityLabels[shot.complexity]}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{shot.assignedTo?.name || "Sin asignar"}</td>
                      {canEdit && (
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            {vfxEditingId === shot.id ? (
                              <>
                                <Button size="sm" variant="ghost" className="h-7 text-xs text-primary" onClick={() => handleSaveVfxStatus(shot.id)}>
                                  Guardar
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setVfxEditingId(null)}>
                                  ✕
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setVfxEditingId(shot.id); setVfxEditStatus(shot.status) }}>
                                  Editar
                                </Button>
                                <button onClick={() => archiveVfx.mutate(shot.id)} className="text-muted-foreground hover:text-destructive p-1 transition-colors">
                                  ✕
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ADR & AUDIO RECORDING */}
      {activeTab === "adr" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tracker de Doblaje y ADR</h2>
            {canEdit && (
              <Dialog open={createAdrOpen} onOpenChange={setCreateAdrOpen}>
                <DialogTrigger render={<Button>Nuevo Registro ADR</Button>} />
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Añadir Diálogo para ADR</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateAdr} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Actor / Personaje</Label>
                      <Select value={adrActorId} onValueChange={(v) => setAdrActorId(v || "")} required>
                        <SelectTrigger><SelectValue placeholder="Seleccionar actor del casting..." /></SelectTrigger>
                        <SelectContent>
                          {castingMembers.map((cm: any) => (
                            <SelectItem key={cm.id} value={cm.id}>
                              🎭 {cm.character || "Sin personaje"} ({cm.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Escena</Label>
                        <Input value={adrScene} onChange={(e) => setAdrScene(e.target.value)} placeholder="Ej. Escena 12" />
                      </div>
                      <div className="space-y-2">
                        <Label>Estado Inicial</Label>
                        <Select value={adrStatus} onValueChange={(v) => setAdrStatus(v || "PENDING")}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pendiente</SelectItem>
                            <SelectItem value="RECORDED">Grabado</SelectItem>
                            <SelectItem value="MIXED">Mezclado</SelectItem>
                            <SelectItem value="APPROVED">Aprobado / Ok</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Línea de Diálogo a doblar</Label>
                      <Textarea value={adrLine} onChange={(e) => setAdrLine(e.target.value)} placeholder="Cita exacta que debe regrabarse..." rows={3} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Notas / Razón de ADR</Label>
                      <Input value={adrNotes} onChange={(e) => setAdrNotes(e.target.value)} placeholder="Ej. Micrófono rozó ropa, viento excesivo..." />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setCreateAdrOpen(false)}>Cancelar</Button>
                      <Button type="submit" disabled={createAdr.isPending}>{createAdr.isPending ? "Agregando..." : "Agregar Línea"}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {adrs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground bg-card">
              No hay diálogos pendientes de doblaje o ADR en este proyecto.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {adrs.map((adr: any) => (
                <div key={adr.id} className="rounded-lg border border-border bg-card p-5 space-y-4 relative flex flex-col justify-between">
                  <div>
                    {/* Header: Actor photo and details */}
                    <div className="flex gap-3 items-center pb-3 border-b border-border/50">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center">
                        {adr.castingMember?.profilePhotoUrl ? (
                          <img src={adr.castingMember.profilePhotoUrl} alt={adr.castingMember.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-muted-foreground">🎭</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-foreground truncate">{adr.castingMember?.character || "Sin Personaje"}</h3>
                        <p className="text-xs text-muted-foreground truncate">{adr.castingMember?.name}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <Badge className={cn("text-[9px] uppercase font-bold py-0 px-1.5", adrStatusColors[adr.status])}>
                          {adrStatusLabels[adr.status]}
                        </Badge>
                        {adr.scene && <p className="text-[10px] text-muted-foreground mt-0.5">Escena {adr.scene}</p>}
                      </div>
                    </div>

                    {/* Dialogue details */}
                    <div className="mt-3">
                      <span className="text-[10px] uppercase font-semibold text-primary/70 tracking-wider">Diálogo a Regrabar</span>
                      <blockquote className="text-sm text-foreground italic border-l-2 border-primary/30 pl-3 py-1 mt-1 bg-muted/20 rounded-r font-medium leading-relaxed">
                        "{adr.line}"
                      </blockquote>
                      {adr.notes && (
                        <p className="text-xs text-muted-foreground mt-2 bg-muted/40 p-2 rounded text-left border border-border/30">
                          <strong className="text-[10px] uppercase text-muted-foreground tracking-wider block mb-0.5">Motivo / Notas</strong>
                          {adr.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions & Connections */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                    <div className="flex gap-1.5">
                      {canEdit && (
                        <Select
                          value={adr.status}
                          onValueChange={(status) => updateAdr.mutate({ id: adr.id, status })}
                        >
                          <SelectTrigger className="h-7 w-28 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent className="text-xs">
                            <SelectItem value="PENDING">Pendiente</SelectItem>
                            <SelectItem value="RECORDED">Grabado</SelectItem>
                            <SelectItem value="MIXED">Mezclado</SelectItem>
                            <SelectItem value="APPROVED">Aprobado / Ok</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-right">
                      {adr.taskId ? (
                        <Badge className="bg-info/10 text-info border-info/20 text-[10px] font-medium">
                          ✓ Sesión Agendada
                        </Badge>
                      ) : (
                        canEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateTaskFromAdr(adr)}
                            disabled={createTask.isPending}
                            className="h-7 text-[10px] px-2 py-0 border-primary/20 text-primary"
                          >
                            Programar Grabación
                          </Button>
                        )
                      )}

                      {canEdit && (
                        <ArchiveButton onArchive={() => archiveAdr.mutate(adr.id)} itemName="este registro ADR" size="icon-xs" variant="ghost" className="text-muted-foreground hover:text-destructive" title="Eliminar registro" confirmTitle="Eliminar registro" confirmLabel="Eliminar" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: DELIVERABLES & QC */}
      {activeTab === "deliverables" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Checklist de Entregables Máster y Control de Calidad (QC)</h2>
            {canEdit && (
              <Dialog open={createDelivOpen} onOpenChange={setCreateDelivOpen}>
                <DialogTrigger render={<Button>Nuevo Entregable</Button>} />
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Crear Checklist de Entregable</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateDeliv} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nombre del Entregable (DCP, ProRes, Web...)</Label>
                      <Input value={delivName} onChange={(e) => setDelivName(e.target.value)} placeholder="Ej. DCP Proyección Máster (Estéreo & 5.1)" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Categoría de Entregable</Label>
                        <Select value={delivType} onValueChange={(v) => setDelivType(v || "MASTER")}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MASTER">Máster de Video</SelectItem>
                            <SelectItem value="AUDIO">Audio (Stems/Mezclas)</SelectItem>
                            <SelectItem value="SUBTITLES">Subtítulos / SRT</SelectItem>
                            <SelectItem value="OTHER">Otros Entregables</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Estado de QC</Label>
                        <Select value={delivStatus} onValueChange={(v) => setDelivStatus(v || "PENDING")}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pendiente</SelectItem>
                            <SelectItem value="IN_PROGRESS">En Proceso</SelectItem>
                            <SelectItem value="QC_FAILED">Falló QC</SelectItem>
                            <SelectItem value="APPROVED">Aprobado / Ok</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Responsable / Asignado</Label>
                      <Select value={delivAssignee} onValueChange={(v) => setDelivAssignee(v || "")}>
                        <SelectTrigger><SelectValue placeholder="Asignar tripulante..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sin asignar</SelectItem>
                          {users.map((u: any) => (
                            <SelectItem key={u.id} value={u.id}>👥 {u.name} ({u.role})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Notas Técnicas (Códecs, Resoluciones, etc.)</Label>
                      <Textarea value={delivNotes} onChange={(e) => setDelivNotes(e.target.value)} placeholder="Ej. DCI 4K Flat, audio PCM 24bit..." rows={2} />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setCreateDelivOpen(false)}>Cancelar</Button>
                      <Button type="submit" disabled={createDeliv.isPending}>{createDeliv.isPending ? "Creando..." : "Crear Entregable"}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {deliverables.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground bg-card">
              No hay entregables requeridos para este proyecto actualmente.
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-3 font-semibold text-muted-foreground">Entregable Requerido</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Tipo</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Estado Control de Calidad</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Asignado a</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Notas Técnicas</th>
                    {canEdit && <th className="text-right p-3 font-semibold text-muted-foreground">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {deliverables.map((dl: any) => (
                    <tr key={dl.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                      <td className="p-3 font-bold text-foreground">{dl.name}</td>
                      <td className="p-3 text-muted-foreground text-xs">{deliverableTypeLabels[dl.type]}</td>
                      <td className="p-3">
                        {canEdit ? (
                          <Select
                            value={dl.status}
                            onValueChange={(v) => handleUpdateDelivStatus(dl.id, v)}
                          >
                            <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent className="text-xs">
                              <SelectItem value="PENDING">Pendiente</SelectItem>
                              <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                              <SelectItem value="QC_FAILED">❌ Falló QC</SelectItem>
                              <SelectItem value="APPROVED">✓ Aprobado</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={cn("text-[10px] font-bold py-0.5", deliverableStatusColors[dl.status])}>
                            {deliverableStatusLabels[dl.status]}
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        {canEdit ? (
                          <Select
                            value={dl.assignedToId || ""}
                            onValueChange={(v) => handleUpdateDelivAssignee(dl.id, v)}
                          >
                            <SelectTrigger className="h-7 w-36 text-xs"><SelectValue placeholder="Sin Asignar" /></SelectTrigger>
                            <SelectContent className="text-xs">
                              <SelectItem value="">Sin Asignar</SelectItem>
                              {users.map((u: any) => (
                                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-muted-foreground">{dl.assignedTo?.name || "Sin Asignar"}</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground italic max-w-xs truncate" title={dl.notes}>
                        {dl.notes || "—"}
                      </td>
                      {canEdit && (
                        <td className="p-3 text-right">
                          <ArchiveButton onArchive={() => archiveDeliv.mutate(dl.id)} itemName="este entregable" size="icon-xs" variant="ghost" className="text-muted-foreground hover:text-destructive" title="Eliminar entregable" confirmTitle="Eliminar entregable" confirmLabel="Eliminar" />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
