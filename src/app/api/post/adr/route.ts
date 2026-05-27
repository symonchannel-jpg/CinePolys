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

  const adrs = await prisma.postADR.findMany({
    where: { projectId, archivedAt: null },
    include: {
      castingMember: {
        select: {
          id: true,
          name: true,
          character: true,
          profilePhotoUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(adrs)
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

  const { projectId, castingMemberId, scene, line, status, notes, taskId } = body

  if (!projectId || !castingMemberId || !line?.trim()) {
    return NextResponse.json({ error: "El projectId, castingMemberId y la línea de diálogo son obligatorios" }, { status: 400 })
  }

  try {
    const adr = await prisma.postADR.create({
      data: {
        projectId,
        castingMemberId,
        scene: scene || null,
        line,
        status: status || "PENDING",
        notes: notes || null,
        taskId: taskId || null,
      },
      include: {
        castingMember: {
          select: {
            id: true,
            name: true,
            character: true,
            profilePhotoUrl: true,
          },
        },
      },
    })

    return NextResponse.json(adr, { status: 201 })
  } catch (err: any) {
    console.error("Error creating ADR line:", err)
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
  }
}
