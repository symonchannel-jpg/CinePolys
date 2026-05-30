import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, props: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const note = await prisma.postScreeningNote.findUnique({
    where: { id: noteId },
    include: {
      createdBy: { select: { id: true, name: true } },
      cut: { select: { id: true, name: true, version: true } },
    },
  })

  if (!note) return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 })

  return NextResponse.json(note)
}

export async function PATCH(req: Request, props: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const { status, content, taskId } = body

  const note = await prisma.postScreeningNote.findUnique({ where: { id: noteId } })
  if (!note) return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 })

  try {
    const updated = await prisma.postScreeningNote.update({
      where: { id: noteId },
      data: {
        ...(status !== undefined && { status }),
        ...(content !== undefined && { content }),
        ...(taskId !== undefined && { taskId }),
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        cut: { select: { id: true, name: true, version: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    await prisma.postScreeningNote.delete({ where: { id: noteId } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
  }
}