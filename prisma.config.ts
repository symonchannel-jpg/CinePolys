import { defineConfig } from "prisma/config"
import { readFileSync, writeFileSync } from "fs"
import { join } from "path"

const isProd = process.env.NODE_ENV === "production"
const mainSchema = join("prisma", "schema.prisma")
const root = process.cwd()

let schema = mainSchema

if (!isProd) {
  const src = readFileSync(join(root, mainSchema), "utf-8")
  const dest = src.replace('provider = "postgresql"', 'provider = "sqlite"')
  const genPath = join("prisma", "schema-sqlite.generated.prisma")
  writeFileSync(join(root, genPath), dest)
  schema = genPath
}

export default defineConfig({
  schema,
  migrations: {
    path: "prisma/migrations",
  },
  datasource: isProd
    ? { url: process.env.DATABASE_URL }
    : { url: "file:./prisma/dev.db" },
})
