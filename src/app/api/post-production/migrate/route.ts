import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const role = (session.user as any)?.role
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Solo ADMIN puede ejecutar esta migración" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")

  if (!projectId) {
    return NextResponse.json({ error: "El projectId es obligatorio" }, { status: 400 })
  }

  const now = new Date()

  const [adrResult, delivResult] = await Promise.all([
    prisma.postADR.updateMany({
      where: { projectId, archivedAt: null },
      data: { archivedAt: now },
    }),
    prisma.postDeliverable.updateMany({
      where: { projectId, archivedAt: null },
      data: { archivedAt: now },
    }),
  ])

  return NextResponse.json({
    archived: {
      adr: adrResult.count,
      deliverables: delivResult.count,
    },
  })
}