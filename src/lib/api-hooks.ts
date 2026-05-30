"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useProject } from "@/lib/project-context"

// ─── Projects ───────────────────────────────────────────────────────────────

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => fetch("/api/projects").then((r) => r.json()),
    staleTime: 60_000,
  })
}

export function useProjectById(id: string | undefined) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => fetch(`/api/projects/${id}`).then((r) => r.json()),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, any>) =>
      fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, any>) =>
      fetch(`/api/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["projects"] })
      qc.invalidateQueries({ queryKey: ["project", id] })
    },
  })
}

export function useArchiveProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetch(`/api/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  })
}

// ─── Tasks ──────────────────────────────────────────────────────────────────

export function useTasks(filters?: Record<string, string | undefined>) {
  const { currentProjectId } = useProject()
  const params = new URLSearchParams()
  if (currentProjectId) params.set("projectId", currentProjectId)
  if (filters?.status) params.set("status", filters.status)
  if (filters?.priority) params.set("priority", filters.priority)
  if (filters?.departmentId) params.set("departmentId", filters.departmentId)
  if (filters?.search) params.set("search", filters.search)
  if (filters?.page) params.set("page", filters.page)
  if (filters?.limit) params.set("limit", filters.limit)

  return useQuery({
    queryKey: ["tasks", params.toString()],
    queryFn: () => fetch(`/api/tasks?${params}`).then((r) => r.json()),
    staleTime: 30_000,
  })
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => fetch(`/api/tasks/${id}`).then((r) => r.json()),
    enabled: !!id,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, any>) =>
      fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, any>) =>
      fetch(`/api/tasks/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["tasks"] })
      qc.invalidateQueries({ queryKey: ["task", id] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}

export function useArchiveTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetch(`/api/tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}

// ─── Casting ────────────────────────────────────────────────────────────────

export function useCasting(filters?: Record<string, string | undefined>) {
  const { currentProjectId } = useProject()
  const params = new URLSearchParams()
  if (currentProjectId) params.set("projectId", currentProjectId)
  if (filters?.page) params.set("page", filters.page)
  if (filters?.limit) params.set("limit", filters.limit)

  return useQuery({
    queryKey: ["casting", params.toString()],
    queryFn: () => fetch(`/api/casting?${params}`).then((r) => r.json()),
    staleTime: 30_000,
  })
}

export function useCreateCasting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) =>
      fetch("/api/casting", { method: "POST", body: formData }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["casting"] }),
  })
}

export function useUpdateCasting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      fetch(`/api/casting/${id}`, { method: "PATCH", body: formData }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["casting"] }),
  })
}

export function useArchiveCasting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetch(`/api/casting/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["casting"] }),
  })
}

// ─── Locations ──────────────────────────────────────────────────────────────

export function useLocations(filters?: Record<string, string | undefined>) {
  const { currentProjectId } = useProject()
  const params = new URLSearchParams()
  if (currentProjectId) params.set("projectId", currentProjectId)
  if (filters?.page) params.set("page", filters.page)
  if (filters?.limit) params.set("limit", filters.limit)

  return useQuery({
    queryKey: ["locations", params.toString()],
    queryFn: () => fetch(`/api/locations?${params}`).then((r) => r.json()),
    staleTime: 30_000,
  })
}

export function useCreateLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) =>
      fetch("/api/locations", { method: "POST", body: formData }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }),
  })
}

export function useUpdateLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      fetch(`/api/locations/${id}`, { method: "PATCH", body: formData }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }),
  })
}

export function useArchiveLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetch(`/api/locations/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }),
  })
}

// ─── Scripts ────────────────────────────────────────────────────────────────

export function useScripts(filters?: Record<string, string | undefined>) {
  const { currentProjectId } = useProject()
  const params = new URLSearchParams()
  if (currentProjectId) params.set("projectId", currentProjectId)
  if (filters?.page) params.set("page", filters.page)
  if (filters?.limit) params.set("limit", filters.limit)

  return useQuery({
    queryKey: ["scripts", params.toString()],
    queryFn: () => fetch(`/api/scripts?${params}`).then((r) => r.json()),
    staleTime: 30_000,
  })
}

export function useScript(id: string | undefined) {
  return useQuery({
    queryKey: ["script", id],
    queryFn: () => fetch(`/api/scripts/${id}`).then((r) => r.json()),
    enabled: !!id,
  })
}

