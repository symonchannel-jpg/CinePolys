import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!session?.user || (role !== "ADMIN" && role !== "HOD")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: {
        include: {
          department: true,
          assignments: { include: { user: true } },
          createdBy: true,
          comments: { include: { author: true } },
          activities: { include: { user: true } },
        },
      },
      scripts: true,
      locations: true,
      callSheets: { include: { createdBy: true } },
      casting: true,
    },
  })

  if (!project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })

  const backup = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      icon: project.icon,
      color: project.color,
      status: project.status,
      createdAt: project.createdAt,
    },
    tasks: project.tasks.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      departmentName: t.department?.name || null,
      assignedToNames: t.assignments.map((a: any) => a.user.name),
      createdByName: t.createdBy.name,
      dueDate: t.dueDate,
      createdAt: t.createdAt,
      comments: t.comments.map((c: any) => ({
        content: c.content,
        authorName: c.author.name,
        createdAt: c.createdAt,
      })),
      activities: t.activities.map((a: any) => ({
        action: a.action,
        details: a.details,
        userName: a.user.name,
        createdAt: a.createdAt,
      })),
    })),
    casting: project.casting.map((c: any) => ({
      name: c.name,
      character: c.character,
      contact: c.contact,
      notes: c.notes,
      createdAt: c.createdAt,
    })),
    locations: project.locations.map((l: any) => ({
      name: l.name,
      address: l.address,
      description: l.description,
      lat: l.lat,
      lng: l.lng,
    })),
    scripts: project.scripts.map((s: any) => ({
      title: s.title,
      version: s.version,
      content: s.content,
      uploadedAt: s.uploadedAt,
    })),
    callSheets: project.callSheets.map((cs: any) => ({
      date: cs.date,
      content: cs.content,
      createdByName: cs.createdBy.name,
      createdAt: cs.createdAt,
    })),
    stats: {
      totalTasks: project.tasks.length,
      totalCasting: project.casting.length,
      totalLocations: project.locations.length,
      totalScripts: project.scripts.length,
      totalCallSheets: project.callSheets.length,
    },
  }

  return NextResponse.json(backup)
}
