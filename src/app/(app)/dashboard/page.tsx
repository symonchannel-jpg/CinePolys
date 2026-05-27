"use client"

import { useState } from "react"
import { useProject } from "@/lib/project-context"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ── Types ──
interface DashboardData {
  stats: {
    totalTasks: number; pending: number; inProgress: number; review: number; completed: number; overdue: number
    activeMembers: number; departmentsCount: number
    totalVFX: number; approvedVFX: number; vfxInReview: number
    totalDeliverables: number; approvedDeliverables: number
    totalCuts: number; completedCuts: number
    lockedScripts: number; totalScripts: number
  }
  today: {
    tasksDue: number
    tasks: any[]
    blockedCount: number
    completedSinceYesterday: number
  }
  nextCallSheet: { id: string; date: string; createdBy: string } | null
  upcomingByDate: Record<string, any[]>
  urgentTasks: any[]
  pendingApprovals: { type: string; id: string; title: string; subtitle: string | null; link: string }[]
}

// ── API hook ──
function useDashboardData() {
  const { currentProjectId } = useProject()
  return useQuery<DashboardData>({
    queryKey: ["dashboard-v2", currentProjectId],
    queryFn: () =>
      currentProjectId
        ? fetch(`/api/dashboard?projectId=${currentProjectId}`).then((r) => {
            if (!r.ok) {
              return r.json().then((err) => {
                throw new Error(err.error || "Error al cargar la información del panel");
              });
            }
            return r.json();
          })
        : Promise.resolve(null),
    enabled: !!currentProjectId,
    staleTime: 30_000,
  })
}

// ── Helpers ──
const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const monthNames = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

function formatDateFull(d: Date) {
  return `${d.getDate()} ${monthNames[d.getMonth()]}`
}

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-500/10 text-gray-400",
  MEDIUM: "bg-blue-500/10 text-blue-400",
  HIGH: "bg-orange-500/10 text-orange-400",
  URGENT: "bg-red-500/10 text-red-400",
}

const statusDot: Record<string, string> = {
  PENDING: "bg-yellow-500",
  IN_PROGRESS: "bg-blue-500",
  REVIEW: "bg-purple-500",
  COMPLETED: "bg-green-500",
}

const approvalIcons: Record<string, string> = {
  task_review: "📝",
  vfx_rejected: "🎬",
  script_review: "📄",
  casting_unconfirmed: "🎭",
  cut_review: "🎬",
  deliverable_qc_failed: "❌",
  adr_pending: "🎙️",
}

const approvalLabels: Record<string, string> = {
  task_review: "Revisión",
  vfx_rejected: "Rechazado",
  script_review: "Revisión",
  casting_unconfirmed: "Sin confirmar",
  cut_review: "Corte",
  deliverable_qc_failed: "QC Fallido",
  adr_pending: "ADR Pend.",
}

// ── Progress bar ──
function ProgressBar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="h-2 rounded-full bg-muted overflow-hidden">
      <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ── Section ──
function Section({ title, badge, children, className = "", accent = false }: {
  title: string; badge?: string | number; children: React.ReactNode; className?: string; accent?: boolean
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card flex flex-col", className)}>
      <div className={cn("flex items-center justify-between px-5 py-3.5 border-b shrink-0", accent ? "border-b-primary/30 bg-primary/[0.02]" : "border-border")}>
        <h2 className={cn("text-sm font-semibold", accent ? "text-primary" : "text-foreground")}>{title}</h2>
        {badge !== undefined && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary">
            {badge}
          </span>
        )}
      </div>
      <div className="p-5 flex-1">{children}</div>
    </div>
  )
}

// ── Empty state ──
function EmptyState({ message, action }: { message: string; action?: { label: string; href: string } }) {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full py-4">
      <p className="text-sm text-muted-foreground">{message}</p>
      {action && (
        <Link href={action.href} className="text-xs text-primary hover:underline mt-2">
          {action.label}
        </Link>
      )}
    </div>
  )
}

