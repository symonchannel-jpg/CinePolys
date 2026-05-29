import { prisma } from "./prisma"
import { sseBus } from "./sse-bus"

async function emitToUser(userId: string, unreadCount?: number) {
  if (unreadCount === undefined) {
    unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    })
  }
  sseBus.emit(userId, JSON.stringify({
    type: "notification",
    unreadCount,
  }))
}

async function batchEmit(userIds: string[]) {
  if (userIds.length === 0) return
  const unreadCounts = await prisma.notification.groupBy({
    by: ["userId"],
    where: { userId: { in: userIds }, read: false },
    _count: { id: true },
  })
  const countMap = new Map(unreadCounts.map((uc: any) => [uc.userId, uc._count.id]))
  await Promise.all(userIds.map((userId) =>
    emitToUser(userId, countMap.get(userId) ?? 0)
  ))
}

export async function notifyAllUsers(params: {
  title: string
  message?: string
  type?: string
  link?: string
  excludeUserId?: string
}) {
  const users = await prisma.user.findMany({
    where: { archivedAt: null, isActive: true },
    select: { id: true },
  })

  const notifications = users
    .filter((u: any) => u.id !== params.excludeUserId)
    .map((u: any) => ({
      userId: u.id,
      title: params.title,
      message: params.message || null,
      type: params.type || "info",
      link: params.link || null,
    }))

  if (notifications.length === 0) return

  await prisma.notification.createMany({ data: notifications })
  await batchEmit(notifications.map((n) => n.userId))
}

export async function notifyUser(params: {
  userId: string
  title: string
  message?: string
  type?: string
  link?: string
}) {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message || null,
      type: params.type || "info",
      link: params.link || null,
    },
  })
  await emitToUser(params.userId)
}

export async function notifyAdmins(params: {
  title: string
  message?: string
  type?: string
  link?: string
}) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", archivedAt: null, isActive: true },
    select: { id: true },
  })

  if (admins.length === 0) return

  await prisma.notification.createMany({
    data: admins.map((u: any) => ({
      userId: u.id,
      title: params.title,
      message: params.message || null,
      type: params.type || "info",
      link: params.link || null,
    })),
  })

  await batchEmit(admins.map((u: any) => u.id))
}
