"use client"

import { useCallback } from "react"
import { cn } from "@/lib/utils"

export interface FormTab {
  id: string
  label: string
}

interface FormTabsProps {
  tabs: FormTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  prefix?: string
}

export function tabpanelId(tabId: string, prefix?: string) {
  return prefix ? `tabpanel-${prefix}-${tabId}` : `tabpanel-${tabId}`
}

export function tabId(tabId: string, prefix?: string) {
  return prefix ? `tab-${prefix}-${tabId}` : `tab-${tabId}`
}

export function FormTabs({ tabs, activeTab, onTabChange, prefix }: FormTabsProps) {
  const currentIndex = tabs.findIndex((t) => t.id === activeTab)

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight" && index < tabs.length - 1) {
      e.preventDefault()
      onTabChange(tabs[index + 1].id)
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault()
      onTabChange(tabs[index - 1].id)
    } else if (e.key === "Home") {
      e.preventDefault()
      onTabChange(tabs[0].id)
    } else if (e.key === "End") {
      e.preventDefault()
      onTabChange(tabs[tabs.length - 1].id)
    }
  }, [tabs, onTabChange])

  return (
    <div
      className="flex border-b border-border mb-4"
      role="tablist"
      aria-orientation="horizontal"
    >
      {tabs.map((tab, i) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            id={tabId(tab.id, prefix)}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={tabpanelId(tab.id, prefix)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={cn(
              "flex-1 pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
