"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useProject } from "@/lib/project-context"
import { Button } from "@/components/ui/button"
import { ArchiveButton } from "@/components/ui/archive-button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useDailies, useCreateDaily, useArchiveDaily, useLocations, useCasting } from "@/lib/api-hooks"
import { FormTabs, tabpanelId, tabId } from "@/components/ui/form-tabs"
import { useQueryClient } from "@tanstack/react-query"

function DailiesPageContent() {
  const { currentProjectId } = useProject()
  const { data: sheets = [], isLoading } = useDailies()
  const { data: locData } = useLocations()
  const { data: castData } = useCasting()
  const locations = locData?.items || []
  const castingMembers = castData?.items || []

  const createDaily = useCreateDaily()
  const archiveDaily = useArchiveDaily()
  const qc = useQueryClient()

  // Leer ?expand=id de la URL para auto expandir
  const searchParams = useSearchParams()
  const expandId = searchParams.get("expand")

  // Estado para llamados expandidos/colapsados
  const [expandedSheets, setExpandedSheets] = useState<Record<string, boolean>>({})

  // Auto expandir el sheet indicado en ?expand= con 100ms de delay
  useEffect(() => {
    if (expandId && sheets.length > 0) {
      const timer = setTimeout(() => {
        setExpandedSheets(prev => ({ ...prev, [expandId]: true }))
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [expandId, sheets])

  const [createOpen, setCreateOpen] = useState(false)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)

  const toggleExpand = (id: string) => {
    setExpandedSheets(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Estados del Formulario Estructurado
  const [activeTab, setActiveTab] = useState<"general" | "location" | "casting" | "plan">("general")
  const [formDate, setFormDate] = useState("")
  const [crewCall, setCrewCall] = useState("08:00")
  const [shootStart, setShootStart] = useState("09:00")
  const [wrapTime, setWrapTime] = useState("19:00")
  const [selectedLocationId, setSelectedLocationId] = useState("")
  const [additionalLocation, setAdditionalLocation] = useState("")
  const [selectedActors, setSelectedActors] = useState<Record<string, { selected: boolean; callTime: string }>>({})
  const [scenesText, setScenesText] = useState("")
  const [notesText, setNotesText] = useState("")

  function resetForm() {
    setFormDate("")
    setCrewCall("08:00")
    setShootStart("09:00")
    setWrapTime("19:00")
    setSelectedLocationId("")
    setAdditionalLocation("")
    setSelectedActors({})
    setScenesText("")
    setNotesText("")
    setActiveTab("general")
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    
    const callSheetData = {
      crewCall,
      shootStart,
      wrapTime,
      locationId: selectedLocationId,
      locationName: locations.find((l: any) => l.id === selectedLocationId)?.name || "",
      locationAddress: locations.find((l: any) => l.id === selectedLocationId)?.address || "",
      locationLat: locations.find((l: any) => l.id === selectedLocationId)?.lat || null,
      locationLng: locations.find((l: any) => l.id === selectedLocationId)?.lng || null,
      additionalLocation,
      casting: Object.entries(selectedActors)
        .filter(([_, value]) => value.selected)
        .map(([actorId, value]) => {
          const actor = castingMembers.find((a: any) => a.id === actorId)
          return {
            id: actorId,
            name: actor?.name || "",
            character: actor?.character || "",
            callTime: value.callTime || crewCall
          }
        }),
      scenes: scenesText,
      notes: notesText
    }

    await createDaily.mutateAsync({
      date: formDate,
      content: callSheetData,
      projectId: currentProjectId || "default-project"
    })
    
    setCreateOpen(false)
    resetForm()
  }

  const nextTab = () => {
    if (activeTab === "general") setActiveTab("location")
    else if (activeTab === "location") setActiveTab("casting")
    else if (activeTab === "casting") setActiveTab("plan")
  }
  
  const prevTab = () => {
    if (activeTab === "location") setActiveTab("general")
    else if (activeTab === "casting") setActiveTab("location")
    else if (activeTab === "plan") setActiveTab("casting")
  }

  async function handleShare(id: string) {
    const res = await fetch(`/api/dailies/${id}/share`, { method: "POST" })
    const data = await res.json()
    setShareToken(data.shareToken)
    setShareOpen(true)
    qc.invalidateQueries({ queryKey: ["dailies"] })
  }

  async function handleRevoke(id: string) {
    await fetch(`/api/dailies/${id}/share`, { method: "DELETE" })
    setShareOpen(false)
    setShareToken(null)
    qc.invalidateQueries({ queryKey: ["dailies"] })
  }

  async function handlePrint(sheet: { id: string; shareToken: string | null }) {
    let token = sheet.shareToken
    if (!token) {
      const res = await fetch(`/api/dailies/${sheet.id}/share`, { method: "POST" })
      const data = await res.json()
      token = data.shareToken
      qc.invalidateQueries({ queryKey: ["dailies"] })
    }
    window.open(`/share/${token}`, "_blank")
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/share/${token}`
    navigator.clipboard.writeText(url)
  }

  function handleArchive(id: string) {
    archiveDaily.mutate(id)
  }

  const renderCallSheetContent = (data: any) => {
    if (!data || typeof data !== "object" || (!data.crewCall && !data.scenes && !data.notes)) {
      return (
        <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
          {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
        </pre>
      )
    }

    return (
      <div className="space-y-6">
        {/* Horarios Clave */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
            <span className="text-2xl">⏰</span>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Crew Call</p>
              <p className="text-base font-bold text-foreground">{data.crewCall || "--:--"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
            <span className="text-2xl">🎬</span>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Inicio Rodaje</p>
              <p className="text-base font-bold text-foreground">{data.shootStart || "--:--"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
            <span className="text-2xl">🏁</span>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Fin Estimado</p>
              <p className="text-base font-bold text-foreground">{data.wrapTime || "--:--"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Locación y Escenas */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card/50 space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <span>📍</span> Locación Principal
              </div>
              {data.locationName ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">{data.locationName}</p>
                    {(() => {
                      const loc = locations.find((l: any) => l.id === data.locationId)
                      if (loc?.lat && loc?.lng) {
                        return (
                          <a
                            href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
                            title="Abrir en Google Maps"
                          >
                            🗺️ Ver ubicación
                          </a>
                        )
                      }
                      return null
                    })()}
                  </div>
                  {data.locationAddress && (
                    <p className="text-xs text-muted-foreground">{data.locationAddress}</p>
                  )}
                  {data.additionalLocation && (
                    <p className="text-xs text-muted-foreground italic border-t border-border/40 pt-1 mt-1">
                      Nota: {data.additionalLocation}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No se especificó locación principal.</p>
              )}
            </div>

            <div className="p-4 rounded-xl border border-border bg-card/50 space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <span>📝</span> Escenas a Rodar
              </div>
              {data.scenes ? (
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{data.scenes}</p>
              ) : (
                <p className="text-xs text-muted-foreground italic">No se especificaron escenas.</p>
              )}
            </div>
          </div>

          {/* Reparto Convocado */}
          <div className="p-4 rounded-xl border border-border bg-card/50 space-y-3">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <span>🎭</span> Elenco Convocado
            </div>
            {data.casting && data.casting.length > 0 ? (
              <div className="overflow-hidden border border-border/60 rounded-lg text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted border-b border-border/60 font-semibold text-muted-foreground">
                      <th className="p-2">Actor / Actriz</th>
                      <th className="p-2">Personaje</th>
                      <th className="p-2 text-right">Citación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.casting.map((actor: any, idx: number) => (
                      <tr key={idx} className="border-b border-border/40 hover:bg-muted/30">
                        <td className="p-2 font-medium text-foreground">{actor.name}</td>
                        <td className="p-2 text-muted-foreground">{actor.character}</td>
                        <td className="p-2 text-right font-semibold text-primary">{actor.callTime} hs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Sin elenco convocado para esta jornada.</p>
            )}
          </div>
        </div>

        {/* Notas / Observaciones Especiales */}
        {data.notes && (
          <div className="p-4 rounded-xl border border-border bg-primary/5 text-card-foreground space-y-1">
            <div className="flex items-center gap-2 text-foreground font-semibold text-xs uppercase tracking-wider">
              <span>⚠️</span> Instrucciones Especiales
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{data.notes}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Llamados (Call Sheets)</h1>
          <p className="text-sm text-muted-foreground mt-1">Generación y visualización de llamados diarios</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger render={<Button>Nuevo llamado</Button>} />
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear llamado estructurado</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Tab Navigation */}
              <FormTabs
                tabs={[
                  { id: "general", label: "General" },
                  { id: "location", label: "Locación" },
                  { id: "casting", label: "Casting" },
                  { id: "plan", label: "Plan y Notas" },
                ]}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as "general" | "location" | "casting" | "plan")}
              />

              {/* Tab 1: General & Horarios */}
              {activeTab === "general" && (
                <div id={tabpanelId("general")} role="tabpanel" aria-labelledby={tabId("general")} className="space-y-4 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <Label htmlFor="formDate">Fecha de Rodaje</Label>
                    <Input id="formDate" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="crewCall">Crew Call</Label>
                      <Input id="crewCall" type="time" value={crewCall} onChange={(e) => setCrewCall(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shootStart">Inicio Rodaje</Label>
                      <Input id="shootStart" type="time" value={shootStart} onChange={(e) => setShootStart(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wrapTime">Fin Estimado</Label>
                      <Input id="wrapTime" type="time" value={wrapTime} onChange={(e) => setWrapTime(e.target.value)} required />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Locación */}
              {activeTab === "location" && (
                <div id={tabpanelId("location")} role="tabpanel" aria-labelledby={tabId("location")} className="space-y-4 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <Label htmlFor="selectedLocationId">Locación Principal del Proyecto</Label>
                    <select
                      id="selectedLocationId"
                      value={selectedLocationId}
                      onChange={(e) => setSelectedLocationId(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                    >
                      <option value="" className="bg-popover text-foreground">-- Seleccionar Locación --</option>
                      {locations.map((loc: any) => (
                        <option key={loc.id} value={loc.id} className="bg-popover text-foreground">
                          {loc.name} {loc.address ? `(${loc.address})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="additionalLocation">Detalles del Set / Locaciones Adicionales</Label>
                    <Textarea
                      id="additionalLocation"
                      value={additionalLocation}
                      onChange={(e) => setAdditionalLocation(e.target.value)}
                      placeholder="Ej: Estudio A, primer piso. O locaciones secundarias..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Tab 3: Casting Convocado */}
              {activeTab === "casting" && (
                <div id={tabpanelId("casting")} role="tabpanel" aria-labelledby={tabId("casting")} className="space-y-4 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <Label>Seleccionar Reparto y Citación Individual</Label>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-none">
                      {castingMembers.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic text-center py-4">
                          No hay actores cargados en Casting.
                        </p>
                      ) : (
                        castingMembers.map((actor: any) => {
                          const state = selectedActors[actor.id] || { selected: false, callTime: crewCall }
                          return (
                            <div
                              key={actor.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  id={`actor-${actor.id}`}
                                  checked={state.selected}
                                  onChange={(e) => {
                                    setSelectedActors(prev => ({
                                      ...prev,
                                      [actor.id]: {
                                        selected: e.target.checked,
                                        callTime: state.callTime || crewCall
                                      }
                                    }))
                                  }}
                                  className="h-4 w-4 rounded-sm border-primary text-primary focus:ring-primary cursor-pointer"
                                />
                                <label htmlFor={`actor-${actor.id}`} className="text-sm cursor-pointer select-none">
                                  <span className="font-semibold text-foreground">{actor.name}</span>
                                  {actor.character && (
                                    <span className="text-xs text-muted-foreground ml-2">({actor.character})</span>
                                  )}
                                </label>
                              </div>
                              {state.selected && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Citación:</span>
                                  <Input
                                    type="time"
                                    value={state.callTime}
                                    onChange={(e) => {
                                      setSelectedActors(prev => ({
                                        ...prev,
                                        [actor.id]: {
                                          ...prev[actor.id],
                                          callTime: e.target.value
                                        }
                                      }))
                                    }}
                                    className="w-24 h-8 px-2 py-0 text-xs text-center font-bold"
                                  />
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Plan y Notas */}
              {activeTab === "plan" && (
                <div id={tabpanelId("plan")} role="tabpanel" aria-labelledby={tabId("plan")} className="space-y-4 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <Label htmlFor="scenesText">Escenas a Rodar</Label>
                    <Textarea
                      id="scenesText"
                      value={scenesText}
                      onChange={(e) => setScenesText(e.target.value)}
                      placeholder="Ej: Escena 14 (Pág 23), Escena 15 (Pág 25)..."
                      rows={3}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notesText">Instrucciones Especiales / Clima / Notas</Label>
                    <Textarea
                      id="notesText"
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="Ej: Traer ropa de abrigo. Se prevé lluvia a la tarde..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Dialog Footer Actions */}
              <div className="flex justify-between items-center border-t border-border pt-4 mt-6">
                <div>
                  {activeTab !== "general" && (
                    <Button type="button" variant="outline" onClick={prevTab}>
                      ← Anterior
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => { setCreateOpen(false); resetForm() }}>
                    Cancelar
                  </Button>
                  {activeTab !== "plan" ? (
                    <Button type="button" onClick={nextTab}>
                      Siguiente →
                    </Button>
                  ) : (
                    <Button type="submit" disabled={createDaily.isPending}>
                      {createDaily.isPending ? "Creando..." : "Crear Llamado 🎬"}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando llamados...</div>
      ) : sheets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No hay llamados aún</div>
      ) : (
        <div className="space-y-4">
          {sheets.map((sheet: { id: string; date: string; content: string; createdAt: string; createdBy: { name: string }; shareToken: string | null }) => {
            const isExpanded = !!expandedSheets[sheet.id]
            return (
              <div key={sheet.id} className="rounded-lg border border-border bg-card p-6 animate-jelly">
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-3 cursor-pointer select-none group/title"
                    onClick={() => toggleExpand(sheet.id)}
                  >
                    <span className={`text-[10px] text-muted-foreground transition-transform duration-300 group-hover/title:text-foreground ${isExpanded ? "rotate-90" : "rotate-0"}`}>
                      ▶
                    </span>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover/title:text-primary transition-colors">
                        {new Date(sheet.date).toLocaleDateString("es", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Creado por {sheet.createdBy.name} · {new Date(sheet.createdAt).toLocaleDateString("es")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handlePrint(sheet)}>
                      🖨️ Imprimir
                    </Button>
                    {sheet.shareToken ? (
                      <Button variant="outline" size="sm" onClick={() => { setShareToken(sheet.shareToken); setShareOpen(true) }}>
                        🔗 Compartido
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => handleShare(sheet.id)}>
                        Compartir
                      </Button>
                    )}
                    <ArchiveButton onArchive={() => handleArchive(sheet.id)} itemName={`"${new Date(sheet.date).toLocaleDateString("es")}"`} size="sm" variant="ghost" className="text-destructive hover:text-destructive" title="Archivar llamado" confirmTitle="Archivar llamado" confirmLabel="Archivar" />
                  </div>
                </div>
                
                {/* Collapsible Container with smooth professional animation */}
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    isExpanded 
                      ? "grid-rows-[1fr] opacity-100 mt-4 border-t border-border pt-4" 
                      : "grid-rows-[0fr] opacity-0 pointer-events-none"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="animate-in fade-in duration-200">
                      {renderCallSheetContent(sheet.content)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={shareOpen} onOpenChange={(o) => { if (!o) { setShareOpen(false); setShareToken(null) } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enlace compartido</DialogTitle></DialogHeader>
          {shareToken && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input readOnly value={`${window.location.origin}/share/${shareToken}`} />
                <Button onClick={() => copyLink(shareToken)}>Copiar</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Cualquiera con este enlace puede ver el call sheet. No requiere login.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="destructive" size="sm" onClick={() => {
                  const sheet = sheets.find((s: any) => s.shareToken === shareToken)
                  if (sheet) handleRevoke(sheet.id)
                }}>
                  Revocar enlace
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function DailiesPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-muted-foreground">Cargando llamados...</div>}>
      <DailiesPageContent />
    </Suspense>
  )
}
