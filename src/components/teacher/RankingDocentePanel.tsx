import { useState, useRef } from 'react'
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Trophy } from 'lucide-react'
import Papa from 'papaparse'
import { extractTextFromFile, getFileType, getFileIcon, formatFileSize } from '../utils/documentParser'
import { formatRutWithDV, cleanRut, calculateRutDV } from '../utils/rutUtils'
import { toast } from 'sonner'

export default function RankingDocentePanel() {
    const courses = useQuery(api.courses.getMyCourses)
    const [selectedCourse, setSelectedCourse] = useState('')
    const students = useQuery(
        api.courses.getCourseStudents,
        selectedCourse ? { course_id: selectedCourse as any } : "skip"
    )

    const sorted = [...(students || [])].sort((a, b) => b.total_points - a.total_points)
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
                >
                    <option value="">Selecciona un ramo</option>
                    {(courses || []).map((c: any) => (
                        <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                    ))}
                </select>
            </div>

            {selectedCourse && sorted.length > 0 ? (
                <div className="bg-surface-light border border-white/5 rounded-2xl overflow-hidden">
                    <div className="flex items-center px-6 py-3 bg-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <span className="w-12 text-center">#</span>
                        <span className="flex-1">Alumno</span>
                        <span className="w-28 text-center">Belbin</span>
                        <span className="w-24 text-right">Puntos</span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {sorted.map((s, i) => (
                            <div key={s._id} className={`flex items-center px-6 py-4 hover:bg-white/5 transition-colors ${i < 3 ? 'bg-white/[0.02]' : ''}`}>
                                <span className="w-12 text-center text-lg">{medals[i] || <span className="text-slate-500 text-sm">{i + 1}</span>}</span>
                                <div className="flex-1">
                                    <p className="text-white font-medium">{s.name}</p>
                                    <p className="text-slate-500 text-xs">{s.student_id || s.email}</p>
                                </div>
                                <span className="w-28 text-center text-primary-light text-xs font-semibold">{s.belbin}</span>
                                <span className="w-24 text-right text-accent-light font-bold">{s.total_points.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : selectedCourse ? (
                <div className="bg-surface-light border border-dashed border-white/10 rounded-2xl p-10 text-center">
                    <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h4 className="text-white font-semibold mb-2">Sin alumnos inscritos</h4>
                    <p className="text-slate-400 text-sm">Carga una whitelist con los RUTs de tus alumnos para que se inscriban automáticamente.</p>
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
