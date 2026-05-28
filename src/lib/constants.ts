export const TASK_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  IN_PROGRESS: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  REVIEW: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  COMPLETED: "bg-green-500/10 text-green-500 border-green-500/20",
  ARCHIVED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
}

export const TASK_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En Progreso",
  REVIEW: "Revisión",
  COMPLETED: "Completada",
  ARCHIVED: "Archivada",
}

export const TASK_STATUS_DOT: Record<string, string> = {
  PENDING: "bg-yellow-500",
  IN_PROGRESS: "bg-blue-500",
  REVIEW: "bg-purple-500",
  COMPLETED: "bg-green-500",
}

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-500/10 text-gray-400",
  MEDIUM: "bg-blue-500/10 text-blue-400",
  HIGH: "bg-orange-500/10 text-orange-400",
  URGENT: "bg-red-500/10 text-red-400",
}

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
}

export const SCRIPT_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  IN_REVIEW: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  LOCKED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  IN_PRODUCTION: "bg-green-500/10 text-green-400 border-green-500/20",
}

export const SCRIPT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  IN_REVIEW: "En Revisión",
  LOCKED: "Bloqueado",
  IN_PRODUCTION: "En Producción",
}
