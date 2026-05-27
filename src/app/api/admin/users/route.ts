import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    where: { archivedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
      createdAt: true,
    },
    orderBy: [{ isActive: "asc" }, { createdAt: "desc" }],
  })

  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const body = await req.json()
  const { name, email, password, role: userRole, departmentId } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Nombre, email y contraseña son obligatorios" }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: userRole || "CREW",
      isActive: true,
      departmentId: departmentId || null,
    },
  })

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    departmentId: user.departmentId,
    createdAt: user.createdAt,
  }, { status: 201 })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const body = await req.json()
  const { userId, isActive, newRole, departmentId } = body

  if (!userId) {
    return NextResponse.json({ error: "userId es obligatorio" }, { status: 400 })
  }

  const user = await prisma.user.findFirst({ where: { id: userId, archivedAt: null } })
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(isActive !== undefined && { isActive }),
      ...(newRole !== undefined && { role: newRole }),
      ...(departmentId !== undefined && { departmentId: departmentId || null }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
      createdAt: true,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { userId } = await req.json()

  if (!userId) {
    return NextResponse.json({ error: "userId es obligatorio" }, { status: 400 })
  }

  const user = await prisma.user.findFirst({ where: { id: userId, archivedAt: null } })
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

  const sessionUser = session.user
  if (user.id === sessionUser.id) {
    return NextResponse.json({ error: "No puedes archivarte a ti mismo" }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: userId },
    data: { archivedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
