"use client"

import { useState } from "react"
import { useTheme } from "@/lib/theme-context"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [jiggling, setJiggling] = useState(false)

  const handleClick = () => {
    setJiggling(true)
    toggleTheme()
    setTimeout(() => setJiggling(false), 500)
  }

  return (
    <button
      onClick={handleClick}
      className={`
        relative h-6 w-11 rounded-full transition-colors duration-300 shrink-0
        ${theme === "dark" ? "bg-primary/30" : "bg-primary/20"}
        ${jiggling ? "animate-jiggle" : ""}
      `}
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      <span
        className={`
          absolute top-0.5 left-0.5 flex h-5 w-5 items-center justify-center rounded-full
          bg-background shadow-md border border-border
          transition-all duration-300
          ${jiggling ? "animate-jiggle" : ""}
          ${theme === "dark" ? "translate-x-5" : "translate-x-0"}
        `}
      >
        {theme === "dark" ? (
          <Moon size={11} className="text-primary fill-primary/20" strokeWidth={2} />
        ) : (
          <Sun size={11} className="text-amber-500 stroke-amber-500 fill-amber-500/20" strokeWidth={2} />
        )}
      </span>
    </button>
  )
}
