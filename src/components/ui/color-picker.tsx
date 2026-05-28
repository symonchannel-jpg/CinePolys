"use client"

import { cn } from "@/lib/utils"

const PRESET_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#0ea5e9",
  "#ef4444",
  "#64748b",
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex flex-wrap gap-2 items-center">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className="h-8 w-8 rounded-full border border-border cursor-pointer transition-all duration-200 hover:scale-110 flex items-center justify-center relative shrink-0"
            style={{ backgroundColor: color }}
            aria-label={`Color ${color}`}
            aria-pressed={value === color}
          >
            {value === color && (
              <span className="h-2 w-2 rounded-full bg-white shadow-sm" />
            )}
          </button>
        ))}
        <label className="h-8 px-3 rounded-full border border-border bg-muted/40 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-all duration-200 flex items-center gap-1.5 shrink-0 select-none">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
          <span
            className="h-3 w-3 rounded-full border border-border/50"
            style={{ backgroundColor: PRESET_COLORS.includes(value) ? "#ffffff" : value }}
          />
          Personalizado
        </label>
      </div>
    </div>
  )
}
