import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role

  try {
    const [notifications, unreadCount, myTasksCount, pendingUsersCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.notification.count({ where: { userId, read: false } }),
      prisma.task.count({
        where: { archivedAt: null, assignments: { some: { userId } }, NOT: { status: "COMPLETED" } },
      }),
      role === "ADMIN"
        ? prisma.user.count({ where: { isActive: false, archivedAt: null } })
        : Promise.resolve(0),
    ])

    return NextResponse.json({
      notifications,
      unreadCount,
      summary: {
        myTasksCount,
        pendingUsersCount,
      },
    })
  } catch (err) {
    console.error("Error fetching notifications", err)
    return NextResponse.json({ error: "Error interno al obtener notificaciones" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { notificationId, markAll } = await req.json()
  const userId = session.user.id

  if (markAll) {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    })
  } else if (notificationId) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const userId = session.user.id

  await prisma.notification.deleteMany({
    where: { userId, read: true },
  })

  return NextResponse.json({ success: true })
}
