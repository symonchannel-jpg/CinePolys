"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ArchiveButton } from "@/components/ui/archive-button"
import { FolderOpenIcon } from "lucide-react"

type Cut = { id: string; name: string; version: number }

interface CutsListProps {
  cuts: Cut[]
  selectedCutId: string
  onSelectCut: (cutId: string) => void
  onArchiveCut: (cutId: string) => void
}

export function CutsList({ cuts, selectedCutId, onSelectCut, onArchiveCut }: CutsListProps) {
  if (cuts.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Cortes Activos ({cuts.length})
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {cuts.map((cut) => {
          const isSelected = selectedCutId === cut.id
          return (
            <div
              key={cut.id}
              className={cn(
                "p-4 rounded-lg border transition-all duration-200 relative group",
                isSelected
                  ? "bg-card border-primary ring-1 ring-primary/20 shadow-sm"
                  : "bg-card border-border hover:border-primary/40 hover:shadow-sm"
              )}
            >
              <button
                onClick={() => onSelectCut(isSelected ? "all" : cut.id)}
                className="text-left w-full cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <FolderOpenIcon className="size-3.5 text-primary shrink-0" />
                      <span className="truncate">{cut.name}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">Versión {cut.version}</p>
                  </div>
                  {isSelected && (
                    <Badge className="bg-primary/10 text-primary text-[9px] shrink-0">Activo</Badge>
                  )}
                </div>
              </button>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArchiveButton
                  onArchive={() => onArchiveCut(cut.id)}
                  itemName="este corte"
                  size="icon-xs"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Archivar corte"
                  confirmTitle="Archivar corte"
                  confirmLabel="Archivar"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}