export function useCreateScript() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) =>
      fetch("/api/scripts", { method: "POST", body: formData }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scripts"] }),
  })
}

export function useUpdateScript() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, any>) =>
      fetch(`/api/scripts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["scripts"] })
      qc.invalidateQueries({ queryKey: ["script", id] })
    },
  })
}

export function useArchiveScript() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetch(`/api/scripts/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scripts"] }),
  })
}

export function useScriptVersions(scriptId: string | undefined) {
  return useQuery({
    queryKey: ["script-versions", scriptId],
    queryFn: () => fetch(`/api/scripts/${scriptId}/versions`).then((r) => r.json()),
    enabled: !!scriptId,
  })
}

export function useAddScriptVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ scriptId, formData }: { scriptId: string; formData: FormData }) =>
      fetch(`/api/scripts/${scriptId}/versions`, { method: "POST", body: formData }),
    onSuccess: (_, { scriptId }) => {
      qc.invalidateQueries({ queryKey: ["script-versions", scriptId] })
      qc.invalidateQueries({ queryKey: ["script", scriptId] })
      qc.invalidateQueries({ queryKey: ["scripts"] })
    },
  })
}

export function useScriptBreakdown(scriptId: string | undefined, category?: string) {
  const params = new URLSearchParams()
  if (category) params.set("category", category)
  const query = params.toString()

  return useQuery({
    queryKey: ["script-breakdown", scriptId, category],
    queryFn: () => fetch(`/api/scripts/${scriptId}/breakdown${query ? `?${query}` : ""}`).then((r) => r.json()),
    enabled: !!scriptId,
  })
}

export function useCreateBreakdownItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ scriptId, ...body }: { scriptId: string } & Record<string, any>) =>
      fetch(`/api/scripts/${scriptId}/breakdown`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: (_, { scriptId }) => {
      qc.invalidateQueries({ queryKey: ["script-breakdown", scriptId] })
      qc.invalidateQueries({ queryKey: ["script", scriptId] })
    },
  })
}

export function useUpdateBreakdownItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ scriptId, itemId, ...body }: { scriptId: string; itemId: string } & Record<string, any>) =>
      fetch(`/api/scripts/${scriptId}/breakdown/${itemId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: (_, { scriptId }) => {
      qc.invalidateQueries({ queryKey: ["script-breakdown", scriptId] })
    },
  })
}

export function useArchiveBreakdownItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ scriptId, itemId }: { scriptId: string; itemId: string }) =>
      fetch(`/api/scripts/${scriptId}/breakdown/${itemId}`, { method: "DELETE" }),
    onSuccess: (_, { scriptId }) => {
      qc.invalidateQueries({ queryKey: ["script-breakdown", scriptId] })
    },
  })
}

// ─── Dailies ────────────────────────────────────────────────────────────────

export function useDailies() {
  const { currentProjectId } = useProject()
  const params = new URLSearchParams()
  if (currentProjectId) params.set("projectId", currentProjectId)

  return useQuery({
    queryKey: ["dailies", currentProjectId],
    queryFn: () => fetch(`/api/dailies?${params}`).then((r) => r.json()),
    staleTime: 30_000,
  })
}

export function useCreateDaily() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, any>) =>
      fetch("/api/dailies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dailies"] }),
  })
}

export function useArchiveDaily() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetch(`/api/dailies/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dailies"] }),
  })
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export function useDashboard() {
  const { currentProjectId } = useProject()

  return useQuery({
    queryKey: ["dashboard", currentProjectId],
    queryFn: () =>
      currentProjectId
        ? fetch(`/api/dashboard?projectId=${currentProjectId}`).then((r) => r.json())
        : null,
    enabled: !!currentProjectId,
    staleTime: 30_000,
  })
}

// ─── Departments ────────────────────────────────────────────────────────────

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: () => fetch("/api/departments").then((r) => r.json()),
    staleTime: 60_000,
  })
}

export function useCreateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, any>) =>
      fetch("/api/departments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  })
}

export function useUpdateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, any>) =>
      fetch(`/api/departments/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  })
}

export function useArchiveDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetch(`/api/departments/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  })
}

// ─── VFX Shots ──────────────────────────────────────────────────────────────

