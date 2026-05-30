const { execSync } = require("child_process")

const isVercel = process.env.VERCEL === "1"

if (!isVercel) {
  execSync("node scripts/gen-sqlite-schema.mjs", { stdio: "inherit" })
}

const schema = isVercel ? "prisma/schema.prisma" : "prisma/schema-sqlite.generated.prisma"
console.log(`Generating Prisma client with ${schema}...`)
execSync(`npx prisma generate --schema ${schema}`, { stdio: "inherit" })
