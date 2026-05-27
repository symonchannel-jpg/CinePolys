import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const script = await prisma.script.findUnique({ where: { id, archivedAt: null } })
  if (!script) return NextResponse.json({ error: "Guion no encontrado" }, { status: 404 })

  const [versions, breakdown] = await Promise.all([
    prisma.scriptVersion.findMany({
      where: { scriptId: id, archivedAt: null },
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { version: "desc" },
    }),
    prisma.scriptBreakdownItem.findMany({
      where: { scriptId: id, archivedAt: null },
      include: { assignedTo: { select: { id: true, name: true } }, task: { select: { id: true, title: true, status: true } } },
      orderBy: [{ category: "asc" }, { createdAt: "asc" }],
    }),
  ])

  return NextResponse.json({ ...script, versions, breakdown })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { title, type, status, pageCount, colorRevision } = body

  const script = await prisma.script.findUnique({ where: { id } })
  if (!script) return NextResponse.json({ error: "Guion no encontrado" }, { status: 404 })

  const updated = await prisma.script.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(type !== undefined && { type }),
      ...(status !== undefined && { status }),
      ...(pageCount !== undefined && { pageCount }),
      ...(colorRevision !== undefined && { colorRevision }),
    },
  })

  const changedFields = Object.keys(body).filter((k) => body[k] !== undefined && k !== "id")
  if (changedFields.length > 0) {
    await logActivity({
      projectId: script.projectId,
      entityType: "script",
      entityId: id,
      action: "UPDATED",
      details: JSON.stringify({ fields: changedFields, ...body }),
      userId: session.user.id,
    })
  }

  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const script = await prisma.script.findUnique({ where: { id } })
  if (script) {
    await logActivity({ projectId: script.projectId, entityType: "script", entityId: id, action: "ARCHIVED", userId: session.user.id })
  }
  await prisma.script.update({ where: { id }, data: { archivedAt: new Date() } })
  return NextResponse.json({ success: true })
}