export function useVFXShots(filters?: Record<string, string | undefined>) {
  const { currentProjectId } = useProject()
  const params = new URLSearchParams()
  if (currentProjectId) params.set("projectId", currentProjectId)
  if (filters?.status) params.set("status", filters.status)
  if (filters?.complexity) params.set("complexity", filters.complexity)
  if (filters?.assignedToId) params.set("assignedToId", filters.assignedToId)
  const query = params.toString()
  return useQuery({
    queryKey: ["vfx-shots", currentProjectId, filters],
    queryFn: () => fetch(`/api/vfx-shots${query ? `?${query}` : ""}`).then((r) => r.json()),
    staleTime: 30_000,
  })
}

export function useCreateVFXShot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, any>) =>
      fetch("/api/vfx-shots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vfx-shots"] })
      qc.invalidateQueries({ queryKey: ["post-production-feed"] })
    },
  })
}

export function useUpdateVFXShot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, any>) =>
      fetch(`/api/vfx-shots/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vfx-shots"] })
      qc.invalidateQueries({ queryKey: ["post-production-feed"] })
    },
  })
}

export function useArchiveVFXShot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetch(`/api/vfx-shots/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vfx-shots"] })
      qc.invalidateQueries({ queryKey: ["post-production-feed"] })
    },
  })
}

// ─── Users ──────────────────────────────────────────────────────────────────

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => fetch("/api/users").then((r) => r.json()),
    staleTime: 60_000,
  })
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetch("/api/admin/users").then((r) => r.json()),
    staleTime: 30_000,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; email: string; password: string; role?: string; departmentId?: string | null }) =>
      fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { id: string; isActive?: boolean; newRole?: string; departmentId?: string | null }) =>
      fetch("/api/admin/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: body.id, isActive: body.isActive, newRole: body.newRole, departmentId: body.departmentId }) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  })
}

export function useArchiveUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: id }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  })
}

// ─── Notifications ──────────────────────────────────────────────────────────

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetch("/api/notifications").then((r) => r.json()),
    staleTime: 10_000,
  })
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { notificationId?: string; markAll?: boolean }) =>
      fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  })
}

export function useClearReadNotifications() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => fetch("/api/notifications", { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  })
}

// ─── Backup/Restore ─────────────────────────────────────────────────────────

export function useBackupProject() {
  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await fetch(`/api/projects/${projectId}/backup`)
      if (!res.ok) throw new Error("Error al exportar")
      return res.json()
    },
  })
}

export function useRestoreProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, backup }: { projectId: string; backup: any }) => {
      const res = await fetch(`/api/projects/${projectId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backup),
      })
      if (!res.ok) throw new Error("Error al importar")
      return res.json()
    },
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ["tasks"] })
      qc.invalidateQueries({ queryKey: ["casting"] })
      qc.invalidateQueries({ queryKey: ["locations"] })
      qc.invalidateQueries({ queryKey: ["scripts"] })
      qc.invalidateQueries({ queryKey: ["dailies"] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}

// ─── Comments ───────────────────────────────────────────────────────────────

export function useCreateComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, content }: { taskId: string; content: string }) =>
      fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }).then((r) => r.json()),
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: ["task", taskId] })
      qc.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

// ─── Notifications ──────────────────────────────────────────────────────────

export function useNotificationCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () =>
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((d) => d.unreadCount || 0),
    staleTime: 10_000,
    refetchInterval: 15_000,
  })
}

// ─── Post-Production Cuts ───────────────────────────────────────────────────

export function usePostCuts() {
  const { currentProjectId } = useProject()
  return useQuery({
    queryKey: ["post-cuts", currentProjectId],
    queryFn: () =>
      currentProjectId
        ? fetch(`/api/post/cuts?projectId=${currentProjectId}`).then((r) => r.json())
        : [],
    enabled: !!currentProjectId,
    staleTime: 30_000,
  })
}

export function useCreatePostCut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, any>) =>
      fetch("/api/post/cuts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post-cuts"] })
      qc.invalidateQueries({ queryKey: ["post-production-feed"] })
    },
  })
}

export function useUpdatePostCut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, any>) =>
      fetch(`/api/post/cuts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post-cuts"] })
      qc.invalidateQueries({ queryKey: ["post-production-feed"] })
    },
  })
}

