import { useState } from 'react'
import { useQuery, usePaginatedQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Trophy } from 'lucide-react'

export default function RankingDocentePanel() {
    const courses = useQuery(api.courses.getMyCourses)
    const [selectedCourse, setSelectedCourse] = useState('')
    const [isGlobal, setIsGlobal] = useState(false)

    // Usar paginación para obtener los alumnos del curso (Vista Local)
    const { results: localStudents, status: localStatus } = usePaginatedQuery(
        api.courses.getCourseStudents,
        (selectedCourse && !isGlobal) ? { course_id: selectedCourse as any } : "skip",
        { initialNumItems: 50 }
    )

    // Obtener ranking global (Vista de todas las secciones)
    const globalStudents = useQuery(api.courses.getGlobalRanking, 
        (selectedCourse && isGlobal) ? { course_id: selectedCourse as any } : "skip"
    )

    const students = isGlobal ? globalStudents : localStudents
    const status = isGlobal ? (globalStudents ? "Loaded" : "LoadingFirstPage") : localStatus

    // Ordenar solo para la vista local (la global ya viene ordenada)
    const sorted = isGlobal ? (students || []) : [...(students || [])].sort((a: any, b: any) => (b.total_points || 0) - (a.total_points || 0))
    const medals = ['🥇', '🥈', '🥉']

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
                <div className="flex-1 max-w-md">
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Ramo de referencia</label>
                    <select
                        value={selectedCourse}
                        onChange={e => setSelectedCourse(e.target.value)}
                        className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                        aria-label="Selecciona un ramo para ver el ranking"
                        title="Seleccionar ramo"
                    >
                        <option value="">Selecciona un ramo</option>
                        {(courses || []).map((c: any) => (
                            <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                        ))}
                    </select>
                </div>

                <div className="flex bg-surface-light border border-white/10 p-1 rounded-xl">
                    <button
                        onClick={() => setIsGlobal(false)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!isGlobal ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Mi Ramo
                    </button>
                    <button
                        onClick={() => setIsGlobal(true)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isGlobal ? 'bg-accent text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Ranking Global
                    </button>
                </div>
            </div>

            {isGlobal && (
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-6">
                    <p className="text-accent-light text-sm flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        Estás viendo el ranking de **todas las secciones** del ramo (mismo nombre).
                    </p>
                </div>
            )}

            {status === "LoadingFirstPage" ? (
                <div className="flex flex-col items-center justify-center py-10">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400 text-sm">Cargando ranking...</p>
                </div>
            ) : selectedCourse && sorted.length > 0 ? (
                <div className="bg-surface-light border border-white/5 rounded-2xl overflow-hidden">
                    <div className="flex items-center px-6 py-3 bg-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <span className="w-12 text-center">#</span>
                        <span className="flex-1">Alumno</span>
                        {isGlobal ? (
                            <>
                                <span className="w-24 text-center">Sección</span>
                                <span className="w-32 text-center">Docente</span>
                            </>
                        ) : (
                            <span className="w-28 text-center">Belbin</span>
                        )}
                        <span className="w-24 text-right">Puntos</span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {sorted.map((s: any, i: number) => (
                            <div key={s._id} className={`flex items-center px-6 py-4 hover:bg-white/5 transition-colors ${i < 3 ? 'bg-white/[0.02]' : ''}`}>
                                <span className="w-12 text-center text-lg">{medals[i] || <span className="text-slate-500 text-sm">{i + 1}</span>}</span>
                                <div className="flex-1">
                                    <p className="text-white font-medium">{s.name}</p>
                                    <p className="text-slate-500 text-xs">{s.student_id || s.email}</p>
                                </div>
                                {isGlobal ? (
                                    <>
                                        <span className="w-24 text-center text-slate-300 text-xs">{s.section}</span>
                                        <span className="w-32 text-center text-slate-400 text-xs truncate" title={s.teacherName}>{s.teacherName}</span>
                                    </>
                                ) : (
                                    <span className="w-28 text-center text-primary-light text-xs font-semibold">{s.belbin}</span>
                                )}
                                <span className="w-24 text-right text-accent-light font-bold">{(s.ranking_points || s.total_points || 0).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : selectedCourse ? (
                <div className="bg-surface-light border border-dashed border-white/10 rounded-2xl p-10 text-center">
                    <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h4 className="text-white font-semibold mb-2">Sin alumnos activos</h4>
                    <p className="text-slate-400 text-sm">Los alumnos aparecerán aquí a medida que se registren en el curso.</p>
                </div>
            ) : (
                <div className="bg-surface-light border border-dashed border-white/10 rounded-2xl p-10 text-center">
                    <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h4 className="text-white font-semibold mb-2">Selecciona un ramo</h4>
                    <p className="text-slate-400 text-sm">Elige un ramo para ver el ranking de tus alumnos.</p>
                </div>
            )}
        </div>
    )
}
