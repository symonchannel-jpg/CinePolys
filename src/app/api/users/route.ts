import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const users = await prisma.user.findMany({
    where: { archivedAt: null, isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(users)
}
