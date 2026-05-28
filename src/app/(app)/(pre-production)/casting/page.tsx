"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useProject } from "@/lib/project-context"
import { Button } from "@/components/ui/button"
import { ArchiveButton } from "@/components/ui/archive-button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useCasting, useCreateCasting, useUpdateCasting, useArchiveCasting } from "@/lib/api-hooks"
import { FormTabs } from "@/components/ui/form-tabs"

interface CastingMember {
  id: string
  name: string
  character: string | null
  contact: string | null
  notes: string | null
  profilePhotoUrl?: string | null
  createdAt: string
}

function MemberPhoto({ url, name }: { url?: string | null; name: string }) {
  if (url) {
    const src = url.startsWith("http") || url.startsWith("/") ? url : `/${url}`
    return <img src={src} alt={name} className="h-full w-full object-cover" />
  }
  return (
    <span className="text-lg font-bold text-muted-foreground">
      {name[0]?.toUpperCase() || "?"}
    </span>
  )
}

export default function CastingPage() {
  const { data: session } = useSession()
  const { currentProjectId } = useProject()
  const role = session?.user?.role
  const canEdit = role === "ADMIN" || role === "HOD"

  const { data: members = [], isLoading } = useCasting()
  const createCasting = useCreateCasting()
  const updateCasting = useUpdateCasting()
  const archiveCasting = useArchiveCasting()

  const [openCreate, setOpenCreate] = useState(false)
  const [activeCreateTab, setActiveCreateTab] = useState<"general" | "photo">("general")
  const [formName, setFormName] = useState("")
  const [formChar, setFormChar] = useState("")
  const [formContact, setFormContact] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [formPhoto, setFormPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const [openEdit, setOpenEdit] = useState(false)
  const [activeEditTab, setActiveEditTab] = useState<"general" | "photo">("general")
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editChar, setEditChar] = useState("")
  const [editContact, setEditContact] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [editPhoto, setEditPhoto] = useState<File | null>(null)
  const [editPreview, setEditPreview] = useState<string | null>("")
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null)

  function nextCreateTab() { setActiveCreateTab("photo") }
  function prevCreateTab() { setActiveCreateTab("general") }
  function nextEditTab() { setActiveEditTab("photo") }
  function prevEditTab() { setActiveEditTab("general") }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim()) return
    const fd = new FormData()
    fd.append("name", formName)
    fd.append("character", formChar)
    fd.append("contact", formContact)
    fd.append("notes", formNotes)
    if (formPhoto) fd.append("profilePhoto", formPhoto)
    if (currentProjectId) fd.append("projectId", currentProjectId)

    try {
      await createCasting.mutateAsync(fd)
      setOpenCreate(false)
      setFormName(""); setFormChar(""); setFormContact(""); setFormNotes(""); setFormPhoto(null); setPreview(null)
      setActiveCreateTab("general")
    } catch {
      alert("Error al crear actor")
    }
  }

  function handleEditOpen(member: CastingMember) {
    setEditId(member.id)
    setEditName(member.name)
    setEditChar(member.character || "")
    setEditContact(member.contact || "")
    setEditNotes(member.notes || "")
    setCurrentPhotoUrl(member.profilePhotoUrl || null)
    setEditPreview(member.profilePhotoUrl || null)
    setEditPhoto(null)
    setActiveEditTab("general")
    setOpenEdit(true)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editId) return
    const fd = new FormData()
    fd.append("name", editName)
    fd.append("character", editChar)
    fd.append("contact", editContact)
    fd.append("notes", editNotes)
    if (editPhoto) fd.append("profilePhoto", editPhoto)

    try {
      await updateCasting.mutateAsync({ id: editId, formData: fd })
      setOpenEdit(false)
      setEditId(null); setEditPhoto(null); setEditPreview("")
    } catch {
      alert("Error al actualizar actor")
    }
  }

  function handleDelete(id: string) {
    archiveCasting.mutate(id)
  }

  function handlePhotoDrop(e: React.DragEvent, setFile: (f: File | null) => void, setPrev: (s: string | null) => void) {
    e.preventDefault()
    e.currentTarget.classList.remove("border-primary")
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      setFile(file)
      setPrev(URL.createObjectURL(file))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Casting</h1>
          <p className="text-sm text-muted-foreground mt-1">{members.length} actor{members.length !== 1 ? "es" : ""}</p>
        </div>
        {canEdit && (
          <Dialog open={openCreate} onOpenChange={(o) => { setOpenCreate(o); if (!o) setActiveCreateTab("general"); }}>
            <DialogTrigger render={<Button>Añadir actor</Button>} />
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Añadir actor/actriz</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                
              {/* Tab Navigation */}
              <FormTabs
                tabs={[
                  { id: "general", label: "Perfil General" },
                  { id: "photo", label: "Fotografía" },
                ]}
                activeTab={activeCreateTab}
                onTabChange={(tab) => setActiveCreateTab(tab as "general" | "photo")}
              />

                {activeCreateTab === "general" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input value={formName} onChange={(e) => setFormName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Personaje</Label>
                        <Input value={formChar} onChange={(e) => setFormChar(e.target.value)} placeholder="Rol en la producción" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Contacto</Label>
                      <Input value={formContact} onChange={(e) => setFormContact(e.target.value)} placeholder="Teléfono / email" />
                    </div>
                    <div className="space-y-2">
                      <Label>Notas</Label>
                      <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} />
                    </div>
                  </div>
                )}

                {activeCreateTab === "photo" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-2">
                      <Label>Foto de perfil (opcional)</Label>
                      <div
                        onClick={() => document.getElementById("photo-input")?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-primary") }}
                        onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-primary") }}
                        onDrop={(e) => handlePhotoDrop(e, setFormPhoto, setPreview)}
                        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:border-primary/40 min-h-[160px]"
                      >
                        <input
                          id="photo-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null
                            setFormPhoto(f)
                            if (f) setPreview(URL.createObjectURL(f))
                            else setPreview(null)
                          }}
                        />
                        {preview ? (
                          <div className="relative h-24 w-24">
                            <img src={preview} alt="preview" className="h-full w-full object-cover rounded-lg border" />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setFormPhoto(null); setPreview(null) }}
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white text-xs flex items-center justify-center hover:bg-destructive/90 transition-colors"
                            >✕</button>
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <p className="text-3xl mb-2">📷</p>
                            <p className="text-sm text-muted-foreground">Haz clic o arrastra una imagen</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Dialog Footer Actions */}
                <div className="flex justify-between items-center border-t border-border pt-4 mt-6">
                  <div>
                    {activeCreateTab !== "general" && (
                      <Button type="button" variant="outline" onClick={prevCreateTab}>
                        ← Anterior
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => { setOpenCreate(false); setActiveCreateTab("general"); }}>
                      Cancelar
                    </Button>
                    {activeCreateTab === "general" ? (
                      <Button type="button" onClick={nextCreateTab}>
                        Siguiente →
                      </Button>
                    ) : (
                      <Button type="submit" disabled={createCasting.isPending}>
                        {createCasting.isPending ? "Añadiendo..." : "Añadir Actor"}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">Cargando...</div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground">No hay actores aún</p>
          <p className="text-xs text-muted-foreground mt-1">Añade tu elenco para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {members.map((m: CastingMember) => (
            <div key={m.id} className="rounded-xl border border-border bg-card p-5 hover:bg-muted/30 transition-colors relative group">
              {canEdit && (
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="outline" className="h-7 w-7 text-xs" onClick={() => handleEditOpen(m)} title="Editar">✏️</Button>
                  <ArchiveButton
                    onArchive={() => handleDelete(m.id)}
                    itemName={`"${m.name}"`}
                    size="icon-sm"
                    variant="destructive"
                    className="h-7 w-7"
                    title="Archivar actor"
                    confirmTitle="Archivar actor"
                    confirmLabel="Archivar"
                  />
                </div>
              )}
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden mb-3">
                  <MemberPhoto url={m.profilePhotoUrl} name={m.name} />
                </div>
                <p className="font-medium text-foreground truncate w-full">{m.name}</p>
                {m.character && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate w-full">como {m.character}</p>
                )}
                {m.contact && (
                  <p className="text-xs text-muted-foreground mt-2">📞 {m.contact}</p>
                )}
                {m.notes && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={openEdit} onOpenChange={(o) => { setOpenEdit(o); if (!o) setActiveEditTab("general"); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar actor</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            
            {/* Tab Navigation */}
            <FormTabs
              tabs={[
                { id: "general", label: "Perfil General" },
                { id: "photo", label: "Fotografía" },
              ]}
              activeTab={activeEditTab}
              onTabChange={(tab) => setActiveEditTab(tab as "general" | "photo")}
            />

            {activeEditTab === "general" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Personaje</Label>
                    <Input value={editChar} onChange={(e) => setEditChar(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Contacto</Label>
                  <Input value={editContact} onChange={(e) => setEditContact(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} />
                </div>
              </div>
            )}

            {activeEditTab === "photo" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="space-y-2">
                  <Label>Foto de perfil (opcional)</Label>
                  <div
                    onClick={() => document.getElementById("edit-photo-input")?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-primary") }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove("border-primary") }}
                    onDrop={(e) => handlePhotoDrop(e, setEditPhoto, setEditPreview)}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:border-primary/40 min-h-[160px]"
                  >
                    <input
                      id="edit-photo-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null
                        setEditPhoto(f)
                        if (f) setEditPreview(URL.createObjectURL(f))
                      }}
                    />
                    {(editPreview || currentPhotoUrl) ? (
                      <div className="relative h-24 w-24">
                        <img src={editPreview || (currentPhotoUrl?.startsWith("/") ? currentPhotoUrl : `/${currentPhotoUrl}`) || ""} alt="preview" className="h-full w-full object-cover rounded-lg border" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setEditPhoto(null); setEditPreview(""); setCurrentPhotoUrl(null); }}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white text-xs flex items-center justify-center hover:bg-destructive/90 transition-colors"
                        >✕</button>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-3xl mb-2">📷</p>
                        <p className="text-sm text-muted-foreground">Haz clic o arrastra una imagen</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Dialog Footer Actions */}
            <div className="flex justify-between items-center border-t border-border pt-4 mt-6">
              <div>
                {activeEditTab !== "general" && (
                  <Button type="button" variant="outline" onClick={prevEditTab}>
                    ← Anterior
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => { setOpenEdit(false); setActiveEditTab("general"); }}>
                  Cancelar
                </Button>
                {activeEditTab === "general" ? (
                  <Button type="button" onClick={nextEditTab}>
                    Siguiente →
                  </Button>
                ) : (
                  <Button type="submit" disabled={updateCasting.isPending}>
                    {updateCasting.isPending ? "Guardando..." : "Guardar cambios"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
