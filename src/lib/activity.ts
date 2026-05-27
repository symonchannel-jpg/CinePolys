import { prisma } from "./prisma"

type EntityType = "task" | "script" | "casting" | "location" | "vfx" | "dailies"

export async function logActivity(params: {
  taskId?: string
  projectId?: string
  entityType?: EntityType
  entityId?: string
  action: string
  details?: string
  userId: string
}) {
  if (params.taskId) {
    await prisma.activityLog.create({
      data: {
        taskId: params.taskId,
        action: params.action,
        details: params.details || null,
        userId: params.userId,
      },
    })
    return
  }

  if (params.projectId && params.entityType && params.entityId) {
    const entityTypeMap: Record<EntityType, string> = {
      task: "taskId",
      script: "scriptId",
      casting: "castingId",
      location: "locationId",
      vfx: "vfxShotId",
      dailies: "callSheetId",
    }
    const relationField = entityTypeMap[params.entityType]

    await prisma.activityLog.create({
      data: {
        action: params.action,
        details: params.details || null,
        userId: params.userId,
        [relationField]: params.entityId,
      } as any,
    })
  }
}
