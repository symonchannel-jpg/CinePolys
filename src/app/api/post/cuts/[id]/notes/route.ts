import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const notes = await prisma.postScreeningNote.findMany({
    where: { cutId: id },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { timecode: "asc" },
  })

  return NextResponse.json(notes)
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 })
  }

  const { timecode, content, category, taskId } = body

  if (!timecode?.trim() || !content?.trim() || !category) {
    return NextResponse.json({ error: "Timecode, contenido y categoría son obligatorios" }, { status: 400 })
  }

  const existingCut = await prisma.postCut.findFirst({ where: { id, archivedAt: null } })
  if (!existingCut) return NextResponse.json({ error: "Corte no encontrado" }, { status: 404 })

  try {
    const note = await prisma.postScreeningNote.create({
      data: {
        cutId: id,
        timecode,
        content,
        category,
        status: "PENDING",
        taskId: taskId || null,
        createdById: session.user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (err: any) {
    console.error("Error creating screening note:", err)
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
  }
}
