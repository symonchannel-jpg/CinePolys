"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { TASK_STATUS_DOT as statusColors } from "@/lib/constants"

interface CalendarTask {
  id: string
  title: string
  status: string
  date: string
}

interface Props {
  tasks: CalendarTask[]
}

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
const dayNames = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"]

export function DashboardCalendar({ tasks }: Props) {
  const router = useRouter()
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const tasksByDate = useMemo(() => {
    const map = new Map<string, CalendarTask[]>()
    for (const t of tasks) {
      const d = new Date(t.date)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return map
  }, [tasks])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const weeks: (number | null)[][] = []
  let day = 1
  let nextMonthDay = 1

  for (let w = 0; w < 6; w++) {
    const week: (number | null)[] = []
    for (let d = 0; d < 7; d++) {
      if (w === 0 && d < firstDay) {
        week.push(null)
      } else if (day > daysInMonth) {
        week.push(null)
      } else {
        week.push(day)
        day++
      }
    }
    weeks.push(week)
    if (day > daysInMonth && weeks.length >= 4) break
  }

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1))
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1))
  }

  function isToday(d: number) {
    return d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  function getTasksForDay(d: number) {
    const key = `${year}-${month}-${d}`
    return tasksByDate.get(key) || []
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="text-muted-foreground hover:text-foreground transition-colors px-2 py-1 text-sm">←</button>
        <span className="text-sm font-medium text-foreground">{monthNames[month]} {year}</span>
        <button onClick={nextMonth} className="text-muted-foreground hover:text-foreground transition-colors px-2 py-1 text-sm">→</button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {dayNames.map((dn) => (
          <div key={dn} className="bg-muted/50 px-2 py-1.5 text-center text-[11px] font-medium text-muted-foreground">
            {dn}
          </div>
        ))}

        {weeks.map((week, wi) =>
          week.map((d, di) => {
            const tasksForDay = d ? getTasksForDay(d) : []
            const isTodayDay = d ? isToday(d) : false

            return (
              <div
                key={`${wi}-${di}`}
                className={`min-h-[80px] bg-card px-1.5 py-1 text-xs transition-colors ${
                  isTodayDay ? "ring-1 ring-primary ring-inset" : ""
                } ${d ? "hover:bg-muted/30 cursor-pointer" : ""}`}
                onClick={() => {
                  if (d) {
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
                    router.push(`/tasks?dueDate=${dateStr}`)
                  }
                }}
              >
                {d && (
                  <>
                    <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-medium ${
                      isTodayDay ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}>
                      {d}
                    </span>

                    {tasksForDay.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {tasksForDay.slice(0, 2).map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-1 truncate rounded px-1 py-0.5 hover:bg-muted/50 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); router.push(`/tasks/${task.id}`) }}
                          >
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusColors[task.status] || "bg-neutral"}`} />
                            <span className="truncate text-[10px] text-muted-foreground">{task.title}</span>
                          </div>
                        ))}
                        {tasksForDay.length > 2 && (
                          <span className="text-[10px] text-primary-text pl-1">+{tasksForDay.length - 2} más</span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
