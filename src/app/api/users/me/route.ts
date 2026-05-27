import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const userId = session.user.id
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentProjectId: true, projectOrder: true, avatarIcon: true },
  })
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

  return NextResponse.json(user)
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const userId = session.user.id
  const body = await req.json()
  const { currentProjectId, projectOrder, avatarIcon } = body

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(currentProjectId !== undefined && { currentProjectId }),
        ...(projectOrder !== undefined && { projectOrder }),
        ...(avatarIcon !== undefined && { avatarIcon }),
      },
      select: { currentProjectId: true, projectOrder: true, avatarIcon: true },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Error al actualizar preferencias" }, { status: 500 })
  }
}
