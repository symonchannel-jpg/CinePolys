"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ArchiveButton } from "@/components/ui/archive-button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useDepartments, useCreateDepartment, useUpdateDepartment, useArchiveDepartment } from "@/lib/api-hooks"

export default function DepartmentsPage() {
  const { data: session } = useSession()
  const role = session?.user?.role
  const isAdmin = role === "ADMIN"

  const { data: departments = [], isLoading } = useDepartments()
  const createDept = useCreateDepartment()
  const updateDept = useUpdateDepartment()
  const archiveDept = useArchiveDepartment()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<{ id: string } | null>(null)
  const [formName, setFormName] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formError, setFormError] = useState("")

  function resetForm() {
    setFormName("")
    setFormDesc("")
    setFormError("")
    setEditTarget(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")
    if (!formName.trim()) { setFormError("El nombre es obligatorio"); return }

    try {
      if (editTarget) {
        await updateDept.mutateAsync({ id: editTarget.id, name: formName, description: formDesc })
      } else {
        await createDept.mutateAsync({ name: formName, description: formDesc })
      }
      setCreateOpen(false)
      resetForm()
    } catch (err: any) {
      setFormError(err?.message || "Error")
    }
  }

  function handleArchive(id: string) {
    archiveDept.mutate(id)
  }

  function openEdit(dept: { id: string; name: string; description: string | null }) {
    setEditTarget({ id: dept.id })
    setFormName(dept.name)
    setFormDesc(dept.description || "")
    setCreateOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Departamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">{departments.length} departamentos</p>
        </div>
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={(o) => { if (!o) resetForm(); setCreateOpen(o) }}>
            <DialogTrigger render={<Button>Nuevo departamento</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editTarget ? "Editar departamento" : "Crear departamento"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Arte, Fotografía..." />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} />
                </div>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); resetForm() }}>Cancelar</Button>
                  <Button type="submit" disabled={createDept.isPending || updateDept.isPending}>{(createDept.isPending || updateDept.isPending) ? "Guardando..." : editTarget ? "Guardar" : "Crear"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : departments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No hay departamentos</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>*]:animate-jelly">
          {departments.map((dept: { id: string; name: string; description: string | null; _count: { users: number; tasks: number } }) => (
            <div key={dept.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{dept.name}</h3>
                  {dept.description && (
                    <p className="text-sm text-muted-foreground mt-1">{dept.description}</p>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(dept)} className="text-xs text-muted-foreground hover:text-foreground">✎</button>
                    <ArchiveButton onArchive={() => handleArchive(dept.id)} itemName={`"${dept.name}"`} size="icon-xs" variant="ghost" className="text-muted-foreground hover:text-destructive" title="Archivar departamento" />
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                <span><strong className="text-foreground">{dept._count.users}</strong> miembros</span>
                <span><strong className="text-foreground">{dept._count.tasks}</strong> tareas</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
