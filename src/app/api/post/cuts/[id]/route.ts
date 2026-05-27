import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 })
  }

  const { name, version, status, videoUrl, notes } = body

  const existing = await prisma.postCut.findFirst({ where: { id, archivedAt: null } })
  if (!existing) return NextResponse.json({ error: "Corte no encontrado" }, { status: 404 })

  try {
    const cut = await prisma.postCut.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(version !== undefined && { version: Number(version) }),
        ...(status !== undefined && { status }),
        ...(videoUrl !== undefined && { videoUrl: videoUrl || null }),
        ...(notes !== undefined && { notes: notes || null }),
      },
      include: {
        screeningNotes: {
          orderBy: { timecode: "asc" },
          include: {
            createdBy: { select: { id: true, name: true } },
          },
        },
      },
    })

    return NextResponse.json(cut)
  } catch (err: any) {
    console.error("Error updating cut:", err)
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const existing = await prisma.postCut.findFirst({ where: { id, archivedAt: null } })
  if (!existing) return NextResponse.json({ error: "Corte no encontrado" }, { status: 404 })

  try {
    await prisma.postCut.update({
      where: { id },
      data: { archivedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Error archiving cut:", err)
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
  }
}
