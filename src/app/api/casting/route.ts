import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"
import { mkdir } from "fs/promises"
import path from "path"
import { processImageUpload, getPublicPaths } from "@/lib/image-processor"

const ACTORS_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "actors")

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId") || "default-project"
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
  const skip = (page - 1) * limit

  const [members, total] = await Promise.all([
    prisma.castingMember.findMany({
      where: { archivedAt: null, projectId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.castingMember.count({ where: { archivedAt: null, projectId } }),
  ])
  return NextResponse.json({ items: members, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!session?.user || role === "CREW") return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const contentType = req.headers.get("content-type") || ""
  if (contentType.startsWith("multipart/form-data")) {
    try {
      const formData = await req.formData()
      const name = (formData.get("name") as string)?.trim()
      if (!name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })

      const character = (formData.get("character") as string) || null
      const contact = (formData.get("contact") as string) || null
      const notes = (formData.get("notes") as string) || null
      const projectId = (formData.get("projectId") as string) || "default-project"

      let profilePhotoUrl: string | null = null
      const file = formData.get("profilePhoto") as File | null
      if (file && file.size > 0) {
        if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 })
        if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "La imagen no debe superar 2 MB" }, { status: 400 })

        const baseName = `${Date.now()}-${name.replace(/[^a-zA-Z0-9\-_]/g, "_")}`
        const paths = await processImageUpload(file, ACTORS_UPLOAD_DIR, baseName)
        profilePhotoUrl = getPublicPaths("actors", baseName).thumbnail
      }

      const member = await prisma.castingMember.create({
        data: { name, character, contact, notes, profilePhotoUrl, projectId },
      })
      await logActivity({ projectId, entityType: "casting", entityId: member.id, action: "CREATED", userId: session.user.id })
      return NextResponse.json(member, { status: 201 })
    } catch (err) {
      console.error("Error POST /api/casting (multipart):", err)
      return NextResponse.json({ error: "Error interno al crear actor" }, { status: 500 })
    }
  }

  const body = await req.json()
  const { name, character, contact, notes, projectId = "default-project" } = body
  if (!name?.trim()) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })

  const member = await prisma.castingMember.create({
    data: { name, character, contact, notes, projectId },
  })
  await logActivity({ projectId, entityType: "casting", entityId: member.id, action: "CREATED", userId: session.user.id })
  return NextResponse.json(member, { status: 201 })
}
