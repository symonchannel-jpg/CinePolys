import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import { checkRateLimit } from "./rate-limiter"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null

        const ip = req?.headers?.["x-forwarded-for"]?.[0] || req?.headers?.["x-real-ip"]?.[0] || "unknown"
        if (!checkRateLimit(`login:${ip}`, 10, 60000)) {
          throw new Error("Demasiados intentos de inicio de sesión. Intenta de nuevo en un minuto.")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) return null
        if (user.archivedAt) return null
        if (!user.isActive) {
          throw new Error("Cuenta pendiente de aprobación")
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
          isActive: user.isActive,
          avatarIcon: (user as any).avatarIcon,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.departmentId = user.departmentId
        token.isActive = user.isActive
        token.avatarIcon = (user as any).avatarIcon
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).role = token.role as string
        (session.user as any).departmentId = token.departmentId as string | null
        (session.user as any).isActive = token.isActive as boolean
        (session.user as any).avatarIcon = token.avatarIcon as string | null
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
