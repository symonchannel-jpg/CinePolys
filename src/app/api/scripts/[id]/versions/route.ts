import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const versions = await prisma.scriptVersion.findMany({
    where: { scriptId: id, archivedAt: null },
    include: { uploadedBy: { select: { id: true, name: true } } },
    orderBy: { version: "desc" },
  })

  return NextResponse.json(versions)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const script = await prisma.script.findUnique({ where: { id } })
  if (!script) return NextResponse.json({ error: "Guion no encontrado" }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const notes = formData.get("notes") as string | null

  if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })

  const ALLOWED_EXTS = ["pdf", "docx", "doc", "txt", "fdx", "fountain"]
  const ext = file.name.split(".").pop()?.toLowerCase() || ""
  if (!ALLOWED_EXTS.includes(ext)) {
    return NextResponse.json({ error: `Extensión no permitida. Solo: ${ALLOWED_EXTS.join(", ")}` }, { status: 400 })
  }

  const lastVersion = await prisma.scriptVersion.findFirst({ where: { scriptId: id }, orderBy: { version: "desc" } })
  const version = (lastVersion?.version || 0) + 1

  const safeTitle = script.title.replace(/[^a-zA-Z0-9áéíóúñü\s-]/g, "").trim().replace(/\s+/g, "_")
  const fileName = `${safeTitle}_v${version}.${ext}`

  const { writeFile, mkdir } = await import("fs/promises")
  const path = await import("path")
  const uploadDir = path.join(process.cwd(), "public", "uploads", "scripts")

  await mkdir(uploadDir, { recursive: true })
  const bytes = await file.arrayBuffer()
  await writeFile(path.join(uploadDir, fileName), Buffer.from(bytes))

  const scriptVersion = await prisma.scriptVersion.create({
    data: {
      scriptId: id,
      version,
      filePath: `/uploads/scripts/${fileName}`,
      fileName,
      fileSize: file.size,
      uploadedById: session.user.id,
      notes: notes || undefined,
    },
    include: { uploadedBy: { select: { id: true, name: true } } },
  })

  await prisma.script.update({ where: { id }, data: { updatedAt: new Date() } })
  return NextResponse.json(scriptVersion, { status: 201 })
}
