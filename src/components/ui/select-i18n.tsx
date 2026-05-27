"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue as SelectValueBase } from "./select"

/**
 * SelectValue — renders inside a <SelectTrigger> to translate enum values.
 *
 * Usage:
 *   <SelectTrigger><SelectValueI18n labels={{ PENDING: "Pendiente" }} /></SelectTrigger>
 */
export function SelectValueI18n({
  labels,
  placeholder,
  className,
}: {
  labels?: Record<string, string>
  placeholder?: string
  className?: string
}) {
  return (
    <SelectValueBase className={className}>
      {(value: any) => {
        const raw = value
        if (raw === undefined || raw === null || raw === "") {
          return <span className="text-muted-foreground">{placeholder ?? ""}</span>
        }
        const key = String(raw)
        if (labels && key in labels) {
          return <span>{labels[key]}</span>
        }
        return <span>{key}</span>
      }}
    </SelectValueBase>
  )
}

/**
 * SelectI18n — full Select wrapper with translated labels.
 *
 * Usage:
 *   <SelectI18n value={status} onValueChange={setStatus} labels={{ PENDING: "Pendiente", ... }} />
 *   <SelectI18n value={status} onValueChange={setStatus} labels={{...}} placeholder="Categoría" items={[
 *     { value: "", label: "Todas" },
 *     { value: "CHARACTER", label: "👤 Personajes" },
 *   ]} />
 */
export function SelectI18n({
  value,
  onValueChange,
  labels,
  placeholder,
  items,
  className,
}: {
  value: string
  onValueChange: (v: string | null) => void
  labels: Record<string, string>
  placeholder?: string
  items?: { value: string; label: string }[]
  className?: string
}) {
  const selectItems = items || Object.entries(labels).map(([v, l]) => ({ value: v, label: l }))

  function handleValueChange(v: string | null) {
    onValueChange(v ?? "")
  }

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger className={className}>
        <SelectValueBase>
          {(val: any) => {
            if (!val) return <span className="text-muted-foreground">{placeholder || ""}</span>
            return <span>{labels[val] || val}</span>
          }}
        </SelectValueBase>
      </SelectTrigger>
      <SelectContent>
        {selectItems.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
