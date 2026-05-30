"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { COMPLEXITY_COLORS, COMPLEXITY_LABELS, VFX_STATUS_COLORS, VFX_STATUS_LABELS } from "@/lib/constants"

type NoteItem = {
  id: string
  itemType: "note"
  timecode: string
  content: string
  category: string
  status: string
  taskId: string | null
  createdAt: string
  createdBy: { id: string; name: string }
  cut: { id: string; name: string; version: number }
}

type VFXItem = {
  id: string
  itemType: "vfx"
  shotId: string
  description: string | null
  status: string
  complexity: string
  notes: string | null
  createdAt: string
  assignedTo: { id: string; name: string } | null
}

type FeedItemType = NoteItem | VFXItem

const CATEGORY_LABELS: Record<string, string> = {
  EDIT: "🎬 Montaje",
  COLOR: "🎨 Color",
  SOUND: "🔊 Sonido",
  VFX: "🌌 VFX",
  OTHER: "📁 Otro",
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  RESOLVED: "Resuelta",
  IN_PROGRESS: "En Progreso",
  REVIEW: "Revisión",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
}

interface FeedItemCardProps {
  item: FeedItemType
  onClick: () => void
}

export function FeedItemCard({ item, onClick }: FeedItemCardProps) {
  if (item.itemType === "note") {
    const note = item as NoteItem
    const isResolved = note.status === "RESOLVED"
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left p-4 rounded-lg border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-sm",
          isResolved ? "opacity-60 border-border/50" : "border-border"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex flex-col items-center shrink-0 mt-0.5">
              <span className={cn("w-5 h-5 rounded-full border flex items-center justify-center text-xs", isResolved ? "bg-success border-success text-white" : "border-border")}>
                {isResolved ? "✓" : ""}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold bg-muted text-foreground px-2 py-0.5 rounded ring-1 ring-border">
                  {note.timecode}
                </span>
                <Badge variant="outline" className="text-[9px] px-1.5 font-semibold uppercase">
                  {CATEGORY_LABELS[note.category] || note.category}
                </Badge>
                <Badge variant="outline" className="text-[9px] font-normal">
                  {note.cut.name} v{note.cut.version}
                </Badge>
              </div>
              <p className={cn("text-sm leading-relaxed", isResolved ? "line-through text-muted-foreground" : "text-foreground")}>
                {note.content}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {note.createdBy.name} · {new Date(note.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          {note.taskId && (
            <Badge className="bg-info/10 text-info border-info/20 text-[10px] shrink-0">✓ Tarea</Badge>
          )}
        </div>
      </button>
    )
  }

  const vfx = item as VFXItem
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg border border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="shrink-0 mt-0.5">
            <span className="text-base">🌌</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-foreground">{vfx.shotId}</span>
              <Badge className={cn("text-[10px] font-bold py-0.5", VFX_STATUS_COLORS[vfx.status])}>
                {VFX_STATUS_LABELS[vfx.status]}
              </Badge>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded", COMPLEXITY_COLORS[vfx.complexity])}>
                {COMPLEXITY_LABELS[vfx.complexity]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {vfx.description || "Sin descripción"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {vfx.assignedTo?.name || "Sin asignar"}
            </p>
          </div>
        </div>
      </div>
    </button>
  )
}

export type { FeedItemType, NoteItem, VFXItem }