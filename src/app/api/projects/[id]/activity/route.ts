import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const project = await prisma.project.findUnique({ where: { id, archivedAt: null } })
  if (!project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })

  const activities = await prisma.activityLog.findMany({
    where: {
      OR: [
        { task: { projectId: id } },
        { script: { projectId: id } },
        { casting: { projectId: id } },
        { location: { projectId: id } },
        { vfxShot: { projectId: id } },
        { callSheet: { projectId: id } },
      ],
    },
    include: {
      user: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
      script: { select: { id: true, title: true } },
      casting: { select: { id: true, name: true } },
      location: { select: { id: true, name: true } },
      vfxShot: { select: { id: true, shotId: true } },
      callSheet: { select: { id: true, date: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  return NextResponse.json(activities)
}
