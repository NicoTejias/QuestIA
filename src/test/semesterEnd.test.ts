import { describe, it, expect, vi, afterEach } from 'vitest'
import { getSemesterEndInfo } from '../lib/semesterApi'

const DIA = 24 * 60 * 60 * 1000

/** Fija "hoy" para que las pruebas no dependan de la fecha real de ejecución. */
const congelarHoy = (iso: string) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(iso))
}

afterEach(() => {
    vi.useRealTimers()
})

describe('getSemesterEndInfo', () => {
    it('usa la última clase calendarizada como fecha de término', () => {
        congelarHoy('2026-08-03T10:00:00')
        const ultimaClase = new Date('2026-06-26T12:00:00').getTime()

        const info = getSemesterEndInfo(
            { schedule_config: { fecha_inicio: new Date('2026-03-09T12:00:00').getTime(), semanas_semestre: 16 } },
            ultimaClase
        )

        expect(info.fuente).toBe('ultima_clase')
        expect(info.fechaFin).toBe(ultimaClase)
        expect(info.terminado).toBe(true)
    })

    it('calcula el término desde inicio + semanas cuando no hay calendario', () => {
        congelarHoy('2026-08-03T10:00:00')
        const inicio = new Date('2026-03-09T12:00:00').getTime()

        const info = getSemesterEndInfo({ schedule_config: { fecha_inicio: inicio, semanas_semestre: 16 } }, null)

        expect(info.fuente).toBe('calculada')
        expect(info.fechaFin).toBe(inicio + 16 * 7 * DIA)
        expect(info.terminado).toBe(true)
    })

    it('mantiene el semestre abierto durante todo el día de la última clase', () => {
        // Mismo día de la última clase, pero más tarde: aún NO debe darse por terminado.
        congelarHoy('2026-06-26T23:00:00')
        const ultimaClase = new Date('2026-06-26T12:00:00').getTime()

        const info = getSemesterEndInfo({ schedule_config: {} }, ultimaClase)

        expect(info.terminado).toBe(false)
    })

    it('marca terminado a partir del día siguiente', () => {
        congelarHoy('2026-06-27T00:30:00')
        const ultimaClase = new Date('2026-06-26T12:00:00').getTime()

        expect(getSemesterEndInfo({ schedule_config: {} }, ultimaClase).terminado).toBe(true)
    })

    it('no marca terminado un semestre todavía en curso y reporta los días restantes', () => {
        congelarHoy('2026-04-01T10:00:00')
        const ultimaClase = new Date('2026-06-26T12:00:00').getTime()

        const info = getSemesterEndInfo({ schedule_config: {} }, ultimaClase)

        expect(info.terminado).toBe(false)
        expect(info.diasRestantes).toBeGreaterThan(80)
    })

    it('no entrega fecha de término si el ramo no tiene programación', () => {
        congelarHoy('2026-08-03T10:00:00')

        const info = getSemesterEndInfo({ schedule_config: null }, null)

        expect(info.fechaFin).toBeNull()
        expect(info.fuente).toBeNull()
        // Sin fecha no se puede cerrar: el botón debe quedar bloqueado.
        expect(info.terminado).toBe(false)
    })

    it('tolera un schedule_config incompleto (solo fecha de inicio)', () => {
        congelarHoy('2026-08-03T10:00:00')

        const info = getSemesterEndInfo({ schedule_config: { fecha_inicio: Date.now() } }, null)

        expect(info.fechaFin).toBeNull()
        expect(info.terminado).toBe(false)
    })
})
