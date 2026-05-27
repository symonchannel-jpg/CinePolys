"use client"

import { Button } from "./button"

interface PrintButtonProps {
  className?: string
  label?: string
}

export function PrintButton({ className, label = "🖨️ Imprimir / Guardar PDF" }: PrintButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={() => window.print()}
      className={className}
    >
      {label}
    </Button>
  )
}
