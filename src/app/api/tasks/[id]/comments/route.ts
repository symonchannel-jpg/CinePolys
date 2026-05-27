import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"
import { notifyUser } from "@/lib/notifications"

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { content } = await req.json()
  if (!content?.trim()) {
    return NextResponse.json({ error: "El comentario no puede estar vacío" }, { status: 400 })
  }

  const task = await prisma.task.findFirst({
    where: { id, archivedAt: null },
    include: { assignments: { select: { userId: true } } },
  })
  if (!task) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 })

  const comment = await prisma.comment.create({
    data: {
      content,
      authorId: session.user.id,
      taskId: id,
    },
    include: {
      author: { select: { id: true, name: true } },
    },
  })

  const userId = session.user.id
  const authorName = session.user.name

  await logActivity({
    taskId: id,
    action: "COMMENTED",
    userId,
  })

  const assignedUserIds = task.assignments.map((a: any) => a.userId)
  for (const assignedUserId of assignedUserIds) {
    if (assignedUserId !== userId) {
      await notifyUser({
        userId: assignedUserId,
        title: `Nuevo comentario en: ${task.title}`,
        message: `${authorName} comentó en tu tarea`,
        type: "comment",
        link: `/tasks/${id}`,
      })
    }
  }
  if (task.createdById && task.createdById !== userId && !assignedUserIds.includes(task.createdById)) {
    await notifyUser({
      userId: task.createdById,
      title: `Nuevo comentario en: ${task.title}`,
      message: `${authorName} comentó en "${task.title}"`,
      type: "comment",
      link: `/tasks/${id}`,
    })
  }

  const mentions = content.match(/@(\w+)/g)
  if (mentions?.length) {
    const mentionedNames = mentions.map((m: string) => m.slice(1))
    const mentionedUsers = await prisma.user.findMany({
      where: {
        name: { in: mentionedNames },
        archivedAt: null,
        isActive: true,
      },
      select: { id: true, name: true },
    })

    for (const mentioned of mentionedUsers) {
      if (mentioned.id !== userId) {
        await notifyUser({
          userId: mentioned.id,
          title: `Mención en: ${task.title}`,
          message: `${authorName} te mencionó en un comentario`,
          type: "mention",
          link: `/tasks/${id}`,
        })
      }
    }
  }

  return NextResponse.json(comment, { status: 201 })
}
