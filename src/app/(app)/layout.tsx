import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Providers } from "@/components/providers"

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

  return (
    <Providers>
      <AppLayout>{children}</AppLayout>
    </Providers>
  )
}
