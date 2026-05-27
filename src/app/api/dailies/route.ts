import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId") || "default-project"

  const sheets = await prisma.callSheet.findMany({
    where: { archivedAt: null, projectId },
    include: { createdBy: { select: { name: true } } },
    orderBy: { date: "asc" },
  })

  return NextResponse.json(sheets)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!session?.user || (role !== "ADMIN" && role !== "HOD")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const body = await req.json()
  const { date, content, projectId } = body

  if (!date) {
    return NextResponse.json({ error: "La fecha es obligatoria" }, { status: 400 })
  }

  const pid = projectId || "default-project"

  // Asegurar proyecto existe
  await prisma.project.upsert({
    where: { id: pid },
    update: {},
    create: { id: pid, name: "Producción Actual", status: "ACTIVE" },
  })

  const sheet = await prisma.callSheet.create({
    data: {
      date: new Date(date),
      content: content || "{}",
      createdById: session.user.id,
      projectId: pid,
    },
    include: { createdBy: { select: { name: true } } },
  })

  await logActivity({ projectId: pid, entityType: "dailies", entityId: sheet.id, action: "CREATED", userId: session.user.id })

  return NextResponse.json(sheet, { status: 201 })
}
