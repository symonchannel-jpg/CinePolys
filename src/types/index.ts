export type Role = "ADMIN" | "HOD" | "CREW"
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ARCHIVED"
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
  departmentId: string | null
  isActive: boolean
}

export interface SearchResult {
  id: string
  title: string
  type: "task" | "script" | "location" | "user" | "department"
  subtitle?: string
  href: string
}
