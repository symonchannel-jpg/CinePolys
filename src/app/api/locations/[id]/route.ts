import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"
import { mkdir } from "fs/promises"
import path from "path"
import { processImageUpload, getPublicPaths, deleteImageFiles } from "@/lib/image-processor"

const LOCATIONS_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "locations")

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const location = await prisma.location.findUnique({ where: { id } })
  if (!location) return NextResponse.json({ error: "Locación no encontrada" }, { status: 404 })

  return NextResponse.json(location)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!session?.user || role === "CREW") return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const { id } = await params
  const formData = await req.formData()

  const name = formData.get("name") as string | null
  const address = formData.get("address") as string | null
  const description = formData.get("description") as string | null
  const lat = formData.get("lat") ? parseFloat(formData.get("lat") as string) : null
  const lng = formData.get("lng") ? parseFloat(formData.get("lng") as string) : null
  const existingImagesRaw = formData.get("existingImages") as string | null
  const files = formData.getAll("images") as File[]

  const existing = await prisma.location.findFirst({ where: { id, archivedAt: null } })
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

  let savedImages: string[] = existingImagesRaw ? JSON.parse(existingImagesRaw) : JSON.parse(existing.images || "[]")
  await mkdir(LOCATIONS_UPLOAD_DIR, { recursive: true })

  for (const file of files) {
    if (file.size === 0) continue
    const baseName = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    await processImageUpload(file, LOCATIONS_UPLOAD_DIR, baseName)
    savedImages.push(getPublicPaths("locations", baseName).thumbnail)
  }

  try {
    const location = await prisma.location.update({
      where: { id },
      data: {
        ...(name !== null && name !== undefined && { name }),
        ...(address !== null && address !== undefined && { address }),
        ...(description !== null && description !== undefined && { description }),
        lat,
        lng,
        images: JSON.stringify(savedImages),
      },
    })
    await logActivity({ projectId: existing.projectId, entityType: "location", entityId: id, action: "UPDATED", userId: session.user.id })
    return NextResponse.json(location)
  } catch (err) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!session?.user || role === "CREW") return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const { id } = await params

  const location = await prisma.location.findUnique({ where: { id } })
  if (!location) return NextResponse.json({ error: "Locación no encontrada" }, { status: 404 })

  await prisma.location.update({
    where: { id },
    data: { archivedAt: new Date() },
  })

  await logActivity({ projectId: location.projectId, entityType: "location", entityId: id, action: "ARCHIVED", userId: session.user.id })

  try {
    const images: string[] = JSON.parse(location.images || "[]")
    for (const imgPath of images) {
      await deleteImageFiles(path.join(process.cwd(), "public", imgPath))
    }
  } catch { /* ignore parse errors */ }

  return NextResponse.json({ success: true })
}
