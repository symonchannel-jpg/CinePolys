import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id, itemId } = await params
  const body = await req.json()
  const { scene, page, category, title, description, status, assignedToId, linkedId, linkedType, notes, taskId } = body

  const script = await prisma.script.findUnique({ where: { id } })
  if (!script) return NextResponse.json({ error: "Guion no encontrado" }, { status: 404 })

  const item = await prisma.scriptBreakdownItem.update({
    where: { id: itemId },
    data: {
      ...(scene !== undefined && { scene }),
      ...(page !== undefined && { page }),
      ...(category !== undefined && { category }),
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(assignedToId !== undefined && { assignedToId }),
      ...(linkedId !== undefined && { linkedId }),
      ...(linkedType !== undefined && { linkedType }),
      ...(notes !== undefined && { notes }),
      ...(taskId !== undefined && { taskId }),
    },
    include: { assignedTo: { select: { id: true, name: true } }, task: { select: { id: true, title: true, status: true } } },
  })

  const changedFields = Object.keys(body).filter((k) => body[k] !== undefined && k !== "id" && k !== "scriptId")
  if (changedFields.length > 0) {
    await logActivity({
      projectId: script.projectId,
      entityType: "script",
      entityId: id,
      action: "BREAKDOWN_UPDATED",
      details: JSON.stringify({ item: item.title, fields: changedFields }),
      userId: session.user.id,
    })
  }

  return NextResponse.json(item)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id, itemId } = await params
  const script = await prisma.script.findUnique({ where: { id } })
  const item = await prisma.scriptBreakdownItem.findUnique({ where: { id: itemId } })

  if (script && item) {
    await logActivity({
      projectId: script.projectId,
      entityType: "script",
      entityId: id,
      action: "BREAKDOWN_UPDATED",
      details: JSON.stringify({ item: item.title, action: "archived" }),
      userId: session.user.id,
    })
  }

  await prisma.scriptBreakdownItem.update({ where: { id: itemId }, data: { archivedAt: new Date() } })
  return NextResponse.json({ success: true })
}
