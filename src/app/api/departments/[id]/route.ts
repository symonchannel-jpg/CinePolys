import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const body = await req.json()
  const { name, description } = body

  const existing = await prisma.department.findFirst({ where: { id, archivedAt: null } })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  if (name && name !== existing.name) {
    const dup = await prisma.department.findUnique({ where: { name } })
    if (dup) return NextResponse.json({ error: "El nombre ya existe" }, { status: 409 })
  }

  const dept = await prisma.department.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
    },
  })

  return NextResponse.json(dept)
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const existing = await prisma.department.findFirst({ where: { id, archivedAt: null } })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  await prisma.department.update({
    where: { id },
    data: { archivedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
