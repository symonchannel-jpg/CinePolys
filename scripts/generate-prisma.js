const { execSync } = require("child_process")

const isVercel = process.env.VERCEL === "1"
const schema = isVercel ? "prisma/schema.prisma" : "prisma/schema-sqlite.prisma"

console.log(`Generating Prisma client with ${schema}...`)
execSync(`npx prisma generate --schema ${schema}`, { stdio: "inherit" })
