import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const includeArchived = searchParams.get("includeArchived") === "true"

  if (includeArchived) {
    const [active, archived] = await Promise.all([
      prisma.project.findMany({
        where: { archivedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { tasks: { where: { archivedAt: null } } } },
        },
      }),
      prisma.project.findMany({
        where: { NOT: { archivedAt: null } },
        orderBy: { archivedAt: "desc" },
        include: {
          _count: { select: { tasks: { where: { archivedAt: null } } } },
        },
      }),
    ])
    return NextResponse.json({ active, archived })
  }

  const projects = await prisma.project.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { tasks: { where: { archivedAt: null } } } },
    },
  })
  return NextResponse.json(projects)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!session?.user || (role !== "ADMIN" && role !== "HOD")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const body = await req.json()
  const { name, description, icon, color } = body
  if (!name?.trim()) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      icon: icon?.trim() || "🎬",
      color: color?.trim() || "#3b82f6",
    },
  })
  return NextResponse.json(project, { status: 201 })
}
