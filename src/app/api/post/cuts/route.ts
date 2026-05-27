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

  const cuts = await prisma.postCut.findMany({
    where: { projectId, archivedAt: null },
    include: {
      screeningNotes: {
        orderBy: { timecode: "asc" },
        include: {
          createdBy: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(cuts)
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

  const { name, version, status, videoUrl, notes, projectId } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: "El nombre del corte es obligatorio" }, { status: 400 })
  }

  if (!projectId) {
    return NextResponse.json({ error: "El projectId es obligatorio" }, { status: 400 })
  }

  try {
    const cut = await prisma.postCut.create({
      data: {
        name,
        version: Number(version) || 1,
        status: status || "DRAFT",
        videoUrl: videoUrl || null,
        notes: notes || null,
        projectId,
      },
      include: {
        screeningNotes: true,
      },
    })

    return NextResponse.json(cut, { status: 201 })
  } catch (err: any) {
    console.error("Error creating cut:", err)
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
  }
}
