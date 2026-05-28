"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useProject } from "@/lib/project-context"
import { Button } from "@/components/ui/button"
import { ArchiveButton } from "@/components/ui/archive-button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SelectValueI18n } from "@/components/ui/select-i18n"
import { Textarea } from "@/components/ui/textarea"
import { FormTabs } from "@/components/ui/form-tabs"
import {
  useTasks,
  useCreateTask,
  useArchiveTask,
  useDepartments,
  useUsers,
} from "@/lib/api-hooks"
import {
  TASK_STATUS_COLORS as statusColors,
  TASK_STATUS_LABELS as statusLabels,
  PRIORITY_COLORS as priorityColors,
  PRIORITY_LABELS as priorityLabels,
} from "@/lib/constants"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  departmentId: string | null
  department: { id: string; name: string } | null
  assignedTo: { id: string; name: string }[]
  createdBy: { id: string; name: string }
  dueDate: string | null
  createdAt: string
  _count: { comments: number }
}

export default function TasksPage() {
  const { data: session } = useSession()
  const { currentProjectId } = useProject()
  const router = useRouter()
  const role = session?.user?.role
  const canCreate = role === "ADMIN" || role === "HOD"

  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterPriority, setFilterPriority] = useState("")
  const [filterDept, setFilterDept] = useState("")

  const [createOpen, setCreateOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"general" | "assign">("general")
  const [formTitle, setFormTitle] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formPriority, setFormPriority] = useState("MEDIUM")
  const [formDept, setFormDept] = useState("")
  const [formDeptName, setFormDeptName] = useState("")
  const [formAssignees, setFormAssignees] = useState<string[]>([])
  const [formDueDate, setFormDueDate] = useState("")
  const [formError, setFormError] = useState("")

  const { data: tasks = [], isLoading } = useTasks({
    status: filterStatus || undefined,
    priority: filterPriority || undefined,
    departmentId: filterDept || undefined,
  })

  const { data: departments = [] } = useDepartments()
  const { data: users = [] } = useUsers()

  const createTask = useCreateTask()
  const archiveTask = useArchiveTask()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")
    if (!formTitle.trim()) { setFormError("El título es obligatorio"); return }

    try {
      await createTask.mutateAsync({
        title: formTitle,
        description: formDesc,
        priority: formPriority,
        departmentId: formDept || null,
        assignedToIds: formAssignees.length > 0 ? formAssignees : undefined,
        dueDate: formDueDate || null,
        projectId: currentProjectId || "default-project",
      })
      setCreateOpen(false)
      resetForm()
    } catch (err: any) {
      setFormError(err?.message || "Error al crear")
    }
  }

  function handleArchive(id: string) {
    archiveTask.mutate(id)
  }

  function toggleAssignee(userId: string) {
    setFormAssignees(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  function nextTab() { setActiveTab("assign") }
  function prevTab() { setActiveTab("general") }
  
  function resetForm() {
    setFormTitle("")
    setFormDesc("")
    setFormPriority("MEDIUM")
    setFormDept("")
    setFormDeptName("")
    setFormAssignees([])
    setFormDueDate("")
    setActiveTab("general")
  }

  const filtered = tasks.filter((t: { title: string }) =>
    !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tareas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tasks.length} tarea{tasks.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canCreate && (
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger render={<Button>Nueva tarea</Button>} />
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear tarea</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                
                {/* Tab Navigation */}
                <FormTabs
                  tabs={[
                    { id: "general", label: "General" },
                    { id: "assign", label: "Asignación y Fechas" },
                  ]}
                  activeTab={activeTab}
                  onTabChange={(tab) => setActiveTab(tab as "general" | "assign")}
                />

                {activeTab === "general" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título</Label>
                      <Input id="title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Nombre de la tarea" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="desc">Descripción</Label>
                      <Textarea id="desc" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Detalles..." rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Prioridad</Label>
                        <Select value={formPriority} onValueChange={(v) => setFormPriority(v || "MEDIUM")}>
                          <SelectTrigger><SelectValueI18n labels={{ LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", URGENT: "Urgente" }} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Baja</SelectItem>
                            <SelectItem value="MEDIUM">Media</SelectItem>
                            <SelectItem value="HIGH">Alta</SelectItem>
                            <SelectItem value="URGENT">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Departamento</Label>
                        <Select value={formDept} onValueChange={(v) => {
                          setFormDept(v || "")
                          const dept = departments.find((d: { id: string; name: string }) => d.id === (v || ""))
                          setFormDeptName(dept?.name || "")
                        }}>
                          <SelectTrigger><SelectValue placeholder="Sin depto">{formDeptName || "Sin depto"}</SelectValue></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Sin departamento</SelectItem>
                            {departments.map((d: { id: string; name: string }) => (
                              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "assign" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-2">
                      <Label>Asignar a</Label>
                      <div className="rounded-md border border-input bg-background p-3 max-h-[300px] overflow-y-auto space-y-2">
                        {users.map((u: { id: string; name: string }) => (
                          <label key={u.id} className="flex items-center gap-2 cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              checked={formAssignees.includes(u.id)}
                              onChange={() => toggleAssignee(u.id)}
                              className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                            />
                            <span>{u.name}</span>
                          </label>
                        ))}
                        {users.length === 0 && (
                          <span className="text-xs text-muted-foreground">No hay usuarios disponibles</span>
                        )}
                      </div>
                      {formAssignees.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {formAssignees.length} seleccionado{formAssignees.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha límite</Label>
                      <Input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
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
                    <Button type="button" variant="ghost" onClick={() => { setCreateOpen(false); resetForm() }}>
                      Cancelar
                    </Button>
                    {activeTab === "general" ? (
                      <Button type="button" onClick={nextTab}>
                        Siguiente →
                      </Button>
                    ) : (
                      <Button type="submit" disabled={createTask.isPending}>
                        {createTask.isPending ? "Creando..." : "Crear Tarea"}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar tareas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v || "")}>
          <SelectTrigger className="w-36"><SelectValueI18n labels={{ PENDING: "Pendiente", IN_PROGRESS: "En Progreso", REVIEW: "Revisión", COMPLETED: "Completada" }} placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="PENDING">Pendiente</SelectItem>
            <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
            <SelectItem value="REVIEW">Revisión</SelectItem>
            <SelectItem value="COMPLETED">Completada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v || "")}>
          <SelectTrigger className="w-36"><SelectValueI18n labels={{ LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", URGENT: "Urgente" }} placeholder="Prioridad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            <SelectItem value="LOW">Baja</SelectItem>
            <SelectItem value="MEDIUM">Media</SelectItem>
            <SelectItem value="HIGH">Alta</SelectItem>
            <SelectItem value="URGENT">Urgente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterDept} onValueChange={(v) => setFilterDept(v || "")}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Departamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {departments.map((d: { id: string; name: string }) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => { setFilterStatus(""); setFilterPriority(""); setFilterDept(""); setSearchQuery("") }}>
          Limpiar
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {tasks.length === 0 ? "No hay tareas aún" : "Sin resultados para los filtros actuales"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task: Task) => (
            <div
              key={task.id}
              className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50 animate-jelly"
            >
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => router.push(`/tasks/${task.id}`)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground truncate">{task.title}</span>
                  <Badge className={`text-xs ${statusColors[task.status] || ""}`}>
                    {statusLabels[task.status] || task.status}
                  </Badge>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${priorityColors[task.priority] || ""}`}>
                    {priorityLabels[task.priority] || task.priority}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {task.department && <span>{task.department.name}</span>}
                  {task.assignedTo.length > 0 && (
                    <span>Asignado a: {task.assignedTo.map(u => u.name).join(", ")}</span>
                  )}
                  {task.dueDate && <span>Vence: {new Date(task.dueDate).toLocaleDateString("es")}</span>}
                  <span>{task._count.comments} comentario{task._count.comments !== 1 ? "s" : ""}</span>
                </div>
              </div>
              {canCreate && (
                <div onClick={(e) => e.stopPropagation()}>
                  <ArchiveButton
                    onArchive={() => handleArchive(task.id)}
                    itemName={`"${task.title}"`}
                    size="icon-sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    title="Archivar tarea"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
