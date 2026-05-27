import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"
import { notifyUser } from "@/lib/notifications"

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const task = await prisma.task.findFirst({
    where: { id, archivedAt: null },
    include: {
      department: true,
      assignments: { include: { user: { select: { id: true, name: true } } } },
      createdBy: { select: { id: true, name: true } },
      comments: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      activities: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  })

  if (!task) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

  return NextResponse.json({
    ...task,
    assignedTo: task.assignments.map((a: any) => a.user),
  })
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const { title, description, status, priority, departmentId, assignedToIds, dueDate, projectId } = body

  const existing = await prisma.task.findFirst({
    where: { id, archivedAt: null },
    include: { assignments: { select: { userId: true } } },
  })
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

  const userId = session.user.id
  const changes: string[] = []

  if (title !== undefined && title !== existing.title) changes.push(`título`)
  if (status !== undefined && status !== existing.status) {
    await logActivity({
      taskId: id, action: "STATUS_CHANGED",
      details: JSON.stringify({ from: existing.status, to: status }),
      userId,
    })
  }
  if (priority !== undefined && priority !== existing.priority) {
    await logActivity({
      taskId: id, action: "PRIORITY_CHANGED",
      details: JSON.stringify({ from: existing.priority, to: priority }),
      userId,
    })
  }

  if (assignedToIds !== undefined) {
    const oldIds = existing.assignments.map((a: any) => a.userId).sort().join(",")
    const newIds = (assignedToIds as string[]).sort().join(",")
    if (oldIds !== newIds) {
      const added = (assignedToIds as string[]).filter((uid: string) => !existing.assignments.some((a: any) => a.userId === uid))
      await logActivity({
        taskId: id, action: "ASSIGNED",
        details: JSON.stringify({ assignedToIds }),
        userId,
      })
      for (const uid of added) {
        await notifyUser({
          userId: uid,
          title: `Tarea asignada: ${existing.title}`,
          message: `Te asignaron "${existing.title}"`,
          type: "task_assigned",
          link: `/tasks/${id}`,
        })
      }
    }
  }

  if (changes.length > 0) {
    await logActivity({
      taskId: id, action: "UPDATED",
      details: JSON.stringify({ fields: changes }),
      userId,
    })
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(departmentId !== undefined && { departmentId }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(assignedToIds !== undefined && {
        assignments: {
          deleteMany: {},
          create: assignedToIds.map((uid: string) => ({ userId: uid })),
        },
      }),
    },
    include: {
      department: true,
      assignments: { include: { user: { select: { id: true, name: true } } } },
      createdBy: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json({
    ...task,
    assignedTo: task.assignments.map((a: any) => a.user),
  })
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const existing = await prisma.task.findFirst({ where: { id, archivedAt: null } })
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

  await prisma.task.update({
    where: { id },
    data: { archivedAt: new Date() },
  })

  await logActivity({
    taskId: id,
    action: "ARCHIVED",
    userId: session.user.id,
  })

  return NextResponse.json({ success: true })
}
