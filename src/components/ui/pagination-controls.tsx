"use client"

import { Button } from "@/components/ui/button"

interface PaginationControlsProps {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}

export function PaginationControls({ page, totalPages, total, onPageChange }: PaginationControlsProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-4 border-t border-border">
      <p className="text-sm text-muted-foreground">
        {total} resultado{total !== 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ← Anterior
        </Button>
        <span className="text-sm text-muted-foreground px-2">
          Página {page} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente →
        </Button>
      </div>
    </div>
  )
}
