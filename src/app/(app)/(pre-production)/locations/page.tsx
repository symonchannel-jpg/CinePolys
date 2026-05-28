"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useProject } from "@/lib/project-context"
import { Button } from "@/components/ui/button"
import { ArchiveButton } from "@/components/ui/archive-button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import dynamic from "next/dynamic"
import { useLocations, useCreateLocation, useUpdateLocation, useArchiveLocation } from "@/lib/api-hooks"
import { FormTabs } from "@/components/ui/form-tabs"

const LocationMap = dynamic(() => import("@/components/modules/location-map").then((m) => m.LocationMap), {
  ssr: false,
  loading: () => <div className="h-[280px] rounded-xl border border-border bg-muted/30 flex items-center justify-center text-sm text-muted-foreground">Cargando mapa...</div>,
})

interface Location {
  id: string
  name: string
  address: string | null
  description: string | null
  lat: number | null
  lng: number | null
  images: string
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B"
  return (bytes / 1024).toFixed(1) + " KB"
}

export default function LocationsPage() {
  const { data: session } = useSession()
  const { currentProjectId } = useProject()
  const role = session?.user?.role
  const canEdit = role === "ADMIN" || role === "HOD"

  const { data: locations = [], isLoading } = useLocations()
  const createLocation = useCreateLocation()
  const updateLocation = useUpdateLocation()
  const archiveLocation = useArchiveLocation()

  const [selected, setSelected] = useState<Location | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<"general" | "map" | "gallery">("general")
  const isEditingRef = useRef(false)

  const [formName, setFormName] = useState("")
  const [formAddr, setFormAddr] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formLat, setFormLat] = useState<number | null>(null)
  const [formLng, setFormLng] = useState<number | null>(null)
  const [formImages, setFormImages] = useState<File[]>([])
  const [formExistingImages, setFormExistingImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState("")
  const [expandedMapId, setExpandedMapId] = useState<string | null>(null)
  const [galleryData, setGalleryData] = useState<{ loc: Location; index: number } | null>(null)
  const [addingImagesFor, setAddingImagesFor] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addImageInputRef = useRef<HTMLInputElement>(null)

  function resetForm() {
    setFormName("")
    setFormAddr("")
    setFormDesc("")
    setFormLat(null)
    setFormLng(null)
    setFormImages([])
    setFormExistingImages([])
    setEditing(false)
    setActiveTab("general")
  }

  function nextTab() {
    if (activeTab === "general") setActiveTab("map")
    else if (activeTab === "map") setActiveTab("gallery")
  }
  function prevTab() {
    if (activeTab === "gallery") setActiveTab("map")
    else if (activeTab === "map") setActiveTab("general")
  }

  function openCreate() {
    resetForm()
    setOpen(true)
  }

  function openEdit(loc: Location) {
    isEditingRef.current = true
    setFormName(loc.name)
    setFormAddr(loc.address || "")
    setFormDesc(loc.description || "")
    setFormLat(loc.lat)
    setFormLng(loc.lng)
    setFormExistingImages((loc.images as unknown as string[]) || [])
    setFormImages([])
    setEditing(true)
    setSelected(loc)
    setActiveTab("general")
    setOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")
    if (!formName.trim()) return
    setUploading(true)

    const fd = new FormData()
    fd.set("name", formName)
    fd.set("address", formAddr)
    fd.set("description", formDesc)
    if (formLat !== null) fd.set("lat", String(formLat))
    if (formLng !== null) fd.set("lng", String(formLng))
    if (currentProjectId) fd.set("projectId", currentProjectId)
    if (editing) {
      fd.set("existingImages", JSON.stringify(formExistingImages))
    }
    formImages.forEach((img) => fd.append("images", img))

    try {
      if (editing) {
        await updateLocation.mutateAsync({ id: selected!.id, formData: fd })
      } else {
        await createLocation.mutateAsync(fd)
      }
      setOpen(false)
      resetForm()
    } catch (err: any) {
      setFormError(err?.message || "Error al guardar")
    } finally {
      setUploading(false)
    }
  }

  function handleDelete(id: string) {
    archiveLocation.mutate(id)
  }

  function getMedUrl(thumbUrl: string) {
    return thumbUrl.replace("_thumb.jpg", "_med.jpg")
  }

  function getOrigUrl(thumbUrl: string) {
    return thumbUrl.replace("_thumb.jpg", ".jpg")
  }

  function openGallery(loc: Location, index: number) {
    setGalleryData({ loc, index })
  }

  const closeGallery = useCallback(() => {
    setGalleryData(null)
  }, [])

  function nextImage() {
    if (!galleryData) return
    const imgs = JSON.parse(galleryData.loc.images || "[]")
    setGalleryData({ ...galleryData, index: (galleryData.index + 1) % imgs.length })
  }

  function prevImage() {
    if (!galleryData) return
    const imgs = (galleryData.loc.images as unknown as string[]) || []
    setGalleryData({ ...galleryData, index: (galleryData.index - 1 + imgs.length) % imgs.length })
  }

  async function handleAddImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0 || !addingImagesFor) return

    const loc = locations.find((l: Location) => l.id === addingImagesFor)
    if (!loc) return

    const fd = new FormData()
    fd.set("name", loc.name)
    fd.set("address", loc.address || "")
    fd.set("description", loc.description || "")
    if (loc.lat) fd.set("lat", String(loc.lat))
    if (loc.lng) fd.set("lng", String(loc.lng))
    fd.set("existingImages", loc.images)
    Array.from(files).forEach((img) => fd.append("images", img))

    try {
      await updateLocation.mutateAsync({ id: addingImagesFor, formData: fd })
    } catch {}

    setAddingImagesFor(null)
    if (addImageInputRef.current) addImageInputRef.current.value = ""
  }

  useEffect(() => {
    if (!galleryData) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prevImage()
      else if (e.key === "ArrowRight") nextImage()
      else if (e.key === "Escape") closeGallery()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [galleryData])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Locaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">{locations.length} locacion{locations.length !== 1 ? "es" : ""}</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={(o) => {
            if (o && !isEditingRef.current) resetForm()
            if (!o) { isEditingRef.current = false; setEditing(false); resetForm() }
            setOpen(o)
          }}>
            <DialogTrigger render={<Button>Nueva locación</Button>} />
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? "Editar locación" : "Nueva locación"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                
              {/* Tab Navigation */}
              <FormTabs
                tabs={[
                  { id: "general", label: "Información" },
                  { id: "map", label: "Mapa" },
                  { id: "gallery", label: "Galería" },
                ]}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as "general" | "map" | "gallery")}
              />

                {activeTab === "general" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input value={formName} onChange={(e) => setFormName(e.target.value)} required placeholder="Ej: Plaza Central" />
                      </div>
                      <div className="space-y-2">
                        <Label>Dirección</Label>
                        <Input value={formAddr} onChange={(e) => setFormAddr(e.target.value)} placeholder="Calle, ciudad..." />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={4} placeholder="Notas sobre la locación..." />
                    </div>
                  </div>
                )}

                {activeTab === "map" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-2">
                      <Label>Ubicación en el mapa</Label>
                      <LocationMap
                        lat={formLat}
                        lng={formLng}
                        onPositionChange={(lat, lng) => { setFormLat(lat); setFormLng(lng) }}
                        onAddressFound={(addr) => { if (!formAddr) setFormAddr(addr) }}
                      />
                      {formLat !== null && formLng !== null && (
                        <p className="text-xs text-muted-foreground">
                          Coordenadas: {formLat.toFixed(5)}, {formLng.toFixed(5)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "gallery" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-2">
                      <Label>Imágenes</Label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:border-primary/40 min-h-[160px]"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setFormImages([...formImages, ...Array.from(e.target.files || [])])}
                        />
                        <p className="text-3xl mb-2">📷</p>
                        <p className="text-sm text-muted-foreground">Haz clic o arrastra imágenes</p>
                      </div>

                      {(formExistingImages.length > 0 || formImages.length > 0) && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {formExistingImages.map((url, i) => (
                            <div key={`e-${i}`} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-border">
                              <img src={url} alt="" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setFormExistingImages(formExistingImages.filter((_, j) => j !== i))}
                                className="absolute top-0.5 right-0.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-white"
                              >✕</button>
                            </div>
                          ))}
                          {formImages.map((file, i) => (
                            <div key={`n-${i}`} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-border">
                              <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setFormImages(formImages.filter((_, j) => j !== i))}
                                className="absolute top-0.5 right-0.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-white"
                              >✕</button>
                              <span className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 text-[9px] text-white truncate max-w-full">
                                {formatBytes(file.size)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {formError && <p className="text-sm text-destructive">{formError}</p>}
                
                {/* Dialog Footer Actions */}
                <div className="flex justify-between items-center border-t border-border pt-4 mt-6">
                  <div>
                    {activeTab !== "general" && (
                      <Button type="button" variant="outline" onClick={prevTab}>
                        ← Anterior
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => { setOpen(false); resetForm() }}>
                      Cancelar
                    </Button>
                    {activeTab !== "gallery" ? (
                      <Button type="button" onClick={nextTab}>
                        Siguiente →
                      </Button>
                    ) : (
                      <Button type="submit" disabled={uploading}>
                        {uploading ? "Guardando..." : editing ? "Guardar cambios" : "Crear locación"}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Hidden input for quick image add */}
      <input
        ref={addImageInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleAddImages}
      />

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">Cargando...</div>
      ) : locations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground">No hay locaciones aún</p>
          <p className="text-xs text-muted-foreground mt-1">Agrega locaciones con mapa e imágenes para tu producción</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {locations.map((loc: Location) => {
            const imgs = (loc.images as unknown as string[]) || []
            const preview = imgs[0]

            return (
              <div
                key={loc.id}
                className="group rounded-xl border border-border bg-card overflow-hidden transition-colors hover:bg-muted/20"
              >
                <div className="relative">
                  {preview ? (
                    <div className="h-40 overflow-hidden">
                      <img src={getMedUrl(preview)} alt={loc.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center bg-muted/30">
                      <span className="text-4xl">📍</span>
                    </div>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setAddingImagesFor(loc.id)
                        addImageInputRef.current?.click()
                      }}
                      className="absolute top-1.5 right-1.5 z-10 h-5 w-5 rounded-md border border-white/30 bg-black/40 flex items-center justify-center text-white text-lg leading-none hover:bg-black/60 hover:border-white/50 transition-all opacity-0 group-hover:opacity-100"
                      title="Agregar imágenes"
                    >
                      +
                    </button>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground truncate">{loc.name}</h3>
                      {loc.address && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{loc.address}</p>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => openEdit(loc)}
                          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors text-xs"
                          title="Editar"
                        >✎</button>
                        <ArchiveButton
                          onArchive={() => handleDelete(loc.id)}
                          itemName={`"${loc.name}"`}
                          size="icon-xs"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                          title="Archivar locación"
                        />
                      </div>
                    )}
                  </div>

                  {loc.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{loc.description}</p>
                  )}

                  <div className="mt-3 space-y-2">
                    {imgs.length > 0 && (
                      <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                        <span className="text-xs text-muted-foreground">📷 {imgs.length} imagen{imgs.length !== 1 ? "es" : ""}</span>
                        <button
                          type="button"
                          onClick={() => openGallery(loc, 0)}
                          className="text-xs text-primary hover:underline"
                        >
                          Ver imágenes →
                        </button>
                      </div>
                    )}

                    {loc.lat && loc.lng && (
                      <>
                        {expandedMapId === loc.id ? (
                          <div className="rounded-lg overflow-hidden border border-border relative">
                            <button
                              type="button"
                              onClick={() => setExpandedMapId(null)}
                              className="absolute top-2 right-2 z-[1000] h-6 w-6 rounded-full bg-black/50 flex items-center justify-center text-white text-xs hover:bg-black/70 transition-colors"
                            >✕</button>
                            <LocationMap
                              lat={loc.lat}
                              lng={loc.lng}
                              onPositionChange={() => {}}
                              interactive={false}
                              zoom={14}
                            />
                          </div>
                        ) : (
                          <div className="text-center">
                            <button
                              type="button"
                              onClick={() => setExpandedMapId(loc.id)}
                              className="text-xs text-primary hover:underline"
                            >
                              🌐 Ver mapa
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Image Gallery Carousel */}
      {galleryData && (() => {
        const imgs = (galleryData.loc.images as unknown as string[]) || []
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
            onClick={closeGallery}
          >
            <div
              className="relative flex items-center justify-center w-full h-full p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                type="button"
                onClick={closeGallery}
                className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full bg-black/50 flex items-center justify-center text-white text-sm hover:bg-black/70 transition-colors"
              >
                ✕
              </button>

              {/* Counter */}
              <div className="absolute top-4 left-4 z-10 rounded-full bg-black/50 px-3.5 py-1.5 text-xs text-white/80">
                {galleryData.index + 1} / {imgs.length}
              </div>

              {/* Prev */}
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-4 z-10 h-11 w-11 rounded-full bg-black/40 flex items-center justify-center text-white text-xl hover:bg-black/60 hover:scale-105 transition-all"
              >
                ‹
              </button>

              {/* Image */}
              <img
                src={getOrigUrl(imgs[galleryData.index])}
                alt={galleryData.loc.name}
                className="max-h-[85vh] max-w-full rounded-xl shadow-2xl object-contain select-none"
                draggable={false}
              />

              {/* Next */}
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-4 z-10 h-11 w-11 rounded-full bg-black/40 flex items-center justify-center text-white text-xl hover:bg-black/60 hover:scale-105 transition-all"
              >
                ›
              </button>

              {/* Location name */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-black/50 px-5 py-2 text-sm text-white/90 max-w-[80%] truncate">
                {galleryData.loc.name}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
