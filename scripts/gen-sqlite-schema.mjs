import { readFileSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")

const src = readFileSync(join(root, "prisma", "schema.prisma"), "utf-8")
const dest = src.replace('provider = "postgresql"', 'provider = "sqlite"')
writeFileSync(join(root, "prisma", "schema-sqlite.generated.prisma"), dest)
console.log("✔ Generated prisma/schema-sqlite.generated.prisma from schema.prisma")
