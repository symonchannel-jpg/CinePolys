"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { FeedItemCard, FeedItemType } from "./FeedItem"

interface FeedPanelProps {
  items: FeedItemType[]
  isLoading: boolean
  onItemClick: (item: FeedItemType) => void
}

export function FeedPanel({ items, isLoading, onItemClick }: FeedPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg border border-border bg-muted/30 animate-pulse" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl mb-3">🎬</span>
        <p className="text-muted-foreground">No hay elementos pendientes en post-producción</p>
        <p className="text-xs text-muted-foreground mt-1">Los cortes y notas aparecerán aquí</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <FeedItemCard
          key={`${item.itemType}-${item.id}`}
          item={item}
          onClick={() => onItemClick(item)}
        />
      ))}
    </div>
  )
}