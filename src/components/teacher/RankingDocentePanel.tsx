import { useState } from 'react'
import { Trophy, ChevronDown, ChevronUp, Users } from 'lucide-react'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { CoursesAPI } from '../../lib/api'
import { useProfile } from '../../hooks/useProfile'

export default function RankingDocentePanel() {
    const { user } = useProfile()
    const { data: courses } = useSupabaseQuery(
        () => user ? CoursesAPI.getMyCourses(user.clerk_id, user.role) : Promise.resolve([]),
        [user]
    )
    const [collapsedCourses, setCollapsedCourses] = useState<Set<string>>(new Set())
    const [selectedCourseView, setSelectedCourseView] = useState<Record<string, { isGlobal: boolean }>>({})

    const toggleCourse = (courseId: string) => {
        const next = new Set(collapsedCourses)
        if (next.has(courseId)) next.delete(courseId)
        else next.add(courseId)
        setCollapsedCourses(next)
    }

    const setGlobal = (courseId: string, isGlobal: boolean) => {
        setSelectedCourseView(prev => ({ ...prev, [courseId]: { isGlobal } }))
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-gold/10 to-orange-500/5 border border-gold/20 rounded-2xl p-5">
                <p className="text-slate-400 text-sm">Cada caja muestra el ranking de un ramo. Usa el toggle para ver ranking por sección o global del ramo.</p>
            </div>

            {!courses || courses.length === 0 ? (
                <div className="bg-surface-light border border-dashed border-white/10 rounded-2xl p-10 text-center">
                    <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h4 className="text-white font-semibold mb-2">Sin ramos creados</h4>
                    <p className="text-slate-400 text-sm">Crea ramos para ver sus rankings.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {courses.map((course: any) => {
                        const isCollapsed = collapsedCourses.has(course.id)
                        const view = selectedCourseView[course.id] || { isGlobal: false }
                        return (
                            <RankingCourseBox
                                key={course.id}
                                course={course}
                                isCollapsed={isCollapsed}
                                isGlobal={view.isGlobal}
                                onToggle={() => toggleCourse(course.id)}
                                onSetGlobal={(g) => setGlobal(course.id, g)}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function RankingCourseBox({ course, isCollapsed, isGlobal, onToggle, onSetGlobal }: {
    course: any, isCollapsed: boolean, isGlobal: boolean, onToggle: () => void, onSetGlobal: (g: boolean) => void
}) {
    const { data: localStudents } = useSupabaseQuery(
        () => CoursesAPI.getCourseStudents(course.id),
        [course.id],
        { enabled: !isCollapsed && !isGlobal }
    )
    const { data: globalStudents } = useSupabaseQuery(
        () => CoursesAPI.getGlobalRanking(course.id),
        [course.id],
        { enabled: !isCollapsed && isGlobal }
    )

    const students = isGlobal ? globalStudents : localStudents
    const sorted = isGlobal
        ? ((students as any[]) || [])
        : [...((localStudents as any[]) || [])].sort((a: any, b: any) => (b.ranking_points || b.total_points || 0) - (a.ranking_points || a.total_points || 0))
    const medals = ['🥇', '🥈', '🥉']

    return (
        <div className="bg-surface-light border border-white/5 rounded-2xl overflow-hidden">
            <button onClick={onToggle} className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-gold" />
                    <div className="text-left">
                        <h3 className="text-white font-bold">{course.name}</h3>
                        <span className="text-slate-500 text-xs font-mono">{course.code}</span>
                    </div>
                    {!isCollapsed && (sorted as any[]).length > 0 && (
                        <span className="bg-gold/10 text-gold text-[10px] px-2 py-0.5 rounded-full font-black border border-gold/20 ml-2">
                            {(sorted as any[]).length} alumnos
                        </span>
                    )}
                </div>
                {isCollapsed ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                )}
            </button>

            {!isCollapsed && (
                <div className="px-5 pb-5 space-y-4">
                    <div className="flex bg-surface border border-white/10 p-1 rounded-xl w-fit">
                        <button
                            onClick={() => onSetGlobal(false)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${!isGlobal ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Mi Sección
                        </button>
                        <button
                            onClick={() => onSetGlobal(true)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${isGlobal ? 'bg-accent text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Ranking Global
                        </button>
                    </div>

                    {isGlobal && (
                        <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 text-xs text-accent-light flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            Estás viendo el ranking de <strong>todas las secciones</strong> del ramo.
                        </div>
                    )}

                    {!students ? (
                        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                    ) : (sorted as any[]).length === 0 ? (
                        <div className="text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10">
                            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm">No hay alumnos {isGlobal ? 'en este ramo' : 'en esta sección'}.</p>
                        </div>
                    ) : (
                        <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
                            <div className="flex items-center px-4 py-2 bg-white/5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                <span className="w-10 text-center">#</span>
                                <span className="flex-1">Alumno</span>
                                {isGlobal ? (
                                    <>
                                        <span className="w-20 text-center">Sección</span>
                                        <span className="w-24 text-center">Docente</span>
                                    </>
                                ) : (
                                    <span className="w-20 text-center">Belbin</span>
                                )}
                                <span className="w-20 text-right">Puntos</span>
                            </div>
                            <div className="divide-y divide-white/5">
                                {(sorted as any[]).map((s: any, i: number) => (
                                    <div key={s.id} className={`flex items-center px-4 py-3 hover:bg-white/5 transition-colors ${i < 3 ? 'bg-white/[0.02]' : ''}`}>
                                        <span className="w-10 text-center text-lg">{medals[i] || <span className="text-slate-500 text-xs">{i + 1}</span>}</span>
                                        <div className="flex-1">
                                            <p className="text-white text-sm font-medium">{s.name}</p>
                                            <p className="text-slate-500 text-[10px]">{s.student_id || s.email}</p>
                                        </div>
                                        {isGlobal ? (
                                            <>
                                                <span className="w-20 text-center text-slate-300 text-xs">{s.section}</span>
                                                <span className="w-24 text-center text-slate-400 text-xs truncate" title={s.teacherName}>{s.teacherName}</span>
                                            </>
                                        ) : (
                                            <span className="w-20 text-center text-primary-light text-xs font-semibold">{s.belbin}</span>
                                        )}
                                        <span className="w-20 text-right text-gold font-bold">{(s.ranking_points || s.total_points || 0).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

