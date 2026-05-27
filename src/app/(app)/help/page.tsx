import { Keyboard, CheckSquare, LayoutDashboard, ShieldCheck, Sparkles, LifeBuoy } from "lucide-react"

export default function HelpPage() {
  const helpCategories = [
    {
      title: "Atajos de teclado",
      icon: Keyboard,
      items: [
        "⌘K / Ctrl+K — Buscador global (Omnibar)",
        "⌘T / Ctrl+T — Alternar tema (Oscuro / Claro)",
        "⌘B / Ctrl+B — Abrir/cerrar la Papelera",
        "⌘N / Ctrl+N — Crear nuevo proyecto",
        "Esc — Cerrar modales o menús",
      ],
    },
    {
      title: "Tareas y Colaboración",
      icon: CheckSquare,
      items: [
        "Filtros por estado, prioridad y departamento.",
        "Menciones @Nombre en comentarios notifican directamente.",
        "Crea tareas automáticas desde el desglose usando 'T'.",
        "Badges visuales y sonoros al crear/completar tareas.",
      ],
    },
    {
      title: "Navegación y Proyectos",
      icon: LayoutDashboard,
      items: [
        "Personaliza proyectos con el selector de color premium.",
        "La Papelera aísla elementos por proyecto activo.",
        "Panel lateral organizado por etapas de producción.",
        "Crea copias de seguridad desde la barra lateral.",
      ],
    },
    {
      title: "Roles y Permisos",
      icon: ShieldCheck,
      items: [
        "ADMIN: Acceso total y gestión de usuarios.",
        "HOD: Control de su departamento y tareas.",
        "CREW: Vista limitada y tareas asignadas.",
        "SECURITY: Monitor de incidentes (Próximamente).",
      ],
    },
    {
      title: "Características Premium",
      icon: Sparkles,
      items: [
        "Notificaciones instantáneas en tiempo real (SSE).",
        "Enlaces compartibles para Dailies / Call Sheets.",
        "Tracking de VFX con estados y complejidad.",
        "Miniaturas automáticas para imágenes subidas.",
      ],
    },
    {
      title: "Soporte y Contacto",
      icon: LifeBuoy,
      items: [
        "Contacta al productor o administrador del proyecto.",
        "¿Problemas técnicos? Escribe al soporte interno.",
        "Consulta la documentación para guías detalladas.",
      ],
    },
  ]

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Centro de Ayuda</h1>
        <p className="text-sm text-muted-foreground mt-1">Guía rápida y novedades de CinePolys</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {helpCategories.map((category) => {
          const Icon = category.icon
          return (
            <div
              key={category.title}
              className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:bg-muted/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">{category.title}</h2>
              </div>
              <ul className="space-y-2.5">
                {category.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
