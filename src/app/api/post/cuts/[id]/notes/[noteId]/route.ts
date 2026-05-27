import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, props: { params: Promise<{ id: string; noteId: string }> }) {
  const { noteId } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 })
  }

  const { timecode, content, category, status, taskId } = body

  const existingNote = await prisma.postScreeningNote.findUnique({ where: { id: noteId } })
  if (!existingNote) return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 })

  try {
    const note = await prisma.postScreeningNote.update({
      where: { id: noteId },
      data: {
        ...(timecode !== undefined && { timecode }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
        ...(status !== undefined && { status }),
        ...(taskId !== undefined && { taskId: taskId || null }),
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(note)
  } catch (err: any) {
    console.error("Error updating screening note:", err)
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string; noteId: string }> }) {
  const { noteId } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const existingNote = await prisma.postScreeningNote.findUnique({ where: { id: noteId } })
  if (!existingNote) return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 })

  try {
    await prisma.postScreeningNote.delete({
      where: { id: noteId },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Error deleting screening note:", err)
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
  }
}
