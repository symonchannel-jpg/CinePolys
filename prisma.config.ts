import { defineConfig } from "prisma/config"

const isProd = process.env.NODE_ENV === "production"
const schema = isProd ? "prisma/schema.prisma" : "prisma/schema-sqlite.prisma"

export default defineConfig({
  schema,
  migrations: {
    path: "prisma/migrations",
  },
  datasource: isProd
    ? { url: process.env.DATABASE_URL }
    : { url: "file:./prisma/dev.db" },
})
