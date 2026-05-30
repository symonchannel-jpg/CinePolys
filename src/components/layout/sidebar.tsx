"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { ProjectBackupRestore } from "./project-backup-restore"
import { AvatarSelector } from "./avatar-selector"
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Users,
  MapPin,
  CheckSquare,
  ClipboardList,
  Building2,
  Film,
  Activity,
  Trash2,
  HelpCircle,
  UserCog,
  LogOut,
  LucideIcon
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles: string[]
}

interface NavGroup {
  section: string
  items: NavItem[]
  footer?: boolean
}

const navItems: NavGroup[] = [
  {
    section: "General",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "HOD", "CREW"] },
      { label: "Proyectos", href: "/projects", icon: FolderKanban, roles: ["ADMIN", "HOD", "CREW"] },
    ],
  },
  {
    section: "Pre-producción",
    items: [
      { label: "Guiones", href: "/scripts", icon: FileText, roles: ["ADMIN", "HOD", "CREW"] },
      { label: "Casting", href: "/casting", icon: Users, roles: ["ADMIN", "HOD"] },
      { label: "Locaciones", href: "/locations", icon: MapPin, roles: ["ADMIN", "HOD"] },
    ],
  },
  {
    section: "Producción",
    items: [
      { label: "Tareas", href: "/tasks", icon: CheckSquare, roles: ["ADMIN", "HOD", "CREW"] },
      { label: "Call Sheets", href: "/dailies", icon: ClipboardList, roles: ["ADMIN", "HOD"] },
      { label: "Departamentos", href: "/departments", icon: Building2, roles: ["ADMIN", "HOD"] },
    ],
  },
  {
    section: "Post-producción",
    items: [
      { label: "Post-prod.", href: "/vfx-tracking", icon: Film, roles: ["ADMIN", "HOD"] },
    ],
  },
  {
    section: "Sistema",
    items: [
      { label: "Actividad", href: "/activity", icon: Activity, roles: ["ADMIN", "HOD", "CREW"] },
      { label: "Papelera", href: "/trash", icon: Trash2, roles: ["ADMIN", "HOD"] },
      { label: "Ayuda", href: "/help", icon: HelpCircle, roles: ["ADMIN", "HOD", "CREW"] },
    ],
    footer: true,
  },
  {
    section: "Admin",
    items: [
      { label: "Usuarios", href: "/admin/users", icon: UserCog, roles: ["ADMIN"] },
    ],
  },
]

export function Sidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role || "CREW"
  const [animating, setAnimating] = useState(false)

  const handleToggle = () => {
    setAnimating(true)
    onToggle()
    setTimeout(() => setAnimating(false), 500)
  }

  return (
    <aside
      className={`flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 overflow-hidden ${animating ? "animate-jelly" : ""} ${open ? "w-56" : "w-14"}`}
    >
      <button
        onClick={handleToggle}
        className={`flex h-12 w-full items-center border-b border-sidebar-border shrink-0 hover:bg-sidebar-accent/30 transition-colors ${open ? "justify-center" : "justify-center"}`}
      >
        <span className={`text-2xl font-extrabold text-sidebar-foreground shrink-0 ${!open ? "w-6 text-center" : ""}`}>C</span>
        <span
          className={`overflow-hidden whitespace-nowrap transition-all duration-[750ms] font-extrabold text-2xl ${open ? "max-w-40 opacity-100" : "max-w-0 opacity-0"}`}
          style={{ transitionTimingFunction: "cubic-bezier(0.68, -0.55, 0.265, 1.55)" }}
        >
          inePolys
        </span>
      </button>

      <nav className={`flex-1 overflow-y-auto p-2 scrollbar-none transition-all duration-300 ${open ? "space-y-3" : "space-y-0"}`}>
        {navItems.map((group) => {
          const visible = group.items.filter((item) => item.roles.includes(role))
          if (visible.length === 0) return null

          return (
            <div key={group.section}>
              <p
                className={`overflow-hidden whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-all duration-300 ${
                  open ? "mb-1 px-2 max-w-40 opacity-100 h-auto" : "mb-0 px-0 max-w-0 opacity-0 h-0"
                }`}
              >
                {group.section}
              </p>
              <div className="space-y-0.5">
                {visible.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-md py-1 text-sm transition-all duration-200",
                        open ? "px-3 gap-2" : "px-0 justify-center gap-0",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:translate-x-0.5"
                      )}
                      title={!open ? item.label : undefined}
                    >
                      <span className="w-5 text-center inline-flex items-center justify-center shrink-0">
                        <item.icon size={18} strokeWidth={1.75} className="transition-all duration-200" />
                      </span>
                      <span
                        className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                          open ? "max-w-40 opacity-100" : "max-w-0 opacity-0"
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
                {(group as any).footer && role === "ADMIN" && (
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      open ? "max-h-12 opacity-100 mt-1" : "max-h-0 opacity-0 mt-0"
                    }`}
                  >
                    <ProjectBackupRestore />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Role switcher for Admin */}
      {role === "ADMIN" && (
        <div
          className={`transition-all duration-300 overflow-hidden ${
            open ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <RoleSwitcher />
        </div>
      )}

      <div className="border-t border-sidebar-border p-2">
        <div className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-sidebar-foreground">
          <div className="flex items-center gap-2 min-w-0">
            <AvatarSelector 
              currentIcon={(session?.user as any)?.avatarIcon as string | undefined} 
              userName={session?.user?.name as string | undefined} 
              open={open} 
            />
            <div
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                open ? "max-w-40 opacity-100" : "max-w-0 opacity-0"
              }`}
            >
              <p className="text-sm font-medium truncate leading-tight">{session?.user?.name}</p>
              <p className="text-[11px] text-muted-foreground truncate leading-tight">{role}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={`shrink-0 text-muted-foreground hover:text-foreground transition-all duration-300 flex items-center justify-center ${
              open ? "max-w-10 opacity-100" : "max-w-0 opacity-0 overflow-hidden"
            }`}
            title="Cerrar sesión"
          >
            <LogOut size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function RoleSwitcher() {
  const [mode, setMode] = useState<"admin" | "hod" | "crew">("admin")
  const session = useSession()
  const role = session.data?.user?.role

  if (role !== "ADMIN") return null

  const modes = [
    { value: "admin" as const, label: "Admin", color: "bg-danger/10 text-danger" },
    { value: "hod" as const, label: "Jefe Depto", color: "bg-info/10 text-info" },
    { value: "crew" as const, label: "Crew", color: "bg-success/10 text-success" },
  ]

  return (
    <div className="px-2 py-1.5 border-t border-sidebar-border">
      <p className="px-2 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Vista como</p>
      <div className="flex gap-1">
        {modes.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={cn(
              "flex-1 rounded px-2 py-1 text-[10px] font-medium transition-all duration-200",
              mode === m.value ? m.color + " ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  )
}
