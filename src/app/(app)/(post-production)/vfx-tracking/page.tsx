"use client"

import { useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useProject } from "@/lib/project-context"
import { useToast } from "@/components/ui/toast"
import {
  usePostProductionFeed,
  useTogglePostNoteResolve,
  useUpdatePostNote,
  useDeletePostNote,
  useUpdateVFXShot,
  useArchiveVFXShot,
  useArchivePostCut,
} from "@/lib/api-hooks"
import {
  FeedPanel,
  FilterBar,
  SlideOver,
  NoteDetail,
  VFXDetail,
  CreateCutDialog,
  CreateVFXDialog,
  CreateNoteDialog,
  CutsList,
  type FeedItemType,
  type NoteItem,
  type VFXItem,
} from "@/components/modules/post-production"

export default function PostProductionHub() {
  const { data: session } = useSession()
  const { currentProjectId } = useProject()
  const role = (session?.user as any)?.role
  const { toast } = useToast()

  const [selectedCutId, setSelectedCutId] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedStatus, setStatus] = useState("all")
  const [search, setSearch] = useState("")

  const [selectedItem, setSelectedItem] = useState<FeedItemType | null>(null)
  const [slideOverOpen, setSlideOverOpen] = useState(false)

  const { data, isLoading, refetch } = usePostProductionFeed({
    cutId: selectedCutId,
    type: selectedType,
    status: selectedStatus,
    search: search || undefined,
  })

  const toggleResolve = useTogglePostNoteResolve()
  const updateNote = useUpdatePostNote()
  const deleteNote = useDeletePostNote()
  const updateVFX = useUpdateVFXShot()
  const archiveVFX = useArchiveVFXShot()
  const archivePostCut = useArchivePostCut()

  const cuts: { id: string; name: string; version: number }[] = data?.cuts || []
  const allItems: FeedItemType[] = data?.items || []

  const selectedCut = useMemo(() => {
    if (selectedCutId === "all") return null
    return cuts.find((c) => c.id === selectedCutId) || null
  }, [selectedCutId, cuts])

  const noteCount = useMemo(() => allItems.filter((i) => i.itemType === "note").length, [allItems])
  const vfxCount = useMemo(() => allItems.filter((i) => i.itemType === "vfx").length, [allItems])
  const pendingCount = useMemo(
    () => allItems.filter((i) => i.itemType === "note" && i.status === "PENDING").length,
    [allItems]
  )

  function handleItemClick(item: FeedItemType) {
    setSelectedItem(item)
    setSlideOverOpen(true)
  }

  function handleCloseSlideOver() {
    setSlideOverOpen(false)
    setSelectedItem(null)
  }

  async function handleToggleResolve(noteId: string) {
    try {
      await toggleResolve.mutateAsync(noteId)
      refetch()
    } catch {
      toast({ title: "Error al cambiar estado", variant: "error" })
    }
  }

  async function handleUpdateNote(noteId: string, data: { status?: string; content?: string; taskId?: string }) {
    try {
      await updateNote.mutateAsync({ noteId, ...data })
      refetch()
    } catch {
      toast({ title: "Error al actualizar nota", variant: "error" })
    }
  }

  async function handleDeleteNote(noteId: string) {
    try {
      await deleteNote.mutateAsync({ noteId })
      handleCloseSlideOver()
      toast({ title: "Nota eliminada", variant: "success" })
    } catch {
      toast({ title: "Error al eliminar nota", variant: "error" })
    }
  }

  async function handleUpdateVFX(id: string, data: { status?: string; assignedToId?: string | null; description?: string }) {
    try {
      await updateVFX.mutateAsync({ id, ...data })
      refetch()
    } catch {
      toast({ title: "Error al actualizar VFX", variant: "error" })
    }
  }

  async function handleArchiveVFX(id: string) {
    try {
      await archiveVFX.mutateAsync(id)
      handleCloseSlideOver()
      toast({ title: "VFX archivado", variant: "success" })
    } catch {
      toast({ title: "Error al archivar VFX", variant: "error" })
    }
  }

  async function handleArchiveCut(cutId: string) {
    try {
      await archivePostCut.mutateAsync(cutId)
      if (selectedCutId === cutId) setSelectedCutId("all")
      toast({ title: "Corte archivado", variant: "success" })
    } catch {
      toast({ title: "Error al archivar corte", variant: "error" })
    }
  }

  const hasCuts = cuts.length > 0
  const hasAnyContent = hasCuts || allItems.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Post-Producción</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Notas de visionado y tracking de VFX
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CreateVFXDialog onCreated={() => refetch()} />
          <CreateCutDialog onCreated={() => refetch()} />
        </div>
      </div>

      <CutsList
        cuts={cuts}
        selectedCutId={selectedCutId}
        onSelectCut={setSelectedCutId}
        onArchiveCut={handleArchiveCut}
      />

      <FilterBar
        cuts={cuts}
        selectedCutId={selectedCutId}
        onCutChange={setSelectedCutId}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedStatus={selectedStatus}
        onStatusChange={setStatus}
        search={search}
        onSearchChange={setSearch}
        noteCount={noteCount}
        vfxCount={vfxCount}
        pendingCount={pendingCount}
      />

      {selectedCut && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
          <span className="text-sm text-muted-foreground">
            Corte activo: <span className="font-semibold text-foreground">{selectedCut.name} v{selectedCut.version}</span>
          </span>
          <CreateNoteDialog
            cutId={selectedCut.id}
            cutName={`${selectedCut.name} v${selectedCut.version}`}
            onCreated={() => refetch()}
          />
        </div>
      )}

      {!hasAnyContent && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg bg-card">
          <span className="text-4xl mb-3">🎬</span>
          <p className="text-muted-foreground font-medium">No hay nada en post-producción todavía</p>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
            Usá <span className="font-semibold text-foreground">+ Nuevo Corte</span> para crear tu primer corte de montaje.
            Luego seleccionalo y agregá notas de visionado.
          </p>
        </div>
      ) : hasCuts && allItems.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-lg bg-card">
          <span className="text-3xl mb-2">📝</span>
          <p className="text-muted-foreground font-medium">Sin notas ni VFX pendientes</p>
          <p className="text-sm text-muted-foreground mt-1">
            Selecciona un corte arriba o en el filtro para agregar notas de visionado
          </p>
        </div>
      ) : null}

      {(hasCuts && allItems.length > 0) || (!hasCuts && allItems.length > 0) ? (
        <FeedPanel
          items={allItems}
          isLoading={isLoading}
          onItemClick={handleItemClick}
        />
      ) : null}

      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg border border-border bg-muted/30 animate-pulse" />
          ))}
        </div>
      )}

      <SlideOver
        open={slideOverOpen}
        onClose={handleCloseSlideOver}
        title={
          selectedItem?.itemType === "note"
            ? "Nota de Visionado"
            : selectedItem?.itemType === "vfx"
            ? "Plano VFX"
            : "Detalle"
        }
      >
        {selectedItem?.itemType === "note" && (
          <NoteDetail
            note={selectedItem as NoteItem}
            onToggleResolve={handleToggleResolve}
            onUpdate={handleUpdateNote}
            onDelete={handleDeleteNote}
            isResolving={toggleResolve.isPending}
          />
        )}
        {selectedItem?.itemType === "vfx" && (
          <VFXDetail
            vfx={selectedItem as VFXItem}
            onUpdate={handleUpdateVFX}
            onArchive={handleArchiveVFX}
          />
        )}
      </SlideOver>
    </div>
  )
}