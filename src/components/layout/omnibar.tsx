"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { SearchResult } from "@/types/index"
import { useProject } from "@/lib/project-context"

export function Omnibar() {
  const router = useRouter()
  const { currentProjectId } = useProject()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery("")
      setResults([])
    }
  }, [open])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }
    const params = new URLSearchParams()
    params.set("q", q)
    if (currentProjectId) params.set("projectId", currentProjectId)
    const res = await fetch(`/api/search?${params}`)
    const data = await res.json()
    setResults(data)
    setSelectedIndex(0)
  }, [currentProjectId])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 200)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && results[selectedIndex]) {
      router.push(results[selectedIndex].href)
      setOpen(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-border px-4">
          <span className="text-muted-foreground mr-2">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar tareas, archivos, personas..."
            className="flex-1 bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            ESC
          </kbd>
        </div>

        {results.length > 0 && (
          <div className="max-h-72 overflow-y-auto p-2">
            {results.map((item, i) => (
              <button
                key={item.id}
                onClick={() => {
                  router.push(item.href)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  i === selectedIndex ? "bg-accent text-accent-foreground" : "text-popover-foreground"
                )}
              >
                <span className="text-xs font-medium uppercase text-muted-foreground w-16 shrink-0">
                  {item.type}
                </span>
                <div className="flex-1 truncate">
                  <p className="font-medium">{item.title}</p>
                  {item.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Sin resultados para &ldquo;{query}&rdquo;
          </div>
        )}

        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <span>↑↓ navegar</span>
          <span className="mx-2">·</span>
          <span>Enter abrir</span>
          <span className="mx-2">·</span>
          <span>Esc cerrar</span>
        </div>
      </div>
    </div>
  )
}
