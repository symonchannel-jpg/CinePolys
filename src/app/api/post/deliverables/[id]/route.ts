import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 })
  }

  const { name, type, status, notes, assignedToId } = body

  const existing = await prisma.postDeliverable.findFirst({ where: { id, archivedAt: null } })
  if (!existing) return NextResponse.json({ error: "Entregable no encontrado" }, { status: 404 })

  try {
    const deliverable = await prisma.postDeliverable.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(deliverable)
  } catch (err: any) {
    console.error("Error updating deliverable:", err)
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const existing = await prisma.postDeliverable.findFirst({ where: { id, archivedAt: null } })
  if (!existing) return NextResponse.json({ error: "Entregable no encontrado" }, { status: 404 })

  try {
    await prisma.postDeliverable.update({
      where: { id },
      data: { archivedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Error archiving deliverable:", err)
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
  }
}
