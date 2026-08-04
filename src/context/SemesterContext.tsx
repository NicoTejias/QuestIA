import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react'
import {
    TODOS_LOS_SEMESTRES,
    SIN_SEMESTRE,
    esSemestreValido,
    compararSemestresDesc,
    semestreDeFecha,
} from '../lib/semesters'

const CLAVE_STORAGE = 'questia_semestre_activo'

interface SemesterContextValue {
    /** Semestre seleccionado, o los valores especiales TODOS / SIN_SEMESTRE. */
    semestreActivo: string
    setSemestreActivo: (valor: string) => void
    /** Semestres presentes en los ramos del docente, del más reciente al más antiguo. */
    semestresDisponibles: string[]
    /** true si hay ramos sin semestre asignado (ramos antiguos o sueltos). */
    haySinSemestre: boolean
    /** Filtra una lista de ramos según el semestre activo. */
    filtrarPorSemestre: <T extends { semester?: string | null }>(items: T[]) => T[]
}

const SemesterContext = createContext<SemesterContextValue | null>(null)

/**
 * Contexto del periodo académico activo.
 *
 * El semestre elegido se guarda en localStorage para que el docente no tenga que
 * volver a seleccionarlo en cada sesión, pero se descarta si ese semestre ya no
 * existe entre sus ramos (por ejemplo, tras borrarlos).
 */
export function SemesterProvider({ courses, children }: { courses: any[]; children: ReactNode }) {
    const semestresDisponibles = useMemo(() => {
        const set = new Set<string>()
        for (const c of courses || []) {
            if (esSemestreValido(c?.semester)) set.add(c.semester)
        }
        return [...set].sort(compararSemestresDesc)
    }, [courses])

    const haySinSemestre = useMemo(
        () => (courses || []).some(c => !esSemestreValido(c?.semester)),
        [courses]
    )

    const [semestreActivo, setSemestreActivoRaw] = useState<string>(() => {
        try {
            return localStorage.getItem(CLAVE_STORAGE) || TODOS_LOS_SEMESTRES
        } catch {
            return TODOS_LOS_SEMESTRES
        }
    })

    // Un semestre recién abierto todavía no tiene ramos, así que no aparece en
    // `semestresDisponibles`. Se marca como elegido a propósito para que el
    // autoajuste de abajo no lo descarte y devuelva al docente al período viejo.
    const [elegidoManualmente, setElegidoManualmente] = useState(false)

    // Al cargar los ramos se decide el semestre inicial. Solo corre mientras la
    // selección guardada no sea válida para los datos actuales.
    useEffect(() => {
        if (elegidoManualmente) return
        if (semestresDisponibles.length === 0) return
        const valido =
            semestreActivo === TODOS_LOS_SEMESTRES ||
            (semestreActivo === SIN_SEMESTRE && haySinSemestre) ||
            semestresDisponibles.includes(semestreActivo)
        if (valido) return

        // Preferencia: el semestre en curso según el calendario; si el docente no
        // tiene ramos en él, el más reciente que sí tenga.
        const actual = semestreDeFecha()
        setSemestreActivoRaw(
            semestresDisponibles.includes(actual) ? actual : semestresDisponibles[0]
        )
    }, [semestresDisponibles, haySinSemestre, semestreActivo, elegidoManualmente])

    const setSemestreActivo = (valor: string) => {
        setSemestreActivoRaw(valor)
        setElegidoManualmente(true)
        try {
            localStorage.setItem(CLAVE_STORAGE, valor)
        } catch {
            // Sin localStorage (modo privado) la selección dura solo la sesión.
        }
    }

    const filtrarPorSemestre = useMemo(
        () =>
            <T extends { semester?: string | null }>(items: T[]): T[] => {
                if (semestreActivo === TODOS_LOS_SEMESTRES) return items
                if (semestreActivo === SIN_SEMESTRE) {
                    return items.filter(i => !esSemestreValido(i?.semester))
                }
                return items.filter(i => i?.semester === semestreActivo)
            },
        [semestreActivo]
    )

    const value: SemesterContextValue = {
        semestreActivo,
        setSemestreActivo,
        semestresDisponibles,
        haySinSemestre,
        filtrarPorSemestre,
    }

    return <SemesterContext.Provider value={value}>{children}</SemesterContext.Provider>
}

export function useSemester(): SemesterContextValue {
    const ctx = useContext(SemesterContext)
    if (!ctx) throw new Error('useSemester debe usarse dentro de un SemesterProvider')
    return ctx
}
