"use client"

import { SessionProvider } from "next-auth/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { ProjectProvider } from "@/lib/project-context"
import { ThemeProvider } from "@/lib/theme-context"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ProjectProvider>
            {children}
          </ProjectProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
