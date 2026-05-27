import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!session?.user || (role !== "ADMIN" && role !== "HOD")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params

  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })

  let backup: any
  try {
    const body = await req.json()
    backup = body
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  if (!backup.project || !backup.version) {
    return NextResponse.json({ error: "Formato de backup inválido" }, { status: 400 })
  }

  // Validar límites para prevenir abuso
  const MAX_RECORDS = 5000
  const recordCount = (backup.tasks?.length || 0) + (backup.casting?.length || 0) +
    (backup.locations?.length || 0) + (backup.scripts?.length || 0) +
    (backup.callSheets?.length || 0)
  if (recordCount > MAX_RECORDS) {
    return NextResponse.json({ error: `Demasiados registros (máx ${MAX_RECORDS})` }, { status: 400 })
  }
  if (recordCount === 0) {
    return NextResponse.json({ error: "El backup está vacío" }, { status: 400 })
  }

  const userId = session.user.id
  const results = { tasks: 0, casting: 0, locations: 0, scripts: 0, callSheets: 0 }

  await prisma.$transaction(async (tx: any) => {
    const deptCache = new Map<string, string>()

    if (backup.tasks?.length) {
      for (const t of backup.tasks) {
        let deptId: string | null = null
        if (t.departmentName) {
          if (!deptCache.has(t.departmentName)) {
            const dept = await tx.department.upsert({
              where: { name: t.departmentName },
              update: {},
              create: { name: t.departmentName },
            })
            deptCache.set(t.departmentName, dept.id)
          }
          deptId = deptCache.get(t.departmentName)!
        }

        await tx.task.create({
          data: {
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            departmentId: deptId,
            projectId: id,
            createdById: userId,
            dueDate: t.dueDate ? new Date(t.dueDate) : null,
            comments: t.comments?.length
              ? { create: t.comments.map((c: any) => ({
                  content: c.content,
                  authorId: userId,
                })) }
              : undefined,
            activities: t.activities?.length
              ? { create: t.activities.map((a: any) => ({
                  action: a.action,
                  details: a.details,
                  userId,
                })) }
              : undefined,
          },
        })
        results.tasks++
      }
    }

    if (backup.casting?.length) {
      for (const c of backup.casting) {
        await tx.castingMember.create({
          data: {
            name: c.name,
            character: c.character,
            contact: c.contact,
            notes: c.notes,
            projectId: id,
          },
        })
        results.casting++
      }
    }

    if (backup.locations?.length) {
      for (const l of backup.locations) {
        await tx.location.create({
          data: {
            name: l.name,
            address: l.address,
            description: l.description,
            lat: l.lat,
            lng: l.lng,
            images: "[]",
            projectId: id,
          },
        })
        results.locations++
      }
    }

    if (backup.scripts?.length) {
      for (const s of backup.scripts) {
        await tx.script.create({
          data: {
            title: s.title,
            version: s.version || 1,
            content: s.content,
            projectId: id,
          },
        })
        results.scripts++
      }
    }

    if (backup.callSheets?.length) {
      for (const cs of backup.callSheets) {
        await tx.callSheet.create({
          data: {
            date: new Date(cs.date),
            content: cs.content || "{}",
            projectId: id,
            createdById: userId,
          },
        })
        results.callSheets++
      }
    }
  })

  return NextResponse.json({ success: true, imported: results })
}
