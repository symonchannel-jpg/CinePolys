import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const departments = await prisma.department.findMany({
    where: { archivedAt: null },
    include: {
      _count: { select: { users: true, tasks: true } },
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(departments)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const body = await req.json()
  const { name, description } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })
  }

  const exists = await prisma.department.findUnique({ where: { name } })
  if (exists) {
    return NextResponse.json({ error: "Ya existe un departamento con ese nombre" }, { status: 409 })
  }

  const dept = await prisma.department.create({
    data: { name, description },
  })

  return NextResponse.json(dept, { status: 201 })
}
