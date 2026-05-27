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

  const { castingMemberId, scene, line, status, notes, taskId } = body

  const existing = await prisma.postADR.findFirst({ where: { id, archivedAt: null } })
  if (!existing) return NextResponse.json({ error: "Línea ADR no encontrada" }, { status: 404 })

  try {
    const adr = await prisma.postADR.update({
      where: { id },
      data: {
        ...(castingMemberId !== undefined && { castingMemberId }),
        ...(scene !== undefined && { scene: scene || null }),
        ...(line !== undefined && { line }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(taskId !== undefined && { taskId: taskId || null }),
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

    return NextResponse.json(adr)
  } catch (err: any) {
    console.error("Error updating ADR line:", err)
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const existing = await prisma.postADR.findFirst({ where: { id, archivedAt: null } })
  if (!existing) return NextResponse.json({ error: "Línea ADR no encontrada" }, { status: 404 })

  try {
    await prisma.postADR.update({
      where: { id },
      data: { archivedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Error archiving ADR line:", err)
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
  }
}
