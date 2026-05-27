import { PrismaClient } from "../src/generated/prisma/client"
import bcrypt from "bcryptjs"

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || ""
  const isPostgres = dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")

  if (isPostgres) {
    const { PrismaPg } = require("@prisma/adapter-pg")
    const adapter = new PrismaPg({ connectionString: dbUrl })
    return new PrismaClient({ adapter })
  }

  // SQLite for development
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3")
  const path = require("path")
  const dbPath = dbUrl.replace("file:", "") || "./prisma/dev.db"
  const absPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath)
  const adapter = new PrismaBetterSqlite3({ url: absPath })
  return new PrismaClient({ adapter })
}

const prisma = createPrismaClient()

async function main() {
  console.log("Seeding database...")

  const departments = [
    { name: "Dirección", description: "Dirección general y asistencia" },
    { name: "Arte", description: "Dirección de arte, escenografía y utilería" },
    { name: "Fotografía", description: "Dirección de fotografía e iluminación" },
    { name: "Sonido", description: "Sonido directo y post-producción de audio" },
    { name: "Vestuario", description: "Diseño y confección de vestuario" },
    { name: "Maquillaje", description: "Maquillaje y efectos especiales" },
    { name: "Producción", description: "Coordinación de producción" },
    { name: "Post-Producción", description: "Edición, VFX, color y sonido" },
  ]

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    })
  }

  const adminPassword = await bcrypt.hash("admin123", 10)
  await prisma.user.upsert({
    where: { email: "admin@cinepolis.com" },
    update: {},
    create: {
      name: "Admin CinePolys",
      email: "admin@cinepolis.com",
      password: adminPassword,
      role: "ADMIN",
      isActive: true,
    },
  })

  await prisma.project.upsert({
    where: { id: "default-project" },
    update: {},
    create: {
      id: "default-project",
      name: "Producción Actual",
      description: "Proyecto por defecto",
      status: "ACTIVE",
    },
  })

  console.log("Seed completed!")
  console.log("  Admin user: admin@cinepolis.com / admin123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
