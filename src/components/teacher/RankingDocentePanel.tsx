import { useState } from 'react'
import { useQuery, usePaginatedQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Trophy } from 'lucide-react'

export default function RankingDocentePanel() {
    const courses = useQuery(api.courses.getMyCourses)
    const [selectedCourse, setSelectedCourse] = useState('')

    // Usar paginación para obtener los alumnos del curso
    const { results: students, status } = usePaginatedQuery(
        api.courses.getCourseStudents,
        selectedCourse ? { course_id: selectedCourse as any } : "skip",
        { initialNumItems: 50 }
    )

    // Ordenar por puntos (aunque la query suele venir paginada por whitelist, para el ranking queremos el top real)
    // Nota: Si el curso tiene >50 alumnos, este ranking solo mostrará los 50 cargados.
    const sorted = [...(students || [])].sort((a: any, b: any) => (b.total_points || 0) - (a.total_points || 0))
    const medals = ['🥇', '🥈', '🥉']

    return (
        <div>
            <p className="text-slate-400 mb-6">Ranking de alumnos por ramo en tiempo real.</p>

            <div className="mb-6">
                <label className="text-sm font-medium text-slate-300 mb-2 block">Ramo</label>
                <select
                    value={selectedCourse}
                    onChange={e => setSelectedCourse(e.target.value)}
                    className="w-full max-w-md bg-surface-light border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                    aria-label="Selecciona un ramo para ver el ranking"
                    title="Seleccionar ramo"
                >
                    <option value="">Selecciona un ramo</option>
                    {(courses || []).map((c: any) => (
                        <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                    ))}
                </select>
            </div>

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
                        <span className="w-28 text-center">Belbin</span>
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
                                <span className="w-28 text-center text-primary-light text-xs font-semibold">{s.belbin}</span>
                                <span className="w-24 text-right text-accent-light font-bold">{(s.total_points || 0).toLocaleString()}</span>
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
