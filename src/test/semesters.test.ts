import { describe, it, expect } from 'vitest'
import {
    esSemestreValido,
    parseSemestre,
    formatSemestre,
    compararSemestresDesc,
    siguienteSemestre,
    anteriorSemestre,
    semestreDeFecha,
    opcionesDeSemestre,
} from '../lib/semesters'

describe('validación y parseo', () => {
    it('acepta el formato AAAA-N', () => {
        expect(esSemestreValido('2026-1')).toBe(true)
        expect(esSemestreValido('2027-2')).toBe(true)
    })

    it('rechaza formatos inválidos', () => {
        expect(esSemestreValido('2026-3')).toBe(false)
        expect(esSemestreValido('2026')).toBe(false)
        expect(esSemestreValido('26-1')).toBe(false)
        expect(esSemestreValido(null)).toBe(false)
        expect(esSemestreValido('')).toBe(false)
    })

    it('descompone el semestre', () => {
        expect(parseSemestre('2026-2')).toEqual({ anio: 2026, periodo: 2 })
        expect(parseSemestre('basura')).toBeNull()
    })
})

describe('formato', () => {
    it('genera etiquetas legibles', () => {
        expect(formatSemestre('2026-1')).toBe('2026 · 1er semestre')
        expect(formatSemestre('2026-2')).toBe('2026 · 2do semestre')
        expect(formatSemestre(null)).toBe('Sin semestre')
    })
})

describe('navegación entre semestres', () => {
    it('avanza dentro del mismo año', () => {
        expect(siguienteSemestre('2026-1')).toBe('2026-2')
    })

    it('avanza cambiando de año', () => {
        // El caso que rompe una implementación ingenua.
        expect(siguienteSemestre('2026-2')).toBe('2027-1')
    })

    it('retrocede cruzando el año', () => {
        expect(anteriorSemestre('2026-1')).toBe('2025-2')
        expect(anteriorSemestre('2026-2')).toBe('2026-1')
    })

    it('avanzar y retroceder es simétrico', () => {
        for (const s of ['2026-1', '2026-2', '2027-1']) {
            expect(anteriorSemestre(siguienteSemestre(s))).toBe(s)
        }
    })
})

describe('semestre según la fecha', () => {
    it('marzo a julio es el primer semestre', () => {
        expect(semestreDeFecha(new Date('2026-03-09T12:00:00'))).toBe('2026-1')
        expect(semestreDeFecha(new Date('2026-07-18T12:00:00'))).toBe('2026-1')
    })

    it('agosto a diciembre es el segundo semestre', () => {
        expect(semestreDeFecha(new Date('2026-08-03T12:00:00'))).toBe('2026-2')
        expect(semestreDeFecha(new Date('2026-12-20T12:00:00'))).toBe('2026-2')
    })

    it('enero y febrero cierran el segundo semestre del año anterior', () => {
        expect(semestreDeFecha(new Date('2027-01-15T12:00:00'))).toBe('2026-2')
        expect(semestreDeFecha(new Date('2027-02-28T12:00:00'))).toBe('2026-2')
    })
})

describe('ordenamiento', () => {
    it('deja el más reciente primero', () => {
        const orden = ['2025-1', '2026-2', '2026-1', '2027-1'].sort(compararSemestresDesc)
        expect(orden).toEqual(['2027-1', '2026-2', '2026-1', '2025-1'])
    })
})

describe('opciones del selector', () => {
    it('incluye los semestres existentes sin duplicarlos', () => {
        const ops = opcionesDeSemestre(['2026-1', '2026-1', '2024-2'])
        expect(new Set(ops).size).toBe(ops.length)
        expect(ops).toContain('2026-1')
        expect(ops).toContain('2024-2')
    })

    it('descarta valores inválidos que vengan de la base', () => {
        const ops = opcionesDeSemestre(['basura', '2026-9', ''])
        expect(ops.every(o => esSemestreValido(o))).toBe(true)
    })

    it('viene ordenado del más reciente al más antiguo', () => {
        const ops = opcionesDeSemestre(['2020-1'])
        expect([...ops].sort(compararSemestresDesc)).toEqual(ops)
    })
})
