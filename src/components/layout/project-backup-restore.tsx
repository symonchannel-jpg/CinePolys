"use client"

import { useState, useRef } from "react"
import { useProject } from "@/lib/project-context"
import { useBackupProject, useRestoreProject } from "@/lib/api-hooks"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function ProjectBackupRestore() {
  const { currentProjectId, currentProject } = useProject()
  const [open, setOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const backup = useBackupProject()
  const restore = useRestoreProject()

  async function handleExport() {
    if (!currentProjectId) return
    const data = await backup.mutateAsync(currentProjectId)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cinepolis-${currentProject?.name || "project"}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !currentProjectId) return

    try {
      const text = await file.text()
      const backupData = JSON.parse(text)
      await restore.mutateAsync({ projectId: currentProjectId, backup: backupData })
      setOpen(false)
      alert(`Proyecto importado: ${backupData.stats?.totalTasks || 0} tareas, ${backupData.stats?.totalCasting || 0} actores, ${backupData.stats?.totalLocations || 0} locaciones`)
    } catch (err: any) {
      alert(err?.message || "Error al importar el archivo")
    }
    e.target.value = ""
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <button className="flex items-center w-full rounded-md py-1 px-3 gap-2 text-sm text-danger hover:bg-danger/10 transition-colors cursor-pointer" title="Backup">
          <span className="w-5 text-center text-base inline-flex items-center justify-center shrink-0">💾</span>
          <span className="overflow-hidden whitespace-nowrap max-w-40 opacity-100">Backup</span>
        </button>
      } />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Backup del proyecto</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Exportar</h3>
            <p className="text-xs text-muted-foreground">
              Descarga un archivo JSON con todas las tareas, actores, locaciones, guiones y call sheets del proyecto actual.
            </p>
            <Button
              onClick={handleExport}
              disabled={backup.isPending || !currentProjectId}
              className="w-full"
            >
              {backup.isPending ? "Exportando..." : "📥 Exportar proyecto"}
            </Button>
          </div>

          <div className="border-t border-border" />

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Importar</h3>
            <p className="text-xs text-muted-foreground">
              Carga un archivo JSON de backup. Los datos se añadirán al proyecto actual sin borrar lo existente.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
            <Button
              onClick={handleImportClick}
              disabled={restore.isPending || !currentProjectId}
              variant="outline"
              className="w-full"
            >
              {restore.isPending ? "Importando..." : "📤 Importar desde JSON"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
