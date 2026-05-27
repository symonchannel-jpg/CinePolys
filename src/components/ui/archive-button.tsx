"use client"

import { useState } from "react"
import { Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface ArchiveButtonProps {
  onArchive: () => void
  itemName: string
  className?: string
  size?: "sm" | "default" | "icon" | "icon-sm" | "icon-xs" | "xs"
  variant?: "ghost" | "outline" | "destructive" | "default" | "secondary"
  title?: string
  confirmTitle?: string
  confirmLabel?: string
}

export function ArchiveButton({
  onArchive,
  itemName,
  className,
  size = "icon-sm",
  variant = "ghost",
  title = "Archivar",
  confirmTitle,
  confirmLabel,
}: ArchiveButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        size={size}
        variant={variant}
        className={className}
        title={title}
        onClick={(e) => {
          e?.stopPropagation?.()
          setOpen(true)
        }}
      >
        <Archive size={size === "xs" || size === "icon-xs" ? 12 : 14} />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={confirmTitle || title}
        message={`¿Estás seguro de archivar ${itemName}?`}
        confirmLabel={confirmLabel}
        onConfirm={onArchive}
      />
    </>
  )
}
