"use client"

import { Suspense } from "react"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      if (result.error === "Cuenta pendiente de aprobación") {
        setError("Tu cuenta aún no ha sido aprobada por un administrador")
      } else if (result.error === "CredentialsSignin") {
        setError("Email o contraseña incorrectos")
      } else {
        setError("Credenciales inválidas")
      }
      setLoading(false)
      return
    }

    router.push(callbackUrl)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Contraseña
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
          <p className="text-sm text-destructive">{error}</p>
          {error.includes("no activada") && (
            <p className="text-xs text-muted-foreground mt-1">
              Tu cuenta está pendiente de aprobación. Contacta a un administrador.
            </p>
          )}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">CinePolys</h1>
          <p className="text-sm text-muted-foreground mt-1">Inicia sesión en tu producción</p>
        </div>

        <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Cargando...</div>}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <a href="/register" className="text-primary hover:underline">
            Solicitar registro
          </a>
        </p>
      </div>
    </div>
  )
}
