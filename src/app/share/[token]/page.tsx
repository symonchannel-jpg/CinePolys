import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { PrintButton } from "@/components/ui/print-button"

export default async function ShareCallSheetPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const callSheet = await prisma.callSheet.findUnique({
    where: { shareToken: token },
    include: {
      createdBy: { select: { name: true } },
      project: { select: { name: true } },
    },
  })

  if (!callSheet) notFound()

  const content = callSheet.content as any
  const isJson = content && typeof content === "object" && (content.crewCall || content.scenes || content.notes)

  return (
    <div className="min-h-screen bg-background p-8 print:bg-white print:p-0">
      <div className="max-w-2xl mx-auto print:max-w-none print:w-full print:mx-0">
        <div className="mb-8 flex items-center justify-between print:mb-4">
          <div className="text-left">
            <h1 className="text-2xl font-bold text-foreground">Call Sheet</h1>
            <p className="text-sm text-muted-foreground mt-1">{callSheet.project.name}</p>
          </div>
          <div className="print:hidden">
            <PrintButton />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4 print:border-0 print:p-0 print:shadow-none print:bg-white print:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {new Date(callSheet.date).toLocaleDateString("es", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h2>
            <span className="text-xs text-muted-foreground">
              Creado por {callSheet.createdBy.name}
            </span>
          </div>

          <div className="border-t border-border pt-4 print:border-t-2 print:border-foreground">
            {!isJson ? (
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans print:text-foreground">
                {content.text || callSheet.content}
              </pre>
            ) : (
              <div className="space-y-6 text-foreground">
                {/* Horarios Clave */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/40 print:border print:bg-gray-50">
                    <span className="text-2xl">⏰</span>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold print:text-gray-700">Crew Call</p>
                      <p className="text-base font-bold text-foreground print:text-black">{content.crewCall || "--:--"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/40 print:border print:bg-gray-50">
                    <span className="text-2xl">🎬</span>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold print:text-gray-700">Inicio Rodaje</p>
                      <p className="text-base font-bold text-foreground print:text-black">{content.shootStart || "--:--"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/40 print:border print:bg-gray-50">
                    <span className="text-2xl">🏁</span>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold print:text-gray-700">Fin Estimado</p>
                      <p className="text-base font-bold text-foreground print:text-black">{content.wrapTime || "--:--"}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Locación y Escenas */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-border bg-card/50 space-y-2 print:border print:bg-white">
                      <div className="flex items-center gap-2 text-foreground font-semibold text-sm print:text-black">
                        <span>📍</span> Locación Principal
                      </div>
                      {content.locationName ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-foreground print:text-black">{content.locationName}</p>
                            {content.locationLat && content.locationLng && (
                              <a
                                href={`https://www.google.com/maps?q=${content.locationLat},${content.locationLng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors print:text-blue-700 print:no-underline"
                                title="Abrir en Google Maps"
                              >
                                🗺️ Ver ubicación
                              </a>
                            )}
                          </div>
                          {content.locationAddress && (
                            <p className="text-xs text-muted-foreground print:text-gray-700">{content.locationAddress}</p>
                          )}
                          {content.additionalLocation && (
                            <p className="text-xs text-muted-foreground italic border-t border-border/40 pt-1 mt-1 print:text-gray-700">
                              Nota: {content.additionalLocation}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic print:text-gray-500">No se especificó locación principal.</p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-card/50 space-y-2 print:border print:bg-white">
                      <div className="flex items-center gap-2 text-foreground font-semibold text-sm print:text-black">
                        <span>📝</span> Escenas a Rodar
                      </div>
                      {content.scenes ? (
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed print:text-black">{content.scenes}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic print:text-gray-500">No se especificaron escenas.</p>
                      )}
                    </div>
                  </div>

                  {/* Reparto Convocado */}
                  <div className="p-4 rounded-xl border border-border bg-card/50 space-y-3 print:border print:bg-white">
                    <div className="flex items-center gap-2 text-foreground font-semibold text-sm print:text-black">
                      <span>🎭</span> Elenco Convocado
                    </div>
                    {content.casting && content.casting.length > 0 ? (
                      <div className="overflow-hidden border border-border/60 rounded-lg text-xs print:border-black">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-muted border-b border-border/60 font-semibold text-muted-foreground print:bg-gray-100 print:text-black">
                              <th className="p-2">Actor / Actriz</th>
                              <th className="p-2">Personaje</th>
                              <th className="p-2 text-right">Citación</th>
                            </tr>
                          </thead>
                          <tbody>
                            {content.casting.map((actor: any, idx: number) => (
                              <tr key={idx} className="border-b border-border/40 hover:bg-muted/30 print:border-b print:border-gray-200">
                                <td className="p-2 font-medium text-foreground print:text-black">{actor.name}</td>
                                <td className="p-2 text-muted-foreground print:text-black">{actor.character}</td>
                                <td className="p-2 text-right font-semibold text-primary print:text-black">{actor.callTime} hs</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic print:text-gray-500">Sin elenco convocado para esta jornada.</p>
                    )}
                  </div>
                </div>

                {/* Notas / Observaciones Especiales */}
                {content.notes && (
                  <div className="p-4 rounded-xl border border-border bg-primary/5 text-card-foreground space-y-1 print:border print:bg-white print:text-black">
                    <div className="flex items-center gap-2 text-foreground font-semibold text-xs uppercase tracking-wider print:text-black">
                      <span>⚠️</span> Instrucciones Especiales
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed print:text-black">{content.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 print:hidden">
          Este enlace es de solo lectura. Generado por CinePolys.
        </p>
      </div>
    </div>
  )
}

