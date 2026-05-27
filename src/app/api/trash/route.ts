import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")

  if (!projectId) {
    return NextResponse.json({ error: "Falta el projectId" }, { status: 400 })
  }

  const [tasks, scripts, locations, casting, callSheets, vfxShots] = await Promise.all([
    prisma.task.findMany({
      where: { NOT: { archivedAt: null }, projectId },
      include: { department: { select: { name: true } }, assignments: { include: { user: { select: { name: true } } } } },
      orderBy: { archivedAt: "desc" },
      take: 50,
    }),
    prisma.script.findMany({
      where: { NOT: { archivedAt: null }, projectId },
      orderBy: { archivedAt: "desc" },
      take: 50,
    }),
    prisma.location.findMany({
      where: { NOT: { archivedAt: null }, projectId },
      orderBy: { archivedAt: "desc" },
      take: 50,
    }),
    prisma.castingMember.findMany({
      where: { NOT: { archivedAt: null }, projectId },
      orderBy: { archivedAt: "desc" },
      take: 50,
    }),
    prisma.callSheet.findMany({
      where: { NOT: { archivedAt: null }, projectId },
      orderBy: { archivedAt: "desc" },
      take: 50,
    }),
    prisma.vFXShot.findMany({
      where: { NOT: { archivedAt: null }, projectId },
      orderBy: { archivedAt: "desc" },
      take: 50,
    }),
  ])

  return NextResponse.json({ tasks, scripts, locations, casting, callSheets, vfxShots })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { type, id } = await req.json()
  if (type === "task") await prisma.task.update({ where: { id }, data: { archivedAt: null } })
  else if (type === "script") await prisma.script.update({ where: { id }, data: { archivedAt: null } })
  else if (type === "location") await prisma.location.update({ where: { id }, data: { archivedAt: null } })
  else if (type === "casting") await prisma.castingMember.update({ where: { id }, data: { archivedAt: null } })
  else if (type === "dailies") await prisma.callSheet.update({ where: { id }, data: { archivedAt: null } })
  else if (type === "vfx") await prisma.vFXShot.update({ where: { id }, data: { archivedAt: null } })
  else return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })

  return NextResponse.json({ success: true })
}
