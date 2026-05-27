import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

  const updated = await prisma.user.update({
    where: { id },
    data: {
      // Only allow updating certain fields from this endpoint
      ...(body.departmentId !== undefined && { departmentId: body.departmentId || null }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
    select: { id: true, name: true, email: true, role: true, departmentId: true, isActive: true },
  })

  return NextResponse.json(updated)
}
