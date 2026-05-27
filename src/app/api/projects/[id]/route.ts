import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })
  return NextResponse.json(project)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!session?.user || (role !== "ADMIN" && role !== "HOD")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { name, description, icon, color, status, archivedAt } = body

  // Restore project (un-archive)
  if (archivedAt === null) {
    const updated = await prisma.project.update({
      where: { id },
      data: { archivedAt: null, updatedAt: new Date() },
    })
    return NextResponse.json(updated)
  }

  if (!name?.trim()) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })

  try {
    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: name.trim(),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(icon !== undefined && { icon: icon?.trim() }),
        ...(color !== undefined && { color: color?.trim() }),
        ...(status !== undefined && { status }),
        updatedAt: new Date(),
      },
    })
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  if (id === "default-project") return NextResponse.json({ error: "No se puede archivar el proyecto por defecto" }, { status: 400 })

  try {
    await prisma.project.update({
      where: { id },
      data: { archivedAt: new Date() },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })
  }
}
