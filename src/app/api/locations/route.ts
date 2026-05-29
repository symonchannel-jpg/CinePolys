import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"
import { mkdir } from "fs/promises"
import path from "path"
import { processImageUpload, getPublicPaths } from "@/lib/image-processor"

const LOCATIONS_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "locations")

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId") || "default-project"
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
  const skip = (page - 1) * limit

  const [locations, total] = await Promise.all([
    prisma.location.findMany({
      where: { archivedAt: null, projectId },
      skip,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.location.count({ where: { archivedAt: null, projectId } }),
  ])
  return NextResponse.json({ items: locations, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!session?.user || role === "CREW") return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const formData = await req.formData()
  const name = formData.get("name") as string
  const address = formData.get("address") as string
  const description = formData.get("description") as string
  const lat = formData.get("lat") ? parseFloat(formData.get("lat") as string) : null
  const lng = formData.get("lng") ? parseFloat(formData.get("lng") as string) : null
  const files = formData.getAll("images") as File[]
  const projectId = (formData.get("projectId") as string) || "default-project"

  if (!name?.trim()) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })

  const savedImages: string[] = []
  await mkdir(LOCATIONS_UPLOAD_DIR, { recursive: true })

  for (const file of files) {
    if (file.size === 0) continue
    const baseName = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    const paths = await processImageUpload(file, LOCATIONS_UPLOAD_DIR, baseName)
    savedImages.push(getPublicPaths("locations", baseName).thumbnail)
  }

  const project = await prisma.project.upsert({
    where: { id: projectId },
    update: {},
    create: { id: projectId, name: "Producción Actual", status: "ACTIVE" },
  })

  const location = await prisma.location.create({
    data: {
      name,
      address: address || null,
      description: description || null,
      lat,
      lng,
      images: savedImages,
      projectId: project.id,
    },
  })

  await logActivity({ projectId: project.id, entityType: "location", entityId: location.id, action: "CREATED", userId: session.user.id })

  return NextResponse.json(location, { status: 201 })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!session?.user || role === "CREW") return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const formData = await req.formData()
  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const address = formData.get("address") as string
  const description = formData.get("description") as string
  const lat = formData.get("lat") ? parseFloat(formData.get("lat") as string) : null
  const lng = formData.get("lng") ? parseFloat(formData.get("lng") as string) : null
  const existingImagesRaw = formData.get("existingImages") as string
  const files = formData.getAll("images") as File[]

  const existing = await prisma.location.findFirst({ where: { id, archivedAt: null } })
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

  let savedImages: string[] = existingImagesRaw ? JSON.parse(existingImagesRaw) : (existing.images as string[]) || []
  await mkdir(LOCATIONS_UPLOAD_DIR, { recursive: true })

  for (const file of files) {
    if (file.size === 0) continue
    const baseName = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    const paths = await processImageUpload(file, LOCATIONS_UPLOAD_DIR, baseName)
    savedImages.push(getPublicPaths("locations", baseName).thumbnail)
  }

  const location = await prisma.location.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(address !== undefined && { address }),
      ...(description !== undefined && { description }),
      lat,
      lng,
      images: savedImages,
    },
  })

  await logActivity({ projectId: existing.projectId, entityType: "location", entityId: id, action: "UPDATED", userId: session.user.id })

  return NextResponse.json(location)
}
