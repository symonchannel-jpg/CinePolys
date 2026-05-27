export const testWords = [
  // ——— Nombres de proyecto / título ———
  "Luna",           // 1  nombre corto
  "Cenizas del ayer", // 2 título compuesto
  "El último rayo", // 3 título con artículo

  // ——— Departamentos / áreas ———
  "Ambientación",   // 4 departamento

  // ——— Nombres de actor / casting ———
  "Mariana López",           // 5 nombre persona
  "Dr. Fuentes",             // 6 con título
  "Capitán Rojas",           // 7 rol/personaje

  // ——— Personajes ———
  "El Viajero",     // 8 personaje
  "Sombras",        // 9 personaje simple

  // ——— Direcciones / locaciones ———
  "Av. Reforma 222",          // 10 dirección
  "Bosque de Chapultepec",    // 11 locación
  "Estudio 7, Foro A",        // 12 estudio

  // ——— Notas técnicas ———
  "Revisar iluminación del set",          // 13 nota tarea
  "Confirmar disponibilidad del dron",    // 14 nota casting
  "Renderizar en 4K ProRes 4444",         // 15 nota VFX
  "Sincronizar audio con claqueta",       // 16 nota sonido

  // ——— Guion / desglose ———
  "Escena del bosque",          // 17 escena
  "Vestuario de época 1920",    // 18 utilería
  "Efecto de lluvia CGI",       // 19 VFX
  "Take 5 – mejor actuación",   // 20 nota rodaje
]

export function pickRandom(n: number = 1): string[] {
  const shuffled = [...testWords].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}
