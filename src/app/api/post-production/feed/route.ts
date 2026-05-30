import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  const cutId = searchParams.get("cutId")
  const type = searchParams.get("type")
  const status = searchParams.get("status")
  const search = searchParams.get("search")

  if (!projectId) {
    return NextResponse.json({ error: "El projectId es obligatorio" }, { status: 400 })
  }

  const cuts = await prisma.postCut.findMany({
    where: { projectId, archivedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, version: true },
  })

  const notesWhere: any = {
    cut: { projectId, archivedAt: null },
  }
  if (cutId) notesWhere.cutId = cutId
  if (status) notesWhere.status = status
  if (search) {
    notesWhere.OR = [
      { content: { contains: search, mode: "insensitive" } },
      { timecode: { contains: search, mode: "insensitive" } },
    ]
  }

  const notes = await prisma.postScreeningNote.findMany({
    where: notesWhere,
    include: {
      createdBy: { select: { id: true, name: true } },
      cut: { select: { id: true, name: true, version: true } },
    },
    orderBy: { timecode: "asc" },
  })

  const vfxWhere: any = {
    projectId,
    archivedAt: null,
  }
  if (status) vfxWhere.status = status
  if (search) {
    vfxWhere.OR = [
      { shotId: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ]
  }

  const vfx = await prisma.vFXShot.findMany({
    where: vfxWhere,
    include: {
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const notesWithType = notes.map((n) => ({ ...n, itemType: "note" as const }))
  const vfxWithType = vfx.map((v) => ({ ...v, itemType: "vfx" as const }))

  const items = [...notesWithType, ...vfxWithType].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateB - dateA
  })

  return NextResponse.json({ cuts, items })
}