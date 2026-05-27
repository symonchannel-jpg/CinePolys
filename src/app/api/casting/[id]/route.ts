import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"
import { mkdir } from "fs/promises"
import path from "path"
import { processImageUpload, getPublicPaths, deleteImageFiles } from "@/lib/image-processor"

const ACTORS_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "actors")

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const member = await prisma.castingMember.findUnique({ where: { id } })
  if (!member) return NextResponse.json({ error: "Actor no encontrado" }, { status: 404 })

  return NextResponse.json(member)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!session?.user || role === "CREW") return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const { id } = await params

  const contentType = req.headers.get("content-type") || ""
  if (contentType.startsWith("multipart/form-data")) {
    try {
      const formData = await req.formData()
      const name = (formData.get("name") as string)?.trim()
      if (!name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })

      const character = (formData.get("character") as string) || null
      const contact = (formData.get("contact") as string) || null
      const notes = (formData.get("notes") as string) || null
      const projectId = (formData.get("projectId") as string) || null

      const current = await prisma.castingMember.findUnique({ where: { id } })
      if (!current) return NextResponse.json({ error: "Actor no encontrado" }, { status: 404 })

      let profilePhotoUrl = current.profilePhotoUrl
      const file = formData.get("profilePhoto") as File | null
      if (file && file.size > 0) {
        if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 })
        if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "La imagen no debe superar 2 MB" }, { status: 400 })

        const baseName = `${Date.now()}-${name.replace(/[^a-zA-Z0-9\-_]/g, "_")}`
        await processImageUpload(file, ACTORS_UPLOAD_DIR, baseName)
        profilePhotoUrl = getPublicPaths("actors", baseName).thumbnail

        if (current.profilePhotoUrl) {
          await deleteImageFiles(path.join(process.cwd(), "public", current.profilePhotoUrl))
        }
      }

      const updated = await prisma.castingMember.update({
        where: { id },
        data: { name, character, contact, notes, profilePhotoUrl, updatedAt: new Date() },
      })
      await logActivity({ projectId: current.projectId, entityType: "casting", entityId: id, action: "UPDATED", userId: session.user.id })
      return NextResponse.json(updated)
    } catch (err) {
      console.error("Error PATCH /api/casting/[id] (multipart):", err)
      return NextResponse.json({ error: "Error interno al actualizar actor" }, { status: 500 })
    }
  }

  const body = await req.json()
  const { name, character, contact, notes } = body
  if (!name?.trim()) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })

  try {
    const current = await prisma.castingMember.findUnique({ where: { id } })
    const updated = await prisma.castingMember.update({
      where: { id },
      data: { name, character, contact, notes, updatedAt: new Date() },
    })
    if (current) await logActivity({ projectId: current.projectId, entityType: "casting", entityId: id, action: "UPDATED", userId: session.user.id })
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: "Actor no encontrado" }, { status: 404 })
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
  const member = await prisma.castingMember.findUnique({ where: { id } })
  if (!member) return NextResponse.json({ error: "Actor no encontrado" }, { status: 404 })

  await prisma.castingMember.update({
    where: { id },
    data: { archivedAt: new Date() },
  })

  await logActivity({ projectId: member.projectId, entityType: "casting", entityId: id, action: "ARCHIVED", userId: session.user.id })

  if (member.profilePhotoUrl) {
    await deleteImageFiles(path.join(process.cwd(), "public", member.profilePhotoUrl))
  }

  return NextResponse.json({ success: true })
}
