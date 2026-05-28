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

  // ── Task stats ──
  const [totalTasks, pending, inProgress, review, completed, overdue] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.count({ where: { ...where, status: "PENDING" } }),
    prisma.task.count({ where: { ...where, status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { ...where, status: "REVIEW" } }),
    prisma.task.count({ where: { ...where, status: "COMPLETED" } }),
    prisma.task.count({ where: { ...where, NOT: { status: "COMPLETED" }, dueDate: { lt: now } } }),
  ])

  // ── Tasks due today ──
  const tasksDueToday = await prisma.task.findMany({
    where: { ...where, dueDate: { gte: todayStart, lt: todayEnd } },
    include: {
      assignments: { include: { user: { select: { id: true, name: true } } } },
      department: { select: { name: true } },
    },
    orderBy: { dueDate: "asc" },
    take: 10,
  })

  // ── Items bloqueados (breakdown blocked + vfx rejected) ──
  // Nota: Task no tiene status BLOCKED, REVIEW no equivale a bloqueado
  const [blockedBreakdown, rejectedVFX] = await Promise.all([
    prisma.scriptBreakdownItem.count({ where: { script: { projectId }, archivedAt: null, status: "BLOCKED" } }),
    prisma.vFXShot.count({ where: { ...where, status: "REJECTED" } }),
  ])

  // ── Completed since yesterday ──
  const yesterdayStart = new Date(todayStart.getTime() - 86400000)
  const completedSinceYesterday = await prisma.task.count({
    where: { ...where, status: "COMPLETED", updatedAt: { gte: yesterdayStart } },
  })

  // ── Next call sheet ──
  const nextCallSheet = await prisma.callSheet.findFirst({
    where: { ...where, date: { gte: now } },
    include: { createdBy: { select: { name: true } } },
    orderBy: { date: "asc" },
  })

  // ── Upcoming tasks (next 7 days, grouped by date) ──
  const upcomingTasks = await prisma.task.findMany({
    where: { ...where, dueDate: { gte: todayStart, lt: sevenDaysEnd }, status: { not: "COMPLETED" } },
    include: {
      assignments: { include: { user: { select: { name: true } } } },
      department: { select: { name: true } },
    },
    orderBy: { dueDate: "asc" },
    take: 50,
  })

  // ── Script progress ──
  const scripts = await prisma.script.findMany({
    where: { archivedAt: null, projectId },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  })
  const lockedScripts = scripts.filter((s: any) => s.status === "LOCKED" || s.status === "IN_PRODUCTION").length

  // ── VFX progress ──
  const [totalVFX, approvedVFX, vfxInReview] = await Promise.all([
    prisma.vFXShot.count({ where }),
    prisma.vFXShot.count({ where: { ...where, status: "APPROVED" } }),
    prisma.vFXShot.count({ where: { ...where, status: "REVIEW" } }),
  ])

  // ── Post-production deliverables progress ──
  let totalDeliverables = 0
  let approvedDeliverables = 0
  try {
    const [totD, appD] = await Promise.all([
      prisma.postDeliverable.count({ where }),
      prisma.postDeliverable.count({ where: { ...where, status: "APPROVED" } }),
    ])
    totalDeliverables = totD
    approvedDeliverables = appD
  } catch (err) {
    console.error("Warning: Error fetching post deliverables count:", err)
  }

  // ── Post-production cuts progress ──
  let totalCuts = 0
  let completedCuts = 0
  try {
    const [totC, compC] = await Promise.all([
      prisma.postCut.count({ where }),
      prisma.postCut.count({ where: { ...where, status: "COMPLETED" } }),
    ])
    totalCuts = totC
    completedCuts = compC
  } catch (err) {
    console.error("Warning: Error fetching post cuts count:", err)
  }

  // ── Pending approvals (items needing director decision) ──
  const pendingApprovals: any[] = []

  // Tasks in review
  try {
    const tasksInReview = await prisma.task.findMany({
      where: { ...where, status: "REVIEW" },
      include: { department: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    })
    for (const t of tasksInReview) {
      pendingApprovals.push({
        type: "task_review",
        id: t.id,
        title: t.title,
        subtitle: t.department?.name || null,
        link: `/tasks/${t.id}`,
      })
    }
  } catch (err) {
    console.error("Warning: Error fetching tasks in review for dashboard", err)
  }

  // VFX shots rejected
  try {
    const rejectedShots = await prisma.vFXShot.findMany({
      where: { ...where, status: "REJECTED" },
      include: { assignedTo: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    })
    for (const s of rejectedShots) {
      pendingApprovals.push({
        type: "vfx_rejected",
        id: s.id,
        title: s.shotId,
        subtitle: s.assignedTo?.name || null,
        link: `/vfx-tracking?focus=${s.id}`,
      })
    }
  } catch (err) {
    console.error("Warning: Error fetching rejected shots for dashboard", err)
  }

  // Scripts in review
  try {
    const scriptsInReview = await prisma.script.findMany({
      where: { ...where, status: "IN_REVIEW" },
      orderBy: { updatedAt: "desc" },
      take: 3,
    })
    for (const s of scriptsInReview) {
      pendingApprovals.push({
        type: "script_review",
        id: s.id,
        title: s.title,
        subtitle: "Guion en revisión",
        link: `/scripts?focus=${s.id}`,
      })
    }
  } catch (err) {
    console.error("Warning: Error fetching scripts in review for dashboard", err)
  }

  // Casting without contact (unconfirmed)
  try {
    const unconfirmedCasting = await prisma.castingMember.findMany({
      where: { ...where, contact: null },
      orderBy: { createdAt: "desc" },
      take: 3,
    })
    for (const c of unconfirmedCasting) {
      pendingApprovals.push({
        type: "casting_unconfirmed",
        id: c.id,
        title: c.name,
        subtitle: c.character || "Sin personaje",
        link: `/casting?focus=${c.id}`,
      })
    }
  } catch (err) {
    console.error("Warning: Error fetching unconfirmed casting for dashboard", err)
  }

  // Cuts in review
  try {
    const reviewCuts = await prisma.postCut.findMany({
      where: { ...where, status: "IN_REVIEW" },
      orderBy: { updatedAt: "desc" },
      take: 3,
    })
    for (const c of reviewCuts) {
      pendingApprovals.push({
        type: "cut_review",
        id: c.id,
        title: `${c.name} v${c.version}`,
        subtitle: c.notes || "Corte de montaje en revisión",
        link: `/vfx-tracking?focus=${c.id}`,
      })
    }
  } catch (err) {
    console.error("Warning: Error fetching review cuts for dashboard", err)
  }

  // Deliverables that failed QC
  try {
    const failedDeliverables = await prisma.postDeliverable.findMany({
      where: { ...where, status: "QC_FAILED" },
      include: { assignedTo: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 3,
    })
    for (const d of failedDeliverables) {
      pendingApprovals.push({
        type: "deliverable_qc_failed",
        id: d.id,
        title: d.name,
        subtitle: `Asignado: ${d.assignedTo?.name || "Sin asignar"} · Falló QC`,
        link: `/vfx-tracking?focus=${d.id}`,
      })
    }
  } catch (err) {
    console.error("Warning: Error fetching failed deliverables for dashboard", err)
  }

  // ADR lines pending
  try {
    const pendingADRs = await prisma.postADR.findMany({
      where: { ...where, status: "PENDING" },
      include: { castingMember: { select: { name: true, character: true } } },
      orderBy: { updatedAt: "desc" },
      take: 3,
    })
    for (const a of pendingADRs) {
      pendingApprovals.push({
        type: "adr_pending",
        id: a.id,
        title: `ADR: ${a.castingMember?.character || "Actor"} - "${a.line}"`,
        subtitle: `Actor: ${a.castingMember?.name || "Sin asignar"}`,
        link: `/vfx-tracking?focus=${a.id}`,
      })
    }
  } catch (err) {
    console.error("Warning: Error fetching pending ADRs for dashboard", err)
  }

  // ── Active members (asignados o creadores de tareas en el proyecto) ──
  const activeMembers = await prisma.user.count({
    where: {
      isActive: true,
      OR: [
        { taskAssignments: { some: { task: { projectId, archivedAt: null } } } },
        { createdTasks: { some: { projectId, archivedAt: null } } },
        { vfxShots: { some: { projectId, archivedAt: null } } },
      ],
    },
  })

  // ── Departments count (solo con tareas en este proyecto) ──
  const departmentsCount = await prisma.department.count({
    where: { tasks: { some: { projectId, archivedAt: null } } },
  })

  // ── Top 3 urgent tasks (by priority + due date) ──
  const urgentTasks = await prisma.task.findMany({
    where: {
      ...where,
      status: { not: "COMPLETED" },
      dueDate: { not: null },
    },
    include: {
      assignments: { include: { user: { select: { id: true, name: true } } } },
      department: { select: { name: true } },
    },
    orderBy: [
      { dueDate: "asc" },
      { priority: "desc" },
    ],
    take: 3,
  })

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
