import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId") || "default-project"
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
  const skip = (page - 1) * limit

  const [scripts, total] = await Promise.all([
    prisma.script.findMany({
      where: { archivedAt: null, projectId },
      skip,
      take: limit,
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.script.count({ where: { archivedAt: null, projectId } }),
  ])

  const items = await Promise.all(
    scripts.map(async (s) => {
      const [totalItems, completedItems, pendingItems] = await Promise.all([
        prisma.scriptBreakdownItem.count({ where: { scriptId: s.id, archivedAt: null } }),
        prisma.scriptBreakdownItem.count({ where: { scriptId: s.id, archivedAt: null, status: "COMPLETED" } }),
        prisma.scriptBreakdownItem.count({ where: { scriptId: s.id, archivedAt: null, status: "PENDING" } }),
      ])
      return {
        ...s,
        _count: { total: totalItems, completed: completedItems, pending: pendingItems },
      }
    })
  )

  return NextResponse.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const formData = await req.formData()
  const title = formData.get("title") as string
  const file = formData.get("file") as File | null
  const projectId = (formData.get("projectId") as string) || "default-project"
  const scriptType = (formData.get("type") as string) || "LITERARY"

  if (!title?.trim() || !file) {
    return NextResponse.json({ error: "Título y archivo son obligatorios" }, { status: 400 })
  }

  const ALLOWED_EXTS = ["pdf", "docx", "doc", "txt", "fdx", "fountain"]
  const ext = file.name.split(".").pop()?.toLowerCase() || ""
  if (!ALLOWED_EXTS.includes(ext)) {
    return NextResponse.json({ error: `Extensión no permitida. Solo: ${ALLOWED_EXTS.join(", ")}` }, { status: 400 })
  }
  const safeTitle = title.replace(/[^a-zA-Z0-9áéíóúñü\s-]/g, "").trim().replace(/\s+/g, "_")

  const existing = await prisma.script.findFirst({
    where: { title, projectId, archivedAt: null },
  })

  if (existing) {
    const lastVersion = await prisma.scriptVersion.findFirst({
      where: { scriptId: existing.id },
      orderBy: { version: "desc" },
    })
    const version = (lastVersion?.version || 0) + 1
    const fileName = `${safeTitle}_v${version}.${ext}`
    const uploadDir = path.join(process.cwd(), "public", "uploads", "scripts")

    await mkdir(uploadDir, { recursive: true })
    const bytes = await file.arrayBuffer()
    await writeFile(path.join(uploadDir, fileName), Buffer.from(bytes))

    const scriptVersion = await prisma.scriptVersion.create({
      data: {
        scriptId: existing.id,
        version,
        filePath: `/uploads/scripts/${fileName}`,
        fileName,
        fileSize: file.size,
        uploadedById: session.user.id,
      },
    })

    await prisma.script.update({ where: { id: existing.id }, data: { updatedAt: new Date() } })

    await logActivity({ projectId, entityType: "script", entityId: existing.id, action: "VERSION_ADDED", details: JSON.stringify({ version }), userId: session.user.id })

    return NextResponse.json({ ...existing, versions: [scriptVersion] }, { status: 200 })
  }

  const fileName = `${safeTitle}_v1.${ext}`
  const uploadDir = path.join(process.cwd(), "public", "uploads", "scripts")

  await mkdir(uploadDir, { recursive: true })
  const bytes = await file.arrayBuffer()
  await writeFile(path.join(uploadDir, fileName), Buffer.from(bytes))

  let project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    project = await prisma.project.create({ data: { id: projectId, name: "Producción Actual", status: "ACTIVE" } })
  }

  const script = await prisma.script.create({
    data: { title, type: scriptType as any, projectId },
  })

  await logActivity({ projectId, entityType: "script", entityId: script.id, action: "CREATED", userId: session.user.id })

  const scriptVersion = await prisma.scriptVersion.create({
    data: {
      scriptId: script.id,
      version: 1,
      filePath: `/uploads/scripts/${fileName}`,
      fileName,
      fileSize: file.size,
      uploadedById: session.user.id,
    },
  })

  return NextResponse.json({ ...script, versions: [scriptVersion] }, { status: 201 })
}
