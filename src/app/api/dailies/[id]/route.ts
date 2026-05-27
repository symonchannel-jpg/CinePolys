import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!session?.user || (role !== "ADMIN" && role !== "HOD")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const existing = await prisma.callSheet.findFirst({ where: { id, archivedAt: null } })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const body = await req.json()
  const { date, content } = body

  const sheet = await prisma.callSheet.update({
    where: { id },
    data: {
      ...(date !== undefined && { date: new Date(date) }),
      ...(content !== undefined && { content }),
    },
  })

  await logActivity({ projectId: existing.projectId, entityType: "dailies", entityId: id, action: "UPDATED", userId: session.user.id })

  return NextResponse.json(sheet)
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const existing = await prisma.callSheet.findFirst({ where: { id, archivedAt: null } })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  await prisma.callSheet.update({
    where: { id },
    data: { archivedAt: new Date() },
  })

  await logActivity({ projectId: existing.projectId, entityType: "dailies", entityId: id, action: "ARCHIVED", userId: session.user.id })

  return NextResponse.json({ success: true })
}
