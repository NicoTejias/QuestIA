import { useEffect, useRef, useState } from 'react'
import { CalendarRange, Check, ChevronDown, Archive, Layers } from 'lucide-react'
import { useSemester } from '../../context/SemesterContext'
import {
    TODOS_LOS_SEMESTRES,
    SIN_SEMESTRE,
    formatSemestre,
    formatSemestreCorto,
} from '../../lib/semesters'

interface Props {
    /** Ramos ya cargados, para mostrar cuántos y cuáles están cerrados por semestre. */
    courses: any[]
}

/**
 * Selector de periodo académico de la barra superior.
 * Cambia el contexto de todo el dashboard docente.
 */
export default function SemesterSwitcher({ courses }: Props) {
    const { semestreActivo, setSemestreActivo, semestresDisponibles, haySinSemestre } = useSemester()
    const [abierto, setAbierto] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // Cerrar al hacer clic fuera o con Escape.
    useEffect(() => {
        if (!abierto) return
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false)
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setAbierto(false)
        }
        document.addEventListener('mousedown', onClick)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onClick)
            document.removeEventListener('keydown', onKey)
        }
    }, [abierto])

    const conteo = (valor: string) => {
        if (valor === TODOS_LOS_SEMESTRES) return courses.length
        if (valor === SIN_SEMESTRE) return courses.filter(c => !c.semester).length
        return courses.filter(c => c.semester === valor).length
    }

    const cerradosDe = (valor: string) => {
        const list =
            valor === TODOS_LOS_SEMESTRES
                ? courses
                : valor === SIN_SEMESTRE
                    ? courses.filter(c => !c.semester)
                    : courses.filter(c => c.semester === valor)
        return list.length > 0 && list.every(c => c.closed_at)
    }

    // Si el docente todavía no tiene semestres, el selector no aporta nada.
    if (semestresDisponibles.length === 0 && !haySinSemestre) return null

    const opciones: { valor: string; etiqueta: string; icono: any }[] = [
        ...semestresDisponibles.map(s => ({
            valor: s,
            etiqueta: formatSemestre(s),
            icono: <CalendarRange className="w-3.5 h-3.5" />,
        })),
        ...(haySinSemestre
            ? [{ valor: SIN_SEMESTRE, etiqueta: 'Sin semestre', icono: <Layers className="w-3.5 h-3.5" /> }]
            : []),
        { valor: TODOS_LOS_SEMESTRES, etiqueta: 'Todos los semestres', icono: <Layers className="w-3.5 h-3.5" /> },
    ]

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setAbierto(v => !v)}
                aria-haspopup="listbox"
                aria-expanded={abierto}
                title="Cambiar de semestre"
                className="flex items-center gap-2 h-[34px] px-3 rounded-[10px] bg-white/[0.04] border border-white/[0.06] text-[#f0f0f8] hover:bg-white/10 transition-colors"
            >
                <CalendarRange className="w-4 h-4 text-iris-light shrink-0" />
                <span className="text-[12.5px] font-bold whitespace-nowrap">
                    {formatSemestreCorto(semestreActivo)}
                </span>
                {cerradosDe(semestreActivo) && (
                    <Archive className="w-3 h-3 text-iris-soft shrink-0" aria-label="Semestre cerrado" />
                )}
                <ChevronDown
                    className={`w-3.5 h-3.5 text-[#5577aa] transition-transform ${abierto ? 'rotate-180' : ''}`}
                />
            </button>

            {abierto && (
                <div
                    role="listbox"
                    className="absolute right-0 top-[calc(100%+6px)] z-50 w-[240px] bg-[#111118] border border-white/10 rounded-2xl shadow-2xl p-1.5"
                >
                    <div className="px-2.5 py-2 text-[10px] uppercase tracking-[0.08em] text-quieter font-bold">
                        Periodo académico
                    </div>

                    {opciones.map((op, i) => {
                        const activo = op.valor === semestreActivo
                        const n = conteo(op.valor)
                        const cerrado = cerradosDe(op.valor)
                        // Separador antes de "Todos", que es la última opción.
                        const separador = i === opciones.length - 1

                        return (
                            <div key={op.valor}>
                                {separador && <div className="my-1 h-px bg-white/5" />}
                                <button
                                    role="option"
                                    aria-selected={activo}
                                    onClick={() => {
                                        setSemestreActivo(op.valor)
                                        setAbierto(false)
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
                                        activo ? 'bg-iris/15 text-iris-soft' : 'text-[#c9cad4] hover:bg-white/5'
                                    }`}
                                >
                                    <span className={activo ? 'text-iris-light' : 'text-quieter'}>{op.icono}</span>
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-[13px] font-semibold truncate">{op.etiqueta}</span>
                                        <span className="block text-[10.5px] text-quieter mt-0.5">
                                            {n} {n === 1 ? 'ramo' : 'ramos'}
                                            {cerrado && ' · cerrado'}
                                        </span>
                                    </span>
                                    {activo && <Check className="w-3.5 h-3.5 shrink-0" />}
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