export function useArchivePostCut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetch(`/api/post/cuts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post-cuts"] })
      qc.invalidateQueries({ queryKey: ["post-production-feed"] })
    },
  })
}

// ─── Post-Production Screening Notes ────────────────────────────────────────

export function useCreatePostScreeningNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ cutId, ...body }: { cutId: string } & Record<string, any>) =>
      fetch(`/api/post/cuts/${cutId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (_, { cutId }) => {
      qc.invalidateQueries({ queryKey: ["post-cuts"] })
      qc.invalidateQueries({ queryKey: ["post-production-feed"] })
    },
  })
}

export function useUpdatePostScreeningNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ cutId, noteId, ...body }: { cutId: string; noteId: string } & Record<string, any>) =>
      fetch(`/api/post/cuts/${cutId}/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (_, { cutId }) => {
      qc.invalidateQueries({ queryKey: ["post-cuts"] })
      qc.invalidateQueries({ queryKey: ["post-production-feed"] })
    },
  })
}

export function useDeletePostScreeningNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ cutId, noteId }: { cutId: string; noteId: string }) =>
      fetch(`/api/post/cuts/${cutId}/notes/${noteId}`, { method: "DELETE" }),
    onSuccess: (_, { cutId }) => {
      qc.invalidateQueries({ queryKey: ["post-cuts"] })
      qc.invalidateQueries({ queryKey: ["post-production-feed"] })
    },
  })
}

// ─── Post-Production Feed (Unified) ─────────────────────────────────────────

export function usePostProductionFeed(filters?: {
  cutId?: string
  type?: string
  status?: string
  search?: string
}) {
  const { currentProjectId } = useProject()
  const params = new URLSearchParams()
  if (currentProjectId) params.set("projectId", currentProjectId)
  if (filters?.cutId && filters.cutId !== "all") params.set("cutId", filters.cutId)
  if (filters?.type && filters.type !== "all") params.set("type", filters.type)
  if (filters?.status && filters.status !== "all") params.set("status", filters.status)
  if (filters?.search) params.set("search", filters.search)
  const query = params.toString()

  return useQuery({
    queryKey: ["post-production-feed", currentProjectId, filters],
    queryFn: () => fetch(`/api/post-production/feed${query ? `?${query}` : ""}`).then((r) => r.json()),
    enabled: !!currentProjectId,
    staleTime: 30_000,
  })
}

export function useTogglePostNoteResolve() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (noteId: string) =>
      fetch(`/api/post-production/notes/${noteId}/toggle-resolve`, { method: "POST" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post-production-feed"] })
    },
  })
}

export function useUpdatePostNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ noteId, ...body }: { noteId: string } & Record<string, any>) =>
      fetch(`/api/post-production/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post-production-feed"] })
    },
  })
}

export function useDeletePostNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ noteId }: { noteId: string }) =>
      fetch(`/api/post-production/notes/${noteId}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post-production-feed"] })
    },
  })
}

// ─── Post-Production ADR ─────────────────────────────────────────────────────

export function usePostADRs() {
  const { currentProjectId } = useProject()
  return useQuery({
    queryKey: ["post-adr", currentProjectId],
    queryFn: () =>
      currentProjectId
        ? fetch(`/api/post/adr?projectId=${currentProjectId}`).then((r) => r.json())
        : [],
    enabled: !!currentProjectId,
    staleTime: 30_000,
  })
}

export function useCreatePostADR() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, any>) =>
      fetch("/api/post/adr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["post-adr"] }),
  })
}

export function useUpdatePostADR() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, any>) =>
      fetch(`/api/post/adr/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["post-adr"] }),
  })
}

export function useArchivePostADR() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetch(`/api/post/adr/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["post-adr"] }),
  })
}

// ─── Post-Production Deliverables ────────────────────────────────────────────

export function usePostDeliverables() {
  const { currentProjectId } = useProject()
  return useQuery({
    queryKey: ["post-deliverables", currentProjectId],
    queryFn: () =>
      currentProjectId
        ? fetch(`/api/post/deliverables?projectId=${currentProjectId}`).then((r) => r.json())
        : [],
    enabled: !!currentProjectId,
    staleTime: 30_000,
  })
}

export function useCreatePostDeliverable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, any>) =>
      fetch("/api/post/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["post-deliverables"] }),
  })
}

export function useUpdatePostDeliverable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, any>) =>
      fetch(`/api/post/deliverables/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["post-deliverables"] }),
  })
}

export function useArchivePostDeliverable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetch(`/api/post/deliverables/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["post-deliverables"] }),
  })
}
