// Types for the Shooting Schedule system
// Shared across API routes, hooks, and UI components

export interface ShootingDay {
  id: string
  projectId: string
  dayNumber: number
  date: string
  callTime: string | null
  wrapTime: string | null
  locationId: string | null
  location?: { id: string; name: string } | null
  status: "PLANNED" | "COMPLETED" | "CANCELLED"
  notes: string | null
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  scenes: SceneSchedule[]
  dailyCast: DailyCast[]
  dailyCrew: DailyCrew[]
  callSheet: { id: string; shareToken: string | null } | null
}

export interface SceneSchedule {
  id: string
  shootingDayId: string
  scriptId: string
  script?: { id: string; title: string; type: string }
  sceneNumber: string | null
  pageCount: number
  synopsis: string | null
  setupDesc: string | null
  order: number
  status: "PENDING" | "CONFIRMED" | "CANCELLED"
  notes: string | null
  createdAt: string
  archivedAt: string | null
}

export interface DailyCast {
  id: string
  shootingDayId: string
  castingMemberId: string
  castingMember?: { id: string; name: string; character: string | null }
  callTime: string | null
  status: "PENDING" | "CONFIRMED" | "CANCELLED"
  notes: string | null
}

export interface DailyCrew {
  id: string
  shootingDayId: string
  userId: string
  user?: { id: string; name: string; role: string }
  role: string
  callTime: string | null
  status: "PENDING" | "CONFIRMED" | "CANCELLED"
  hoursWorked: number | null
  notes: string | null
}

export interface CreateShootingDayInput {
  dayNumber: number
  date: string
  callTime?: string
  wrapTime?: string
  locationId?: string
  notes?: string
}

export interface UpdateShootingDayInput {
  dayNumber?: number
  date?: string
  callTime?: string | null
  wrapTime?: string | null
  locationId?: string | null
  status?: "PLANNED" | "COMPLETED" | "CANCELLED"
  notes?: string | null
}

export interface AddSceneInput {
  scriptId: string
  sceneNumber?: string
  pageCount?: number
  synopsis?: string
  setupDesc?: string
  order?: number
}

export interface AddCastInput {
  castingMemberId: string
  callTime?: string
}

export interface AddCrewInput {
  userId: string
  role: string
  callTime?: string
}

// Schedule stats for dashboard
export interface ScheduleStats {
  totalDays: number
  completedDays: number
  plannedDays: number
  cancelledDays: number
  totalScenes: number
  completedScenes: number
  upcomingDays: ShootingDay[]
  progressPercent: number
}
