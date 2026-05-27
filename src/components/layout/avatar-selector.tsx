"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Cat, Dog, Rabbit, Bird, Fish, Turtle, Snail, Bug, Ghost, User, Smile } from "lucide-react"

export const AVATAR_ICONS = {
  User,
  Smile,
  Cat,
  Dog,
  Rabbit,
  Bird,
  Fish,
  Turtle,
  Snail,
  Bug,
  Ghost,
}

export type AvatarIconName = keyof typeof AVATAR_ICONS

interface AvatarSelectorProps {
  currentIcon?: string | null
  userName?: string | null
  open: boolean // from sidebar
}

export function AvatarSelector({ currentIcon, userName, open }: AvatarSelectorProps) {
  const { update } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const initial = (userName || "U")[0].toUpperCase()
  
  // Safe fallback if icon doesn't exist
  const IconComponent = currentIcon && AVATAR_ICONS[currentIcon as AvatarIconName] 
    ? AVATAR_ICONS[currentIcon as AvatarIconName] 
    : null

  const handleSelect = async (iconName: string) => {
    setIsUpdating(true)
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarIcon: iconName })
      })
      
      if (res.ok) {
        await update() // Force NextAuth to fetch new session
        setIsOpen(false)
      }
    } catch (e) {
      console.error("Failed to update avatar", e)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        className="h-7 w-7 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary hover:bg-primary/30 transition-colors"
        title="Cambiar avatar"
      >
        {IconComponent ? <IconComponent size={14} strokeWidth={2.5} /> : initial}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-center">Elige tu Avatar</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-3 py-4">
          {Object.entries(AVATAR_ICONS).map(([name, Icon]) => {
            const isSelected = currentIcon === name || (!currentIcon && name === "User")
            return (
              <button
                key={name}
                onClick={() => handleSelect(name)}
                disabled={isUpdating}
                className={`flex aspect-square items-center justify-center rounded-xl border transition-all duration-200 ${
                  isSelected 
                    ? "border-primary bg-primary/20 text-primary ring-2 ring-primary/30" 
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Icon size={24} strokeWidth={1.5} />
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
