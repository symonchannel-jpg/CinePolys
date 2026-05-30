"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

type Cut = { id: string; name: string; version: number }

interface FilterBarProps {
  cuts: Cut[]
  selectedCutId: string
  onCutChange: (cutId: string) => void
  selectedType: string
  onTypeChange: (type: string) => void
  selectedStatus: string
  onStatusChange: (status: string) => void
  search: string
  onSearchChange: (search: string) => void
  noteCount: number
  vfxCount: number
  pendingCount: number
}

export function FilterBar({
  cuts,
  selectedCutId,
  onCutChange,
  selectedType,
  onTypeChange,
  selectedStatus,
  onStatusChange,
  search,
  onSearchChange,
  noteCount,
  vfxCount,
  pendingCount,
}: FilterBarProps) {
  const selectedCutName = useMemo(() => {
    if (selectedCutId === "all") return "Todos los cortes"
    const found = cuts.find((c) => c.id === selectedCutId)
    return found ? `${found.name} v${found.version}` : "Todos los cortes"
  }, [selectedCutId, cuts])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedCutId} onValueChange={(v) => onCutChange(v || "all")}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue>{selectedCutName}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los cortes</SelectItem>
            {cuts.map((cut) => (
              <SelectItem key={cut.id} value={cut.id}>
                {cut.name} v{cut.version}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={(v) => onTypeChange(v || "all")}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="note">📝 Notas ({noteCount})</SelectItem>
            <SelectItem value="vfx">🌌 VFX ({vfxCount})</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={(v) => onStatusChange(v || "all")}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="PENDING">Pendiente ({pendingCount})</SelectItem>
            <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
            <SelectItem value="REVIEW">Revisión</SelectItem>
            <SelectItem value="RESOLVED">Resueltas</SelectItem>
            <SelectItem value="APPROVED">Aprobado</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9"
          />
        </div>

        {(selectedCutId !== "all" || selectedType !== "all" || selectedStatus !== "all" || search) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 text-muted-foreground"
            onClick={() => {
              onCutChange("all")
              onTypeChange("all")
              onStatusChange("all")
              onSearchChange("")
            }}
          >
            Limpiar
          </Button>
        )}
      </div>
    </div>
  )
}