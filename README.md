# CinePolys — Gestión de Producción Cinematográfica

Sistema integral para la gestión de producciones audiovisuales. Organiza proyectos, equipos, guiones, locaciones, casting, tareas, llamados de producción y post-producción desde un solo panel.

## Objetivo

Centralizar y simplificar la administración de producciones cinematográficas, reemplazando planillas sueltas y comunicaciones dispersas por una plataforma unificada con roles, notificaciones en tiempo real y control de flujo de trabajo desde pre-producción hasta entrega final.

## Guía de instalación

### Requisitos

- Node.js 20+
- npm

### Pasos

```bash
# Clonar el repositorio
git clone https://github.com/symonchannel-jpg/CinePolys.git
cd CinePolys

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Generar cliente de Prisma y sincronizar base de datos
npx prisma generate --schema prisma/schema-sqlite.prisma
npx prisma db push --schema prisma/schema-sqlite.prisma

# Sembrar datos iniciales (opcional)
npx tsx prisma/seed.ts

# Iniciar servidor de desarrollo
npm run dev -- --port 3001
```

> **Windows:** Podés usar `start.bat` que hace todos los pasos automáticamente.  
> **Mac / Linux:** Los comandos de arriba funcionan igual. Opcionalmente creá un `start.sh` con la misma lógica.

### Acceso

Abrir [http://localhost:3001](http://localhost:3001). La app redirige al login automáticamente.

## Documentación extra

### Stack técnico

| Capa          | Tecnología                          |
| ------------- | ----------------------------------- |
| Frontend      | Next.js 16, React 19, Tailwind CSS 4 |
| UI            | Base UI, Lucide React               |
| Base de datos | SQLite (desarrollo) / PostgreSQL (producción) |
| ORM           | Prisma 7                            |
| Autenticación | NextAuth v4                         |
| Mapas         | Leaflet                             |
| Imágenes      | Sharp                               |

### Estructura del proyecto

```
src/
├── app/
│   ├── (app)/          # Rutas autenticadas (Dashboard, Proyectos, Tareas, etc.)
│   ├── api/            # API routes (REST)
│   ├── login/          # Login
│   ├── register/       # Registro
│   └── share/          # Links compartidos
├── components/
│   ├── layout/         # AppLayout, Sidebar, Omnibar, etc.
│   ├── modules/        # Componentes funcionales (mapa de locaciones, etc.)
│   └── ui/             # Componentes base (Button, Dialog, Input, Select, etc.)
├── lib/                # Lógica compartida (auth, prisma, utils, contexto)
└── types/              # Tipos TypeScript
```

### Roles

- **ADMIN** — Acceso completo, gestión de usuarios y proyectos
- **HOD** — Head of Department, gestiona su equipo y tareas
- **CREW** — Miembro del equipo, visualiza y actualiza tareas asignadas

### Módulos

- **Dashboard** — Resumen por proyecto con métricas clave
- **Proyectos** — CRUD de proyectos con ordenamiento drag & drop
- **Guiones** — Versiones, desglose por escena y seguimiento
- **Casting** — Base de datos de elenco y perfiles
- **Locaciones** — Mapa interactivo con Leaflet
- **Tareas** — Tablero con filtros, comentarios y vencimientos
- **Llamados** — Call sheets con links compartidos
- **Departamentos** — Organización del equipo
- **Post-producción** — Seguimiento de VFX, cortes, ADR y entregables
- **Actividad** — Historial de cambios en tiempo real (SSE)
