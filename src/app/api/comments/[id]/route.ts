import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { content } = await req.json()
  if (!content?.trim()) {
    return NextResponse.json({ error: "El contenido no puede estar vacío" }, { status: 400 })
  }

  const comment = await prisma.comment.findUnique({ where: { id } })
  if (!comment) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  if (comment.authorId !== session.user.id) {
    return NextResponse.json({ error: "No puedes editar este comentario" }, { status: 403 })
  }

  const updated = await prisma.comment.update({
    where: { id },
    data: { content },
    include: { author: { select: { id: true, name: true } } },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const comment = await prisma.comment.findUnique({ where: { id } })
  if (!comment) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const userId = session.user.id
  const role = session.user.role
  if (comment.authorId !== userId && role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  await prisma.comment.delete({ where: { id } })

  await logActivity({
    taskId: comment.taskId,
    action: "COMMENT_DELETED",
    userId,
  })

  return NextResponse.json({ success: true })
}
