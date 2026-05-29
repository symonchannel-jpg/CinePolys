import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"
import { notifyAllUsers, notifyUser } from "@/lib/notifications"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const priority = searchParams.get("priority")
  const departmentId = searchParams.get("departmentId")
  const assignedToId = searchParams.get("assignedToId")
  const projectId = searchParams.get("projectId") || "default-project"

  const where: any = { archivedAt: null, projectId }

  if (status) where.status = status
  if (priority) where.priority = priority
  if (departmentId) where.departmentId = departmentId
  if (assignedToId) where.assignments = { some: { userId: assignedToId } }

  const role = session.user.role
  const userId = session.user.id

  if (role === "CREW") {
    where.OR = [{ assignments: { some: { userId } } }, { createdById: userId }]
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      department: true,
      assignments: { include: { user: { select: { id: true, name: true } } } },
      createdBy: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(tasks.map((t: any) => ({
    ...t,
    assignedTo: t.assignments.map((a: any) => a.user),
  })))
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const { title, description, priority, departmentId, assignedToIds, dueDate, projectId } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 })
  }

  const pid = projectId || "default-project"

  const task = await prisma.task.create({
    data: {
      title,
      description,
      priority: priority || "MEDIUM",
      departmentId: departmentId || null,
      createdById: session.user.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId: pid,
      assignments: assignedToIds?.length
        ? { create: assignedToIds.map((uid: string) => ({ userId: uid })) }
        : undefined,
    },
    include: {
      department: true,
      assignments: { include: { user: { select: { id: true, name: true } } } },
      createdBy: { select: { id: true, name: true } },
    },
  })

  await logActivity({
    taskId: task.id,
    action: "CREATED",
    details: JSON.stringify({ title }),
    userId: session.user.id,
  })

  if (assignedToIds?.length) {
    await logActivity({
      taskId: task.id,
      action: "ASSIGNED",
      details: JSON.stringify({ assignedToIds }),
      userId: session.user.id,
    })
  }

  const creatorName = session.user.name

  await notifyAllUsers({
    title: `Nueva tarea: ${title}`,
    message: `${creatorName} creó "${title}"`,
    type: "task_created",
    link: `/tasks/${task.id}`,
    excludeUserId: session.user.id,
  })

  if (assignedToIds?.length) {
    await Promise.all(assignedToIds.map((uid: string) =>
      notifyUser({
        userId: uid,
        title: `Tarea asignada: ${title}`,
        message: `${creatorName} te asignó "${title}"`,
        type: "task_assigned",
        link: `/tasks/${task.id}`,
      })
    ))
  }

  return NextResponse.json({
    ...task,
    assignedTo: task.assignments.map((a: any) => a.user),
  }, { status: 201 })
}
