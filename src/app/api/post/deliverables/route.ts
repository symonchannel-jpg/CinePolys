import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")

  if (!projectId) {
    return NextResponse.json({ error: "El projectId es obligatorio" }, { status: 400 })
  }

  const deliverables = await prisma.postDeliverable.findMany({
    where: { projectId, archivedAt: null },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(deliverables)
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

  const { projectId, name, type, status, notes, assignedToId } = body

  if (!projectId || !name?.trim()) {
    return NextResponse.json({ error: "El projectId y el nombre del entregable son obligatorios" }, { status: 400 })
  }

  try {
    const deliverable = await prisma.postDeliverable.create({
      data: {
        projectId,
        name,
        type: type || "MASTER",
        status: status || "PENDING",
        notes: notes || null,
        assignedToId: assignedToId || null,
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

    return NextResponse.json(deliverable, { status: 201 })
  } catch (err: any) {
    console.error("Error creating deliverable:", err)
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
  }
}
