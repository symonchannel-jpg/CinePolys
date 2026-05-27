import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

const protectedRoutes = ["/dashboard", "/projects", "/tasks", "/scripts", "/locations", "/casting", "/dailies", "/vfx-tracking"]
const authRoutes = ["/login", "/register"]

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtected = protectedRoutes.some((route) => path.startsWith(route))
  const isAuth = authRoutes.some((route) => path.startsWith(route))

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuthenticated = !!token

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", req.nextUrl)
    loginUrl.searchParams.set("callbackUrl", path)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuth && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
