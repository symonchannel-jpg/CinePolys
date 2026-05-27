import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const shot = await prisma.vFXShot.findFirst({
    where: { id, archivedAt: null },
    include: {
      assignedTo: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  })

  if (!shot) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  return NextResponse.json(shot)
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const { shotId, description, status, complexity, assignedToId, notes } = body

  const existing = await prisma.vFXShot.findFirst({ where: { id, archivedAt: null } })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const shot = await prisma.vFXShot.update({
    where: { id },
    data: {
      ...(shotId !== undefined && { shotId }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(complexity !== undefined && { complexity }),
      ...(assignedToId !== undefined && { assignedToId }),
      ...(notes !== undefined && { notes }),
    },
    include: {
      assignedTo: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  })

  await logActivity({ projectId: existing.projectId, entityType: "vfx", entityId: id, action: "UPDATED", userId: session.user.id })

  return NextResponse.json(shot)
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const existing = await prisma.vFXShot.findFirst({ where: { id, archivedAt: null } })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  await prisma.vFXShot.update({
    where: { id },
    data: { archivedAt: new Date() },
  })

  await logActivity({ projectId: existing.projectId, entityType: "vfx", entityId: id, action: "ARCHIVED", userId: session.user.id })

  return NextResponse.json({ success: true })
}
