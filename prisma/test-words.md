# 🎬 Palabras de prueba — CinePolys

20 palabras y frases en español para testear inputs de texto en la aplicación, organizadas por tipo de campo.

---

## Títulos de proyecto
| # | Palabra | Uso |
|---|---------|-----|
| 1 | `Luna` | nombre corto, 1 palabra |
| 2 | `Cenizas del ayer` | título compuesto, 3 palabras |
| 3 | `El último rayo` | título con artículo |

## Departamentos
| # | Palabra | Uso |
|---|---------|-----|
| 4 | `Ambientación` | nombre de departamento |

## Nombres (casting / usuarios)
| # | Palabra | Uso |
|---|---------|-----|
| 5 | `Mariana López` | nombre persona |
| 6 | `Dr. Fuentes` | nombre con título |
| 7 | `Capitán Rojas` | nombre con rango |

## Personajes
| # | Palabra | Uso |
|---|---------|-----|
| 8 | `El Viajero` | personaje con artículo |
| 9 | `Sombras` | personaje simple |

## Locaciones / Direcciones
| # | Palabra | Uso |
|---|---------|-----|
| 10 | `Av. Reforma 222` | dirección con número |
| 11 | `Bosque de Chapultepec` | locación natural |
| 12 | `Estudio 7, Foro A` | locación de estudio |

## Notas (descripciones / comentarios)
| # | Palabra | Uso |
|---|---------|-----|
| 13 | `Revisar iluminación del set` | nota de tarea |
| 14 | `Confirmar disponibilidad del dron` | nota de casting |
| 15 | `Renderizar en 4K ProRes 4444` | nota de VFX |
| 16 | `Sincronizar audio con claqueta` | nota de sonido |

## Guion / Desglose
| # | Palabra | Uso |
|---|---------|-----|
| 17 | `Escena del bosque` | elemento de escena |
| 18 | `Vestuario de época 1920` | elemento de vestuario |
| 19 | `Efecto de lluvia CGI` | elemento de VFX |
| 20 | `Take 5 – mejor actuación` | nota de rodaje |

---

## Cobertura de modelos

Cada palabra está diseñada para probar inputs en estos modelos de la base de datos:

| Modelo | Campos | Palabras aplicables |
|--------|--------|---------------------|
| `Project` | `name`, `description` | 1–3 |
| `Department` | `name`, `description` | 4 |
| `CastingMember` | `name`, `character`, `contact`, `notes` | 5–9, 14 |
| `User` | `name`, `email` | 5–7 |
| `Location` | `name`, `address`, `description` | 10–12 |
| `Task` | `title`, `description` | 13–16 |
| `Comment` | `content` | 13–20 |
| `Script` | `title` | 1–3, 17 |
| `ScriptBreakdownItem` | `title`, `description`, `notes` | 17–20 |
| `VFXShot` | `shotId`, `description`, `notes` | 15, 19 |
| `PostCut` | `name`, `notes` | 1–3 |
| `PostScreeningNote` | `content` | 13–20 |
| `PostADR` | `line`, `notes` | 16 |
| `PostDeliverable` | `name`, `notes` | 1–3 |
| `Notification` | `title`, `message` | 13–20 |
| `ActivityLog` | `action`, `details` | 13–20 |
