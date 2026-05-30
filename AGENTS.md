<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# CinePolys — Agent Memory

## Project overview
Film production management app (Next.js 16, React 19, Prisma 7, Tailwind CSS 4, SQLite dev / PostgreSQL prod).

## Auth & roles
- `ADMIN` — full access
- `HOD` — head of department (can create/edit/archive but not admin tasks)
- `CREW` — read-only + assigned tasks
- NextAuth.js with credentials provider

## State management
- React Query (`@tanstack/react-query`) for all API data
- `useProject()` context provides `currentProjectId`, project list, ordering
- SSE (server-sent events) via `src/lib/sse-bus.ts` for real-time notification panel

## Key files
| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Single source of truth (PostgreSQL). SQLite version auto-generated as `schema-sqlite.generated.prisma` |
| `src/app/globals.css` | Design tokens, semantic colors, type scale |
| `src/lib/api-hooks.ts` | All React Query hooks |
| `src/lib/constants.ts` | Shared labels/colors for all statuses/priorities |
| `src/lib/activity.ts` | Activity log helper |
| `src/lib/notifications.ts` | Notification helpers (SSE + DB) |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/lib/project-context.tsx` | Project context provider |
| `src/components/ui/form-tabs.tsx` | Accessible tab component |
| `src/components/ui/color-picker.tsx` | Reusable color picker |
| `src/components/ui/toast.tsx` | Toast system |
| `src/components/ui/pagination-controls.tsx` | Pagination UI |

## Design system (v0.7c)
- Corporate OKLCH palette defined in `globals.css` via `@theme inline`
- Semantic tokens: `primary` (slate-blue), `success` (teal), `warning` (amber), `info` (steel-blue), `danger` (brick), `neutral` (slate)
- Use Tailwind utilities: `bg-success`, `text-warning`, `border-info/20`, `bg-danger/10`
- Progress bars use inline `backgroundColor: "var(--success)"` for reliability
- All status/priority/complexity color maps centralized in `src/lib/constants.ts`
- Font: Geist Sans (`var(--font-geist-sans)`), body uses it via CSS variable
- Type scale: 3xs (10px) through 3xl (28px)

## API patterns
- All routes live in `src/app/api/`
- Auth check: `getServerSession(authOptions)` at top of each handler
- Project scoping via `projectId` query param (default: `"default-project"`)
- List endpoints return `{ items: [], total, page, limit, totalPages }` when pagination params provided
- `logActivity()` called after mutations that should appear in activity feed
- `notifyAllUsers()` / `notifyUser()` for SSE + DB notifications

## Pagination
- Offset-based: `page` (default 1), `limit` (default 20, max 100)
- Hooks accept optional `filters` record with `page`, `limit` keys
- `<PaginationControls>` component handles prev/next UI

## Date handling
- Call sheet `date` field is date-only (stored as midnight local time)
- Dashboard query uses `todayStart` (local midnight) for "next shoot" filter to include today
- When parsing YYYY-MM-DD, use `new Date(y, m-1, d)` not `new Date("YYYY-MM-DD")` to avoid UTC timezone offset

## FormTabs (U6)
- Tab buttons have `id`, `role="tab"`, `aria-selected`, `aria-controls`
- Content panels must have `role="tabpanel"`, `id`, `aria-labelledby`
- Use `tabpanelId(tabId, prefix?)` and `tabId(tabId, prefix?)` helpers from form-tabs.tsx
- Use `prefix` prop when multiple FormTabs on same page to keep IDs unique

## Toast system (U9)
- `ToastProvider` wraps the app layout
- `useToast()` returns `{ toast: ({ title, description, variant }) => void }`
- Variants: `"success"`, `"error"`, `"info"`
- Auto-dismisses after 5 seconds

## Prisma Json fields
- `Location.images` and `CallSheet.content` are native Prisma `Json` type
- Values are already parsed JavaScript objects when returned from Prisma — do NOT use `JSON.parse()`
- Cast with `as string[]` or `as SomeType` as needed

## How to add a new list page with pagination
1. API route: add `page`, `limit` params, `skip`/`take` in query, return `{ items, total, page, limit, totalPages }`
2. Hook: add optional `filters` param with `page`, `limit` keys
3. Page: add `page` state, pass to hook, destructure `items`, `total`, `totalPages`, add `<PaginationControls>`
4. Consumer pages using same hook (e.g. dailies using useLocations) must unwrap `data?.items || []`

## Release process
1. Update README roadmap
2. Commit and push to main
3. `gh release create vX.Y --title "..." --notes "..." --target main`
4. Or use GitHub API: `POST /repos/:owner/:repo/releases`

## Schema → single source of truth (v0.7c)
- `prisma/schema.prisma` is the sole authoritative schema (PostgreSQL provider)
- `prisma/schema-sqlite.generated.prisma` is auto-generated via `prisma.config.ts` (or `scripts/gen-sqlite-schema.mjs`) for local dev
- Delete old `schema-sqlite.prisma`, update all scripts to use generated schema
- For production: `npx prisma generate --schema prisma/schema.prisma`
- For local: `npx prisma generate --schema prisma/schema-sqlite.generated.prisma`

## Post-Production (v0.08) — Unified Feed Architecture

Post-producción was redesigned from 4 disconnected tabs (Cuts, VFX, ADR, Deliverables) into a **single unified feed** centered around the editor's workflow.

### Components (`src/components/modules/post-production/`)
| File | Purpose |
|------|---------|
| `CutsList.tsx` | Visible cut cards above the feed — click selects/deselects a cut for filtering |
| `FeedPanel.tsx` | Scrollable feed showing Notes + VFX items mixed chronologically |
| `FeedItem.tsx` | Card that renders as a Note or VFX item depending on `itemType` |
| `FilterBar.tsx` | Dropdown cuts selector, type filter (notes/vfx/all), status filter, search |
| `SlideOver.tsx` | Right-side slide-over panel for item details and actions |
| `NoteDetail.tsx` | Slide-over content: note details, toggle resolve, edit, create task |
| `VFXDetail.tsx` | Slide-over content: VFX status/assignee/description editing |
| `CreateCutDialog.tsx` | Dialog to create a new cut (name, version, video URL) |
| `CreateVFXDialog.tsx` | Dialog to create a new VFX shot (shot ID, description, complexity, assignee) |
| `CreateNoteDialog.tsx` | Dialog to add a screening note to a specific cut (timecode, category, content) |

### API routes (`src/app/api/post-production/`)
| Route | Method | Purpose |
|-------|--------|---------|
| `/feed` | GET | Unified feed: returns `{ cuts: [], items: [] }` with optional filters (`cutId`, `type`, `status`, `search`) |
| `/notes/[noteId]` | GET/PATCH/DELETE | CRUD for individual screening notes |
| `/notes/[noteId]/toggle-resolve` | POST | Toggle note between RESOLVED and PENDING |
| `/migrate` | POST | One-time migration: archives all ADR and Deliverable records (ADMIN only) |

### Hooks
- `usePostProductionFeed(filters?)` — unified feed query with `{ cuts, items }` response
- `useTogglePostNoteResolve(noteId)` — POST, invalidates `["post-production-feed"]`
- `useUpdatePostNote({ noteId, ... })` — PATCH, invalidates `["post-production-feed"]`
- `useDeletePostNote({ noteId })` — DELETE, invalidates `["post-production-feed"]`

### What was removed (v0.08)
- **ADR tab** (`PostADR` model) — too specific for complex feature films; records archived via migration
- **Deliverables tab** (`PostDeliverable` model) — QC checklist was overly enterprise; records archived
- **Tab-based navigation** — replaced by unified feed + filter bar

### Key design decisions
- **Cuts are the context, not feed items**. They appear as visible cards above the feed and in the filter dropdown. Selecting a cut shows its notes and enables the "Add Note" button.
- **All mutations invalidate `["post-production-feed"]`** in addition to their legacy query keys (`["post-cuts"]`, `["vfx-shots"]`).
- **Slide-over panel** replaces modals for item details. 400px right panel, overlay backdrop, Escape to close.
- **Archiving a cut** resets the filter if that cut was selected.

### Flow
1. Create a cut (`+ Nuevo Corte`) → appears in CutsList section + dropdown
2. Select the cut → `+ Agregar Nota` button appears
3. Add notes with timecode + category + content → appear in feed
4. Create VFX shots independently (`+ Nuevo VFX`) → appear in feed
5. Click any item → SlideOver with detail + actions (resolve, archive, create task)

## Known pre-existing issues
- `lightningcss.linux-x64-gnu.node` missing in CI — Tailwind 4 build issue, unrelated to app code
- `backup_schedule/` directory has old schema — TypeScript errors expected
- `tests/` directory — Playwright errors (module not installed for type checking)
