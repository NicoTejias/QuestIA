/**
 * Utilidades de periodos académicos.
 *
 * Un semestre se identifica con el string `AAAA-N` (ej. `2026-1`). Se evita a
 * propósito una unión de literales tipo `'2026-1' | '2026-2'`: el software tiene
 * que seguir funcionando en 2027 sin tocar el código.
 */

/** Valor especial del selector: no filtrar por semestre. */
export const TODOS_LOS_SEMESTRES = '__todos__'

/** Valor especial del selector: ramos sin semestre asignado. */
export const SIN_SEMESTRE = '__sin_semestre__'

const RE_SEMESTRE = /^(\d{4})-([12])$/

export function esSemestreValido(valor: string | null | undefined): boolean {
    return !!valor && RE_SEMESTRE.test(valor)
}

/** Descompone `2026-1` en `{ anio: 2026, periodo: 1 }`. */
export function parseSemestre(valor: string): { anio: number; periodo: 1 | 2 } | null {
    const m = RE_SEMESTRE.exec(valor)
    if (!m) return null
    return { anio: Number(m[1]), periodo: Number(m[2]) as 1 | 2 }
}

/** Etiqueta legible: `2026-1` → `2026 · 1er semestre`. */
export function formatSemestre(valor: string | null | undefined): string {
    if (!valor) return 'Sin semestre'
    if (valor === TODOS_LOS_SEMESTRES) return 'Todos los semestres'
    if (valor === SIN_SEMESTRE) return 'Sin semestre'
    const p = parseSemestre(valor)
    if (!p) return valor
    return `${p.anio} · ${p.periodo === 1 ? '1er' : '2do'} semestre`
}

/** Etiqueta corta para espacios reducidos: `2026-1`. */
export function formatSemestreCorto(valor: string | null | undefined): string {
    if (!valor) return 'Sin semestre'
    if (valor === TODOS_LOS_SEMESTRES) return 'Todos'
    if (valor === SIN_SEMESTRE) return 'Sin semestre'
    return valor
}

/** Orden cronológico descendente: el semestre más reciente primero. */
export function compararSemestresDesc(a: string, b: string): number {
    const pa = parseSemestre(a)
    const pb = parseSemestre(b)
    if (!pa || !pb) return a < b ? 1 : -1
    return pb.anio - pa.anio || pb.periodo - pa.periodo
}

/** El semestre que sigue: `2026-1` → `2026-2`, `2026-2` → `2027-1`. */
export function siguienteSemestre(valor: string): string {
    const p = parseSemestre(valor)
    if (!p) return valor
    return p.periodo === 1 ? `${p.anio}-2` : `${p.anio + 1}-1`
}

export function anteriorSemestre(valor: string): string {
    const p = parseSemestre(valor)
    if (!p) return valor
    return p.periodo === 2 ? `${p.anio}-1` : `${p.anio - 1}-2`
}

/**
 * Semestre que corresponde a una fecha según el calendario académico chileno:
 * el primer semestre va de marzo a julio, el segundo de agosto a enero.
 * Enero y febrero se cuentan como cierre del segundo semestre del año anterior.
 */
export function semestreDeFecha(fecha: Date = new Date()): string {
    const anio = fecha.getFullYear()
    const mes = fecha.getMonth() + 1
    if (mes <= 2) return `${anio - 1}-2`
    if (mes <= 7) return `${anio}-1`
    return `${anio}-2`
}

/**
 * Opciones para el selector de semestre al crear o programar un ramo:
 * el actual, el siguiente y algunos anteriores, sin duplicar los ya existentes.
 */
export function opcionesDeSemestre(existentes: string[] = []): string[] {
    const actual = semestreDeFecha()
    const base = new Set<string>([
        siguienteSemestre(actual),
        actual,
        anteriorSemestre(actual),
        anteriorSemestre(anteriorSemestre(actual)),
        ...existentes.filter(esSemestreValido),
    ])
    return [...base].sort(compararSemestresDesc)
}
