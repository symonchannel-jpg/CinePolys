import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") || "").trim().toLowerCase()
  if (q.length < 2) return NextResponse.json([])

  const projectId = searchParams.get("projectId") || "default-project"

  const [tasks, casting, locations, scripts, users] = await Promise.all([
    prisma.task.findMany({
      where: { archivedAt: null, projectId, OR: [{ title: { contains: q } }, { description: { contains: q } }] },
      take: 5,
      select: { id: true, title: true, status: true },
    }),
    prisma.castingMember.findMany({
      where: { archivedAt: null, projectId, OR: [{ name: { contains: q } }, { character: { contains: q } }] },
      take: 5,
    }),
    prisma.location.findMany({
      where: { archivedAt: null, projectId, OR: [{ name: { contains: q } }, { address: { contains: q } }] },
      take: 5,
    }),
    prisma.script.findMany({
      where: { archivedAt: null, projectId, title: { contains: q } },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      take: 5,
    }),
    prisma.user.findMany({
      where: { archivedAt: null, name: { contains: q } },
      take: 5,
    }),
  ])

  const results: Array<{ id: string; type: string; title: string; subtitle?: string; href: string }> = []

  tasks.forEach((t: any) => {
    results.push({ id: t.id, type: "Tarea", title: t.title, subtitle: t.status, href: `/tasks/${t.id}` })
  })
  casting.forEach((c: any) => {
    results.push({ id: c.id, type: "Actor", title: c.name, subtitle: c.character || undefined, href: `/casting?focus=${c.id}` })
  })
  locations.forEach((l: any) => {
    results.push({ id: l.id, type: "Locación", title: l.name, subtitle: l.address || undefined, href: `/locations?focus=${l.id}` })
  })
  scripts.forEach((s: any) => {
    const latestVersion = s.versions?.[0]?.version
    results.push({
      id: s.id, type: "Guión", title: s.title,
      subtitle: latestVersion ? `v${latestVersion}` : s.status, href: `/scripts?focus=${s.id}`,
    })
  })
  users.forEach((u: any) => {
    results.push({ id: u.id, type: "Usuario", title: u.name, subtitle: u.email, href: `/admin/users` })
  })

  return NextResponse.json(results)
}
