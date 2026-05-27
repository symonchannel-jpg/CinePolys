import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")

  const items = await prisma.scriptBreakdownItem.findMany({
    where: { scriptId: id, archivedAt: null, ...(category && { category: category as any }) },
    include: { assignedTo: { select: { id: true, name: true } }, task: { select: { id: true, title: true, status: true } } },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  })

  return NextResponse.json(items)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const script = await prisma.script.findUnique({ where: { id } })
  if (!script) return NextResponse.json({ error: "Guion no encontrado" }, { status: 404 })

  const body = await req.json()
  const { scene, page, category, title, description, status, assignedToId, linkedId, linkedType, notes } = body

  if (!title?.trim()) return NextResponse.json({ error: "Título requerido" }, { status: 400 })

  const item = await prisma.scriptBreakdownItem.create({
    data: {
      scriptId: id,
      scene: scene || null,
      page: page || null,
      category: category || "OTHER",
      title,
      description: description || null,
      status: status || "PENDING",
      assignedToId: assignedToId || null,
      linkedId: linkedId || null,
      linkedType: linkedType || null,
      notes: notes || null,
    },
    include: { assignedTo: { select: { id: true, name: true } } },
  })

  await logActivity({
    projectId: script.projectId,
    entityType: "script",
    entityId: id,
    action: "BREAKDOWN_ADDED",
    details: JSON.stringify({ item: title, category }),
    userId: session.user.id,
  })

  return NextResponse.json(item, { status: 201 })
}
