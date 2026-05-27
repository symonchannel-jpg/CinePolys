import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const complexity = searchParams.get("complexity")
  const assignedToId = searchParams.get("assignedToId")
  const projectId = searchParams.get("projectId") || "default-project"

  const where: any = { archivedAt: null, projectId }

  if (status) where.status = status
  if (complexity) where.complexity = complexity
  if (assignedToId) where.assignedToId = assignedToId

  const shots = await prisma.vFXShot.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(shots)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 })
  }

  const { shotId, description, status, complexity, assignedToId, projectId, notes } = body

  if (!shotId?.trim()) {
    return NextResponse.json({ error: "El Shot ID es obligatorio" }, { status: 400 })
  }

  try {
    const pid = projectId || "default-project"

    const shot = await prisma.vFXShot.create({
      data: {
        shotId,
        description,
        status: status || "PENDING",
        complexity: complexity || "MEDIUM",
        assignedToId: assignedToId || null,
        projectId: pid,
        notes,
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    })

    await logActivity({ projectId: pid, entityType: "vfx", entityId: shot.id, action: "CREATED", userId: session.user.id })

    return NextResponse.json(shot, { status: 201 })
  } catch (err: any) {
    console.error("Error creating VFX shot:", err)
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
  }
}
