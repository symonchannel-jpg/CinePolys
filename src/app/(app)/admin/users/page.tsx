"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArchiveButton } from "@/components/ui/archive-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SelectValueI18n } from "@/components/ui/select-i18n"
import { useAdminUsers, useCreateUser, useUpdateUser, useArchiveUser, useDepartments } from "@/lib/api-hooks"

const roleLabels: Record<string, string> = { ADMIN: "Admin", HOD: "Jefe Depto.", CREW: "Crew" }

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  departmentId: string | null
  department: { id: string; name: string } | null
  createdAt: string
}

export default function AdminUsersPage() {
  const { data: users = [], isLoading } = useAdminUsers()
  const { data: departments = [] } = useDepartments()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const archiveUser = useArchiveUser()

  const [createOpen, setCreateOpen] = useState(false)
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPass, setFormPass] = useState("")
  const [formRole, setFormRole] = useState("CREW")
  const [formDept, setFormDept] = useState("")
  const [formError, setFormError] = useState("")

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")
    if (!formName.trim() || !formEmail.trim() || !formPass.trim()) {
      setFormError("Todos los campos son obligatorios")
      return
    }
    try {
      await createUser.mutateAsync({
        name: formName,
        email: formEmail,
        password: formPass,
        role: formRole,
        departmentId: formDept || null,
      })
      setCreateOpen(false)
      setFormName("")
      setFormEmail("")
      setFormPass("")
      setFormRole("CREW")
      setFormDept("")
    } catch (err: any) {
      setFormError(err?.message || "Error al crear usuario")
    }
  }

  function handleApprove(user: User, role: string | null) {
    if (!role) return
    updateUser.mutate({ id: user.id, isActive: true, newRole: role })
  }

  function handleReject(user: User) {
    archiveUser.mutate(user.id)
  }

  function handleRoleChange(userId: string, role: string | null) {
    if (!role) return
    updateUser.mutate({ id: userId, newRole: role })
  }

  function handleDeptChange(userId: string, deptId: string | null) {
    updateUser.mutate({ id: userId, departmentId: deptId === "none" ? null : deptId })
  }

  function handleArchive(userId: string) {
    archiveUser.mutate(userId)
  }

  const pending = users.filter((u: User) => !u.isActive)
  const active = users.filter((u: User) => u.isActive)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} usuarios registrados</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(o) => { if (!o) { setFormError(""); setFormName(""); setFormEmail(""); setFormPass(""); } setCreateOpen(o) }}>
          <DialogTrigger render={<Button>Crear usuario</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Crear usuario</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label>Nombre</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nombre completo" required /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="tu@email.com" required /></div>
              <div className="space-y-2"><Label>Contraseña</Label><Input type="password" value={formPass} onChange={(e) => setFormPass(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select value={formRole} onValueChange={(v) => setFormRole(v || "CREW")}>
                    <SelectTrigger><SelectValueI18n labels={{ ADMIN: "Admin", HOD: "Jefe Depto.", CREW: "Crew" }} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CREW">Crew</SelectItem>
                      <SelectItem value="HOD">Jefe Depto.</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Departamento</Label>
                  <Select value={formDept} onValueChange={(v) => setFormDept(v || "")}>
                    <SelectTrigger><SelectValue placeholder="Sin depto" /></SelectTrigger>
                    <SelectContent>
                      {departments.map((d: { id: string; name: string }) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createUser.isPending}>{createUser.isPending ? "Creando..." : "Crear"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                Pendientes de aprobación ({pending.length})
              </h2>
              <div className="space-y-2">
                {pending.map((user: User) => (
                  <div key={user.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{user.name}</span>
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 bg-yellow-500/5">Pendiente</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select onValueChange={(role: any) => handleApprove(user, role)}>
                        <SelectTrigger className="w-40"><SelectValueI18n labels={{ ADMIN: "Admin", HOD: "Jefe Depto.", CREW: "Crew" }} placeholder="Aprobar como..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CREW">Crew</SelectItem>
                          <SelectItem value="HOD">Jefe Depto.</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => handleReject(user)} className="text-muted-foreground hover:text-destructive">Rechazar</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Miembros activos ({active.length})
            </h2>
            {active.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay miembros activos</p>
                {pending.length === 0 && <p className="text-sm mt-1">Crea un usuario o aprueba una solicitud pendiente</p>}
              </div>
            ) : (
              <div className="space-y-2">
                {active.map((user: User) => (
                  <div key={user.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:bg-muted/30">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {user.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{user.name}</span>
                        <Badge variant="outline" className="text-xs">{roleLabels[user.role] || user.role}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}{user.department && <span> · {user.department.name}</span>}</p>
                    </div>
                    <Select value={user.role} onValueChange={(role: any) => handleRoleChange(user.id, role)}>
                      <SelectTrigger className="w-36"><SelectValueI18n labels={{ ADMIN: "Admin", HOD: "Jefe Depto.", CREW: "Crew" }} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CREW">Crew</SelectItem>
                        <SelectItem value="HOD">Jefe Depto.</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={user.departmentId || "none"} onValueChange={(v: any) => handleDeptChange(user.id, v)}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="Depto">{user.department?.name || "Sin depto"}</SelectValue></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin depto</SelectItem>
                        {departments.map((d: { id: string; name: string }) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <ArchiveButton onArchive={() => handleArchive(user.id)} itemName={`"${user.name}"`} size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" title="Archivar usuario" confirmTitle="Archivar usuario" confirmLabel="Archivar" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
