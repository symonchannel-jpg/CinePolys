import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId") || "default-project"

  const where = { archivedAt: null, projectId }
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 86400000)
  const sevenDaysEnd = new Date(todayStart.getTime() + 7 * 86400000)
  const yesterdayStart = new Date(todayStart.getTime() - 86400000)

  const [
    [totalTasks, pending, inProgress, review, completed, overdue],
    tasksDueToday,
    [blockedBreakdown, rejectedVFX],
    completedSinceYesterday,
    nextCallSheet,
    upcomingTasks,
    scripts,
    [totalVFX, approvedVFX, vfxInReview],
    [totalDeliverables, approvedDeliverables],
    [totalCuts, completedCuts],
    tasksInReview,
    rejectedShots,
    scriptsInReview,
    unconfirmedCasting,
    reviewCuts,
    failedDeliverables,
    pendingADRs,
    activeMembers,
    departmentsCount,
    urgentTasks,
  ] = await Promise.all([
    // Task stats
    Promise.all([
      prisma.task.count({ where }),
      prisma.task.count({ where: { ...where, status: "PENDING" } }),
      prisma.task.count({ where: { ...where, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { ...where, status: "REVIEW" } }),
      prisma.task.count({ where: { ...where, status: "COMPLETED" } }),
      prisma.task.count({ where: { ...where, NOT: { status: "COMPLETED" }, dueDate: { lt: now } } }),
    ]),
    // Tasks due today
    prisma.task.findMany({
      where: { ...where, dueDate: { gte: todayStart, lt: todayEnd } },
      include: { assignments: { include: { user: { select: { id: true, name: true } } } }, department: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    // Blocked items (breakdown blocked + vfx rejected)
    Promise.all([
      prisma.scriptBreakdownItem.count({ where: { script: { projectId }, archivedAt: null, status: "BLOCKED" } }),
      prisma.vFXShot.count({ where: { ...where, status: "REJECTED" } }),
    ]),
    // Completed since yesterday
    prisma.task.count({ where: { ...where, status: "COMPLETED", updatedAt: { gte: yesterdayStart } } }),
    // Next call sheet
    prisma.callSheet.findFirst({
      where: { ...where, date: { gte: todayStart } },
      include: { createdBy: { select: { name: true } } },
      orderBy: { date: "asc" },
    }),
    // Upcoming tasks (next 7 days)
    prisma.task.findMany({
      where: { ...where, dueDate: { gte: todayStart, lt: sevenDaysEnd }, status: { not: "COMPLETED" } },
      include: { assignments: { include: { user: { select: { name: true } } } }, department: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 50,
    }),
    // Script progress
    prisma.script.findMany({
      where: { archivedAt: null, projectId },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    }),
    // VFX progress
    Promise.all([
      prisma.vFXShot.count({ where }),
      prisma.vFXShot.count({ where: { ...where, status: "APPROVED" } }),
      prisma.vFXShot.count({ where: { ...where, status: "REVIEW" } }),
    ]),
    // Post-production deliverables (optional — may not exist yet)
    Promise.all([
      prisma.postDeliverable.count({ where }).catch(() => 0),
      prisma.postDeliverable.count({ where: { ...where, status: "APPROVED" } }).catch(() => 0),
    ]),
    // Post-production cuts (optional)
    Promise.all([
      prisma.postCut.count({ where }).catch(() => 0),
      prisma.postCut.count({ where: { ...where, status: "COMPLETED" } }).catch(() => 0),
    ]),
    // Pending approvals — 7 queries paralelizadas con catch opcional
    prisma.task.findMany({
      where: { ...where, status: "REVIEW" },
      include: { department: { select: { name: true } } },
      orderBy: { updatedAt: "desc" }, take: 5,
    }).catch(() => []),
    prisma.vFXShot.findMany({
      where: { ...where, status: "REJECTED" },
      include: { assignedTo: { select: { name: true } } },
      orderBy: { updatedAt: "desc" }, take: 5,
    }).catch(() => []),
    prisma.script.findMany({
      where: { ...where, status: "IN_REVIEW" },
      orderBy: { updatedAt: "desc" }, take: 3,
    }).catch(() => []),
    prisma.castingMember.findMany({
      where: { ...where, contact: null },
      orderBy: { createdAt: "desc" }, take: 3,
    }).catch(() => []),
    prisma.postCut.findMany({
      where: { ...where, status: "IN_REVIEW" },
      orderBy: { updatedAt: "desc" }, take: 3,
    }).catch(() => []),
    prisma.postDeliverable.findMany({
      where: { ...where, status: "QC_FAILED" },
      include: { assignedTo: { select: { name: true } } },
      orderBy: { updatedAt: "desc" }, take: 3,
    }).catch(() => []),
    prisma.postADR.findMany({
      where: { ...where, status: "PENDING" },
      include: { castingMember: { select: { name: true, character: true } } },
      orderBy: { updatedAt: "desc" }, take: 3,
    }).catch(() => []),
    // Active members
    prisma.user.count({
      where: {
        isActive: true,
        OR: [
          { taskAssignments: { some: { task: { projectId, archivedAt: null } } } },
          { createdTasks: { some: { projectId, archivedAt: null } } },
          { vfxShots: { some: { projectId, archivedAt: null } } },
        ],
      },
    }),
    // Departments count
    prisma.department.count({
      where: { tasks: { some: { projectId, archivedAt: null } } },
    }),
    // Top 3 urgent tasks
    prisma.task.findMany({
      where: { ...where, status: { not: "COMPLETED" }, dueDate: { not: null } },
      include: { assignments: { include: { user: { select: { id: true, name: true } } } }, department: { select: { name: true } } },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 3,
    }),
  ])

  const lockedScripts = scripts.filter((s: any) => s.status === "LOCKED" || s.status === "IN_PRODUCTION").length

  // ── Build pending approvals array ──
  const pendingApprovals: any[] = []

  for (const t of tasksInReview) {
    pendingApprovals.push({ type: "task_review", id: t.id, title: t.title, subtitle: t.department?.name || null, link: `/tasks/${t.id}` })
  }
  for (const s of rejectedShots) {
    pendingApprovals.push({ type: "vfx_rejected", id: s.id, title: s.shotId, subtitle: s.assignedTo?.name || null, link: `/vfx-tracking?focus=${s.id}` })
  }
  for (const s of scriptsInReview) {
    pendingApprovals.push({ type: "script_review", id: s.id, title: s.title, subtitle: "Guion en revisión", link: `/scripts?focus=${s.id}` })
  }
  for (const c of unconfirmedCasting) {
    pendingApprovals.push({ type: "casting_unconfirmed", id: c.id, title: c.name, subtitle: c.character || "Sin personaje", link: `/casting?focus=${c.id}` })
  }
  for (const c of reviewCuts) {
    pendingApprovals.push({ type: "cut_review", id: c.id, title: `${c.name} v${c.version}`, subtitle: c.notes || "Corte de montaje en revisión", link: `/vfx-tracking?focus=${c.id}` })
  }
  for (const d of failedDeliverables) {
    pendingApprovals.push({ type: "deliverable_qc_failed", id: d.id, title: d.name, subtitle: `Asignado: ${d.assignedTo?.name || "Sin asignar"} · Falló QC`, link: `/vfx-tracking?focus=${d.id}` })
  }
  for (const a of pendingADRs) {
    pendingApprovals.push({ type: "adr_pending", id: a.id, title: `ADR: ${a.castingMember?.character || "Actor"} - "${a.line}"`, subtitle: `Actor: ${a.castingMember?.name || "Sin asignar"}`, link: `/vfx-tracking?focus=${a.id}` })
  }

  // ── Group upcoming tasks by date ──
  const upcomingByDate: Record<string, any[]> = {}
  for (const t of upcomingTasks) {
    if (!t.dueDate) continue
    const key = t.dueDate.toISOString().split("T")[0]
    if (!upcomingByDate[key]) upcomingByDate[key] = []
    upcomingByDate[key].push(t)
  }

  return NextResponse.json({
    stats: {
      totalTasks, pending, inProgress, review, completed, overdue,
      activeMembers, departmentsCount,
      totalVFX, approvedVFX, vfxInReview,
      totalDeliverables, approvedDeliverables,
      totalCuts, completedCuts,
      lockedScripts, totalScripts: scripts.length,
    },
    today: {
      tasksDue: tasksDueToday.length,
      tasks: tasksDueToday.map((t: any) => ({
        ...t,
        assignedTo: t.assignments.map((a: any) => a.user).filter(Boolean),
      })),
      blockedCount: blockedBreakdown + rejectedVFX,
      completedSinceYesterday,
    },
    nextCallSheet: nextCallSheet ? {
      id: nextCallSheet.id,
      date: nextCallSheet.date,
      createdBy: nextCallSheet.createdBy?.name || "Desconocido",
    } : null,
    upcomingByDate,
    urgentTasks: urgentTasks.map((t: any) => ({
      ...t,
      assignedTo: t.assignments.map((a: any) => a.user).filter(Boolean),
    })),
    pendingApprovals: pendingApprovals.slice(0, 8),
  })
}
