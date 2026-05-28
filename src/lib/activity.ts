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
    // Lookup projectId from task to keep ActivityLog directly queryable by project
    let projectId = params.projectId
    if (!projectId) {
      const task = await prisma.task.findUnique({
        where: { id: params.taskId },
        select: { projectId: true },
      })
      projectId = task?.projectId || undefined
    }

    await prisma.activityLog.create({
      data: {
        projectId: projectId || null,
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
        projectId: params.projectId,
        action: params.action,
        details: params.details || null,
        userId: params.userId,
        [relationField]: params.entityId,
      } as any,
    })
  }
}
