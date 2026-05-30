export const TASK_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning border-warning/20",
  IN_PROGRESS: "bg-info/10 text-info border-info/20",
  REVIEW: "bg-warning/10 text-warning border-warning/20",
  COMPLETED: "bg-success/10 text-success border-success/20",
  ARCHIVED: "bg-neutral/10 text-neutral border-neutral/20",
}

export const TASK_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En Progreso",
  REVIEW: "Revisión",
  COMPLETED: "Completada",
  ARCHIVED: "Archivada",
}

export const TASK_STATUS_DOT: Record<string, string> = {
  PENDING: "bg-warning",
  IN_PROGRESS: "bg-info",
  REVIEW: "bg-warning",
  COMPLETED: "bg-success",
}

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-neutral/10 text-neutral",
  MEDIUM: "bg-info/10 text-info",
  HIGH: "bg-warning/10 text-warning",
  URGENT: "bg-danger/10 text-danger",
}

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
}

export const SCRIPT_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-neutral/10 text-neutral border-neutral/20",
  IN_REVIEW: "bg-warning/10 text-warning border-warning/20",
  LOCKED: "bg-info/10 text-info border-info/20",
  IN_PRODUCTION: "bg-success/10 text-success border-success/20",
}

export const SCRIPT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  IN_REVIEW: "En Revisión",
  LOCKED: "Bloqueado",
  IN_PRODUCTION: "En Producción",
}

export const VFX_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-neutral/10 text-neutral border-neutral/20",
  IN_PROGRESS: "bg-info/10 text-info border-info/20",
  REVIEW: "bg-warning/10 text-warning border-warning/20",
  APPROVED: "bg-success/10 text-success border-success/20",
  REJECTED: "bg-danger/10 text-danger border-danger/20",
}

export const VFX_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En Progreso",
  REVIEW: "Revisión",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
}

export const COMPLEXITY_COLORS: Record<string, string> = {
  LOW: "bg-success/10 text-success",
  MEDIUM: "bg-warning/10 text-warning",
  HIGH: "bg-danger/10 text-danger",
}

export const COMPLEXITY_LABELS: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
}

export const CUT_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-neutral/10 text-neutral border-neutral/20",
  IN_REVIEW: "bg-warning/10 text-warning border-warning/20",
  COMPLETED: "bg-success/10 text-success border-success/20",
  ARCHIVED: "bg-danger/10 text-danger border-danger/20",
}

export const CUT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  IN_REVIEW: "En Revisión",
  COMPLETED: "Aprobado / Lock",
  ARCHIVED: "Archivado",
}

export const ADR_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-neutral/10 text-neutral border-neutral/20",
  RECORDED: "bg-info/10 text-info border-info/20",
  MIXED: "bg-primary/10 text-primary border-primary/20",
  APPROVED: "bg-success/10 text-success border-success/20",
}

export const ADR_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  RECORDED: "Grabado",
  MIXED: "Mezclado",
  APPROVED: "Aprobado",
}

export const DELIVERABLE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-neutral/10 text-neutral border-neutral/20",
  IN_PROGRESS: "bg-info/10 text-info border-info/20",
  QC_FAILED: "bg-danger/10 text-danger border-danger/20",
  APPROVED: "bg-success/10 text-success border-success/20",
}

export const DELIVERABLE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En Progreso",
  QC_FAILED: "Falló QC",
  APPROVED: "Aprobado",
}

export const BREAKDOWN_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-neutral/10 text-neutral",
  IN_PROGRESS: "bg-info/10 text-info",
  COMPLETED: "bg-success/10 text-success",
  BLOCKED: "bg-danger/10 text-danger",
}

export const BREAKDOWN_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En Progreso",
  COMPLETED: "Completado",
  BLOCKED: "Bloqueado",
}

export const BREAKDOWN_CATEGORY_COLORS: Record<string, string> = {
  CHARACTER: "text-info",
  PROP: "text-warning",
  WARDROBE: "text-primary",
  LOCATION: "text-success",
  VEHICLE: "text-info",
  SFX: "text-warning",
  VFX: "text-primary",
  EXTRA: "text-success",
  OTHER: "text-neutral",
}

export const BREAKDOWN_CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  CHARACTER: { label: "Personajes", icon: "👤", color: "text-info" },
  PROP: { label: "Utilería", icon: "🔧", color: "text-warning" },
  WARDROBE: { label: "Vestuario", icon: "👔", color: "text-primary" },
  LOCATION: { label: "Locaciones", icon: "📍", color: "text-success" },
  VEHICLE: { label: "Vehículos", icon: "🚗", color: "text-info" },
  SFX: { label: "SFX", icon: "💥", color: "text-warning" },
  VFX: { label: "VFX", icon: "✨", color: "text-primary" },
  EXTRA: { label: "Extras", icon: "👥", color: "text-success" },
  OTHER: { label: "Otros", icon: "📌", color: "text-neutral" },
}

export const DELIVERABLE_TYPE_LABELS: Record<string, string> = {
  MASTER: "Máster Video",
  AUDIO: "Pistas Audio",
  SUBTITLES: "Subtítulos",
  OTHER: "Otros",
}
