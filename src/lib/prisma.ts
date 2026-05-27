import { PrismaClient } from "@/generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || ""
  const isPostgres = dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")

  if (isPostgres) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaPg } = require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg")
    const adapter = new PrismaPg({ connectionString: dbUrl })
    return new PrismaClient({ adapter })
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3") as typeof import("@prisma/adapter-better-sqlite3")
  const path = require("path") as typeof import("path")
  const dbPath = dbUrl.replace("file:", "") || "./prisma/dev.db"
  const absPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath)
  const adapter = new PrismaBetterSqlite3({ url: absPath })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
