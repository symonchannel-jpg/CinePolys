import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const callSheet = await prisma.callSheet.findUnique({ where: { id } })
  if (!callSheet) return NextResponse.json({ error: "Call sheet no encontrado" }, { status: 404 })

  const shareToken = crypto.randomBytes(16).toString("hex")

  const updated = await prisma.callSheet.update({
    where: { id },
    data: { shareToken },
  })

  return NextResponse.json({ shareToken, url: `/share/${shareToken}` })
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  await prisma.callSheet.update({
    where: { id },
    data: { shareToken: null },
  })

  return NextResponse.json({ success: true })
}