// ── Main Dashboard ──
export default function DashboardPage() {
  const { currentProjectId } = useProject()
  const { data, isLoading, isError, error, refetch } = useDashboardData()
  const [expandedStatus, setExpandedStatus] = useState(false)
  const [expandedPostProd, setExpandedPostProd] = useState(false)

  if (!currentProjectId) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Selecciona un proyecto para ver el dashboard
      </div>
    )
  }

  if (isError || (data && "error" in (data as any))) {
    const errorMsg = (error as any)?.message || (data as any)?.error || "Ocurrió un error inesperado al cargar el panel de control."
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] text-center border border-border rounded-xl bg-card p-8 col-span-6 max-w-lg mx-auto w-full mt-8 animate-jelly">
        <span className="text-3xl mb-4">⚠️</span>
        <h3 className="text-base font-semibold text-foreground mb-2">Error al cargar el Dashboard</h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{errorMsg}</p>
        <button
          onClick={() => refetch()}
          className="text-xs px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/95 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 grid-cols-6 auto-rows-fr">
        <div className="h-48 rounded-xl border border-border bg-muted/30 animate-pulse col-span-2" />
        <div className="h-48 rounded-xl border border-border bg-muted/30 animate-pulse col-span-2" />
        <div className="h-48 rounded-xl border border-border bg-muted/30 animate-pulse col-span-2" />
      </div>
    )
  }

  const { stats, today, nextCallSheet, upcomingByDate, urgentTasks, pendingApprovals } = data
  const taskPct = stats.totalTasks > 0 ? Math.round((stats.completed / stats.totalTasks) * 100) : 0
  const vfxPct = stats.totalVFX > 0 ? Math.round((stats.approvedVFX / stats.totalVFX) * 100) : 0
  const delivPct = stats.totalDeliverables > 0 ? Math.round((stats.approvedDeliverables / stats.totalDeliverables) * 100) : 0
  const cutPct = stats.totalCuts > 0 ? Math.round((stats.completedCuts / stats.totalCuts) * 100) : 0

  // Build next 7 days
  const next7Days: { date: Date; key: string; count: number }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const key = d.toISOString().split("T")[0]
    next7Days.push({ date: d, key, count: (upcomingByDate[key] || []).length })
  }

  const nextShootDate = nextCallSheet ? new Date(nextCallSheet.date) : null
  const daysUntilShoot = nextShootDate ? Math.ceil((nextShootDate.getTime() - Date.now()) / 86400000) : null

  return (
    <div className="grid gap-4 grid-cols-6 auto-rows-fr h-full">

      {/* ── ROW 1: 3 panels × 2 cols each = 6 cols total ── */}

      {/* TODAY — 2/6 */}
      <Section title="⚡ Hoy" accent badge={today.tasksDue > 0 ? today.tasksDue : undefined} className="col-span-6 lg:col-span-2">
        {today.tasksDue === 0 && today.blockedCount === 0 ? (
          <EmptyState message="Sin tareas urgentes para hoy" />
        ) : (
          <div className="space-y-3">
            {today.tasksDue > 0 && (
              <div className="space-y-2">
                {today.tasks.slice(0, 5).map((t: any) => (
                  <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center gap-3 rounded-lg p-2 -mx-2 hover:bg-muted/50 transition-colors">
                    <div className={cn("w-2 h-2 rounded-full shrink-0", statusDot[t.status] || "bg-gray-500")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.assignedTo?.map((u: any) => u.name).join(", ") || "Sin asignar"}
                        {t.department ? ` · ${t.department.name}` : ""}
                      </p>
                    </div>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0", priorityColors[t.priority] || "")}>
                      {t.priority === "URGENT" ? "Urgente" : t.priority === "HIGH" ? "Alta" : t.priority === "MEDIUM" ? "Media" : "Baja"}
                    </span>
                  </Link>
                ))}
                {today.tasksDue > 5 && (
                  <Link href="/tasks" className="text-xs text-primary hover:underline block pt-1">
                    Ver {today.tasksDue - 5} más →
                  </Link>
                )}
              </div>
            )}
            {today.blockedCount > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <span className="text-xs text-muted-foreground">{today.blockedCount} item{today.blockedCount !== 1 ? "s" : ""} bloqueado{today.blockedCount !== 1 ? "s" : ""}</span>
              </div>
            )}
            {today.completedSinceYesterday > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                <span className="text-xs text-muted-foreground">{today.completedSinceYesterday} completada{today.completedSinceYesterday !== 1 ? "s" : ""} desde ayer</span>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* PROJECT STATUS — 2/6 (collapsible to reduce cognitive load) */}
      <Section title="📊 Estado del Proyecto" className="col-span-6 lg:col-span-2">
        <div className="flex flex-col justify-center h-full space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-muted-foreground">Tareas</span>
              <span className="text-sm font-medium text-foreground">{stats.completed}/{stats.totalTasks} ({taskPct}%)</span>
            </div>
            <ProgressBar value={stats.completed} max={stats.totalTasks} color="bg-green-500" />
            <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
              <span>{stats.pending} pend.</span>
              <span>{stats.inProgress} prog.</span>
              <span>{stats.review} rev.</span>
              {stats.overdue > 0 && <span className="text-red-400">{stats.overdue} venc.</span>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-muted-foreground">Guiones</span>
              <span className="text-sm font-medium text-foreground">{stats.lockedScripts}/{stats.totalScripts} bloqueados</span>
            </div>
            <ProgressBar value={stats.lockedScripts} max={stats.totalScripts} color="bg-blue-500" />
          </div>

          <button
            onClick={() => setExpandedStatus(!expandedStatus)}
            className="text-sm text-primary hover:underline flex items-center gap-1 pt-1 transition-colors cursor-pointer"
          >
            {expandedStatus ? "Mostrar menos ↑" : "Ver más indicadores →"}
          </button>

          <div
            className={`grid transition-all duration-300 ease-in-out ${
              expandedStatus
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Post-Producción group — collapsible secondary container */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpandedPostProd(!expandedPostProd) }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-mono transition-transform duration-200">{expandedPostProd ? "▼" : "▶"}</span>
                    Post-Producción
                    {!expandedPostProd && (
                      <span className="ml-auto text-xs text-muted-foreground/60">
                        {[stats.totalCuts > 0, stats.totalVFX > 0, stats.totalDeliverables > 0].filter(Boolean).length} métricas
                      </span>
                    )}
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      expandedPostProd
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-3 pb-3 space-y-3 pt-1 animate-in fade-in duration-200">
                        {stats.totalCuts > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm text-muted-foreground">Cortes de Montaje</span>
                              <span className="text-sm font-medium text-foreground">{stats.completedCuts}/{stats.totalCuts} ({cutPct}%)</span>
                            </div>
                            <ProgressBar value={stats.completedCuts} max={stats.totalCuts} color="bg-amber-500" />
                          </div>
                        )}

                        {stats.totalVFX > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm text-muted-foreground">VFX</span>
                              <span className="text-sm font-medium text-foreground">{stats.approvedVFX}/{stats.totalVFX} ({vfxPct}%)</span>
                            </div>
                            <ProgressBar value={stats.approvedVFX} max={stats.totalVFX} color="bg-purple-500" />
                            <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                              <span>{stats.vfxInReview} en rev.</span>
                            </div>
                          </div>
                        )}

                        {stats.totalDeliverables > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm text-muted-foreground">Entregables (QC)</span>
                              <span className="text-sm font-medium text-foreground">{stats.approvedDeliverables}/{stats.totalDeliverables} ({delivPct}%)</span>
                            </div>
                            <ProgressBar value={stats.approvedDeliverables} max={stats.totalDeliverables} color="bg-indigo-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Equipo activo</span>
                  <span className="text-sm font-medium text-foreground">{stats.activeMembers} miembros · {stats.departmentsCount} departamentos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* NEXT SHOOT — 2/6 */}
      <Section title="🎬 Próximo Rodaje" className="col-span-6 lg:col-span-2">
        {nextShootDate ? (
          <div className="flex flex-col items-center justify-center h-full space-y-5">
            <div className="text-center">
              <p className="text-4xl font-bold text-foreground">{formatDateFull(nextShootDate)}</p>
              <p className="text-base text-muted-foreground mt-1.5">
                {daysUntilShoot === 0 ? "¡Es hoy!" : daysUntilShoot === 1 ? "Mañana" : `En ${daysUntilShoot} días`}
                {" · "}{nextShootDate.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div>
              {nextCallSheet && (
                <Link href={`/dailies?expand=${nextCallSheet.id}`} className="text-sm text-primary hover:underline">
                  Ver call sheet →
                </Link>
              )}
            </div>
          </div>
        ) : (
          <EmptyState message="Sin call sheets programados" action={{ label: "Crear call sheet →", href: "/dailies" }} />
        )}
      </Section>

      {/* ── ROW 2: 2 panels — 3/6 + 3/6 = symmetric ── */}

      {/* PENDING APPROVALS — 3/6 */}
      <Section title="⚠️ Requiere Atención" accent badge={pendingApprovals.length > 0 ? pendingApprovals.length : undefined} className="col-span-6 lg:col-span-3">
        {pendingApprovals.length === 0 ? (
          <EmptyState message="Todo al día — no hay decisiones pendientes" />
        ) : (
          <div className="space-y-1">
            {pendingApprovals.map((item, i) => (
              <Link
                key={`${item.type}-${item.id}-${i}`}
                href={item.link}
                className="flex items-center gap-3 rounded-lg p-2.5 -mx-2 hover:bg-muted/50 transition-colors"
              >
                <span className="text-base shrink-0">{approvalIcons[item.type] || "📌"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{item.title}</p>
                  {item.subtitle && <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>}
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {approvalLabels[item.type] || ""}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* 7-DAY CALENDAR — 3/6 */}
      <Section title="📅 Próximos 7 Días" className="col-span-6 lg:col-span-3">
        <div className="flex flex-col flex-1">
          {/* Calendar grid — centered, squares, full width */}
          <div className="flex-1 flex items-center justify-center">
            <div className="grid grid-cols-7 gap-3 w-full">
              {next7Days.map(({ date, key, count }) => {
                const isToday = key === new Date().toISOString().split("T")[0]
                const tasks = upcomingByDate[key] || []
                return (
                  <div
                    key={key}
                    className={cn(
                      "aspect-square rounded-xl border flex flex-col items-center justify-center text-center transition-colors relative",
                      isToday ? "border-primary bg-primary/5" : "border-border",
                      count > 0 ? "bg-card" : "bg-muted/20"
                    )}
                  >
                    {count > 0 && (
                      <span className="absolute top-1 right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {count}
                      </span>
                    )}
                    <p className={cn("text-xs font-medium", isToday ? "text-primary" : "text-muted-foreground")}>
                      {dayNames[date.getDay()]}
                    </p>
                    <p className={cn("text-2xl font-bold", isToday ? "text-primary" : "text-foreground")}>
                      {date.getDate()}
                    </p>
                    {count > 0 ? (
                      tasks[0] && (
                        <p className="text-[10px] text-muted-foreground truncate mt-1 max-w-full px-1">{tasks[0].title}</p>
                      )
                    ) : (
                      <p className="text-[10px] text-muted-foreground/50 mt-1">—</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          {/* Link — bottom center */}
          {urgentTasks.length > 0 && (
            <div className="pt-3 border-t border-border space-y-1.5">
              {urgentTasks.map((t: any) => (
                <Link
                  key={t.id}
                  href={`/tasks/${t.id}`}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 -mx-2 hover:bg-muted/50 transition-colors"
                >
                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusDot[t.status] || "bg-gray-500")} />
                  <span className="text-xs text-foreground truncate flex-1">{t.title}</span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0", priorityColors[t.priority] || "")}>
                    {t.priority === "URGENT" ? "Urgente" : t.priority === "HIGH" ? "Alta" : t.priority === "MEDIUM" ? "Media" : "Baja"}
                  </span>
                </Link>
              ))}
            </div>
          )}
          <div className="pt-3 border-t border-border text-center shrink-0">
            <Link href="/tasks" className="text-sm text-primary hover:underline">
              Ver todas las tareas →
            </Link>
          </div>
        </div>
      </Section>
    </div>
  )
}
