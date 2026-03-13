import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { BarChart3, Loader2, Sparkles } from 'lucide-react'

export default function AnaliticasPanel() {
    const stats = useQuery(api.analytics.getTeacherStats)

    if (!stats) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
        )
    }

    const belbinColors: Record<string, string> = {
        'Cerebro': 'bg-blue-500', 'Monitor': 'bg-blue-400',
        'Coordinador': 'bg-green-500', 'Investigador': 'bg-green-400', 'Cohesionador': 'bg-emerald-400',
        'Impulsor': 'bg-orange-500', 'Implementador': 'bg-orange-400', 'Finalizador': 'bg-amber-400',
    }

    const maxBelbin = Math.max(...(Object.values(stats.belbinDistribution) as number[]), 1)

    return (
        <div>
            <p className="text-slate-400 mb-6">Métricas de rendimiento y participación de tus alumnos.</p>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Alumnos Inscritos', value: stats.totalStudents, color: 'text-accent-light', icon: '👥', detail: `${stats.totalUniqueStudents} alumnos únicos` },
                    { label: 'Misiones Completadas', value: stats.totalMissionsCompleted, color: 'text-primary-light', icon: '🎯', detail: `${stats.totalMissionsCreated} creadas` },
                    { label: 'Rendimiento Promedio', value: `${Math.round(stats.avgQuizScore)}%`, color: 'text-gold', icon: '📈', detail: 'En quizzes IA' },
                    { label: 'Material de Apoyo', value: stats.totalDocuments, color: 'text-emerald-400', icon: '📄', detail: 'Docs subidos' },
                ].map((s, i) => (
                    <div key={i} className="bg-surface-light border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{s.label}</p>
                            <span className="text-2xl">{s.icon}</span>
                        </div>
                        <p className={`text-3xl font-black ${s.color} mb-1`}>{s.value}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{s.detail}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-surface-light border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Misiones por Alumno</p>
                        <p className="text-2xl font-black text-primary-light">{(stats.avgMissionsPerStudent || 0).toFixed(1)}</p>
                    </div>
                    <div className="text-3xl">📊</div>
                </div>
                <div className="bg-surface-light border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Canjes Realizados</p>
                        <p className="text-2xl font-black text-gold">{stats.totalRedemptions}</p>
                    </div>
                    <div className="text-3xl">🎁</div>
                </div>
                <div className="bg-surface-light border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Puntos Otorgados</p>
                        <p className="text-2xl font-black text-accent-light">{stats.totalPoints.toLocaleString()}</p>
                    </div>
                    <div className="text-3xl">⭐</div>
                </div>
            </div>



            {/* Distribución Belbin */}
            {Object.keys(stats.belbinDistribution).length > 0 && (
                <div className="bg-surface-light border border-white/5 rounded-2xl p-6 mb-8">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-accent-light" />
                        Distribución Belbin
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(stats.belbinDistribution)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .map(([role, count]) => (
                                <div key={role} className="flex items-center gap-3">
                                    <span className="text-slate-300 text-sm w-28 truncate">{role}</span>
                                    <div className="flex-1 bg-surface rounded-full h-5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${belbinColors[role] || 'bg-slate-500'} transition-all duration-500`}
                                            style={{ width: `${((count as number) / maxBelbin) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-white font-bold text-sm w-8 text-right">{count as number}</span>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Tabla de ramos */}
            {stats.courseStats.length > 0 && (
                <div className="bg-surface-light border border-white/5 rounded-2xl overflow-hidden">
                    <h3 className="text-white font-bold p-6 pb-3 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-accent-light" />
                        Detalle por Ramo
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="text-left px-6 py-3">Ramo</th>
                                    <th className="text-center px-3 py-3">Alumnos</th>
                                    <th className="text-center px-3 py-3">Misiones</th>
                                    <th className="text-center px-3 py-3">Entregas</th>
                                    <th className="text-center px-3 py-3">Documentos</th>
                                    <th className="text-right px-6 py-3">Puntos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {stats.courseStats.map((cs: any, i: number) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-white font-medium">{cs.name}</p>
                                            <p className="text-slate-500 text-xs">{cs.code}</p>
                                        </td>
                                        <td className="text-center text-slate-300 px-3">{cs.students}</td>
                                        <td className="text-center text-slate-300 px-3">{cs.missions}</td>
                                        <td className="text-center text-slate-300 px-3">{cs.submissions}</td>
                                        <td className="text-center text-slate-300 px-3">{cs.documents}</td>
                                        <td className="text-right text-accent-light font-bold px-6">{cs.totalPoints.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {stats.totalCourses === 0 && (
                <div className="bg-surface-light border border-dashed border-white/10 rounded-2xl p-10 text-center">
                    <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h4 className="text-white font-semibold mb-2">Sin datos aún</h4>
                    <p className="text-slate-400 text-sm">Crea ramos y agrega alumnos para ver las analíticas.</p>
                </div>
            )}
        </div>
    )
}
