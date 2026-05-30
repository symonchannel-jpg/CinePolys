import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, props: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const note = await prisma.postScreeningNote.findUnique({ where: { id: noteId } })
  if (!note) return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 })

  const newStatus = note.status === "RESOLVED" ? "PENDING" : "RESOLVED"

  const updated = await prisma.postScreeningNote.update({
    where: { id: noteId },
    data: { status: newStatus },
    include: {
      createdBy: { select: { id: true, name: true } },
      cut: { select: { id: true, name: true, version: true } },
    },
  })

  return NextResponse.json(updated)
}