"use client"

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react"
import { useSession } from "next-auth/react"

interface Project {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  status: string | null
  createdAt: string
}

interface ProjectContextType {
  currentProjectId: string | null
  setCurrentProjectId: (id: string) => void
  projects: Project[]
  setProjects: (projects: Project[]) => void
  refreshProjects: () => Promise<Project[]>
  currentProject: Project | null
  projectOrder: string[]
  setProjectOrder: (order: string[] | ((prev: string[]) => string[])) => void
}

const ProjectContext = createContext<ProjectContextType | null>(null)

const PROJECT_ID_KEY = "cinepolis_active_project"
const PROJECT_ORDER_KEY = "cinepolis_project_order"

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const userId = session?.user?.id

  const [currentProjectId, setCurrentProjectIdState] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [projectOrder, setProjectOrderState] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  const isLoadingPreferencesRef = useRef(false)

  // Hydrate from sessionStorage
  useEffect(() => {
    const storedId = sessionStorage.getItem(PROJECT_ID_KEY)
    const storedOrder = sessionStorage.getItem(PROJECT_ORDER_KEY)
    if (storedId) setCurrentProjectIdState(storedId)
    if (storedOrder) setProjectOrderState(JSON.parse(storedOrder))
    setHydrated(true)
  }, [])

  // Load projects + preferences after hydration
  useEffect(() => {
    if (!hydrated) return;
    (async () => {
      const loadedProjects = await refreshProjects()
      if (userId) {
        await loadUserPreferences(loadedProjects)
      }
    })()
  }, [hydrated])

  // Reload preferences when session user changes
  useEffect(() => {
    if (hydrated && userId && projects.length > 0) {
      loadUserPreferences(projects)
    }
  }, [userId])

  // Validate currentProjectId exists in projects
  useEffect(() => {
    if (!hydrated || projects.length === 0) return
    if (currentProjectId && !projects.some(p => p.id === currentProjectId)) {
      const first = projects[0]
      if (first) {
        setCurrentProjectId(first.id)
      } else {
        setCurrentProjectIdState(null)
        sessionStorage.removeItem(PROJECT_ID_KEY)
      }
    }
  }, [projects, hydrated])

  // Load projects
  const refreshProjects = async (): Promise<Project[]> => {
    try {
      const res = await fetch("/api/projects")
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
        // Actualizar projectOrder interno: añadir IDs nuevos al final
        setProjectOrderState(prev => {
          const existingIds = new Set(prev)
          const newIds = data.map((p: Project) => p.id).filter((id: string) => !existingIds.has(id))
          if (newIds.length > 0) {
            const updated = [...prev, ...newIds]
            sessionStorage.setItem(PROJECT_ORDER_KEY, JSON.stringify(updated))
            return updated
          }
          return prev
        })
        return data
      }
    } catch (err) {
      console.error("Failed to load projects", err)
    }
    return []
  }

  // Load user preferences from backend (currentProjectId, projectOrder)
  const loadUserPreferences = async (loadedProjects: Project[]) => {
    isLoadingPreferencesRef.current = true
    try {
      const res = await fetch("/api/users/me")
      if (res.ok) {
        const data = await res.json()
        if (data.currentProjectId) {
          setCurrentProjectIdState(data.currentProjectId)
          sessionStorage.setItem(PROJECT_ID_KEY, data.currentProjectId)
        }
        if (data.projectOrder && Array.isArray(data.projectOrder)) {
          const dbOrder = data.projectOrder as string[]
          const existingIds = new Set(dbOrder)
          const newIds = loadedProjects.map(p => p.id).filter(id => !existingIds.has(id))
          const mergedOrder = newIds.length > 0 ? [...dbOrder, ...newIds] : dbOrder
          setProjectOrderState(mergedOrder)
          sessionStorage.setItem(PROJECT_ORDER_KEY, JSON.stringify(mergedOrder))
        }
      }
    } catch (err) {
      console.error("Failed to load preferences", err)
    } finally {
      isLoadingPreferencesRef.current = false
    }
  }

  // User-initiated project change: persist to sessionStorage + backend
  const setCurrentProjectId = (id: string) => {
    setCurrentProjectIdState(id)
    sessionStorage.setItem(PROJECT_ID_KEY, id)
    if (!isLoadingPreferencesRef.current && userId) {
      fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentProjectId: id }),
      }).catch(() => {})
    }
  }

  const setProjectOrder = (order: string[] | ((prev: string[]) => string[])) => {
    const resolvedOrder = typeof order === "function" ? order(projectOrder) : order
    setProjectOrderState(resolvedOrder)
    sessionStorage.setItem(PROJECT_ORDER_KEY, JSON.stringify(resolvedOrder))
    if (!isLoadingPreferencesRef.current && userId) {
      fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectOrder: resolvedOrder }),
      }).catch(() => {})
    }
  }

  // Compute ordered projects
  const orderedProjects = projectOrder.length > 0
    ? [...projects].sort((a, b) => {
        const aIdx = projectOrder.indexOf(a.id)
        const bIdx = projectOrder.indexOf(b.id)
        if (aIdx === -1 && bIdx === -1) return 0
        if (aIdx === -1) return 1
        if (bIdx === -1) return -1
        return aIdx - bIdx
      })
    : projects

  const currentProject = orderedProjects.find((p) => p.id === currentProjectId) || null

  return (
    <ProjectContext.Provider value={{ currentProjectId, setCurrentProjectId, projects: orderedProjects, setProjects, refreshProjects, currentProject, projectOrder, setProjectOrder }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error("useProject must be used within ProjectProvider")
  return ctx
}
