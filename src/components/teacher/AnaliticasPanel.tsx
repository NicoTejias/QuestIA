import { useQuery, useConvex, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { BarChart3, Loader2, Sparkles, Download, Trash2, FileText, TrendingUp, Users, Calendar, Award, BookOpen, Target } from 'lucide-react'
import { useState } from "react"
import { exportToExcel } from "../../utils/ExportData"
import { toast } from "sonner"

export default function AnaliticasPanel() {
    const stats = useQuery(api.analytics.getTeacherStats)
    const convex = useConvex()
    const [exporting, setExporting] = useState<string | null>(null)
    const [unifying, setUnifying] = useState(false)
    const unifyUsers = useMutation(api.admin_fix.unifyUsersByRut)

    if (!stats) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
        )
    }

    const handleExport = async (courseName: string) => {
        setExporting(courseName)
        try {
            const data = await convex.query(api.analytics.exportCourseData, { courseName })
            if (!data || data.length === 0) {
                toast.error("No hay alumnos inscritos en este ramo para exportar.")
                return
            }
            
            // Re-mapear para que las columnas sean bonitas
            const exportData = data.map((d: any) => ({
                'Nombre Alumno': d.name,
                'RUT / ID': d.id,
                'Email': d.email,
                'Rol Belbin': d.belbin,
                'Puntos Ranking': d.points,
                'Puntos Canjeables': d.spendable
            }))

            exportToExcel(exportData, `Reporte_${courseName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`)
            toast.success("Excel generado correctamente")
        } catch (err: any) {
            toast.error("Error al exportar: " + err.message)
        } finally {
            setExporting(null)
        }
    }

    const handleUnify = async () => {
        if (!confirm("Esto buscará alumnos duplicados por RUT y unificará sus puntos. ¿Continuar?")) return
        setUnifying(true)
        try {
            const res = await unifyUsers()
            toast.success(`Se han unificado ${res.unifiedCount} registros.`)
        } catch (err: any) {
            toast.error("Error al unificar: " + err.message)
        } finally {
            setUnifying(false)
        }
    }

    const belbinColors: Record<string, string> = {
        'Cerebro': 'bg-blue-500', 'Monitor': 'bg-blue-400',
        'Coordinador': 'bg-green-500', 'Investigador': 'bg-green-400', 'Cohesionador': 'bg-emerald-400',
        'Impulsor': 'bg-orange-500', 'Implementador': 'bg-orange-400', 'Finalizador': 'bg-amber-400',
    }

    const maxBelbin = Math.max(...(Object.values(stats.belbinDistribution) as number[]), 1)

    const [cleaning, setCleaning] = useState(false)
    const cleanAllWhitelists = useMutation(api.courses.cleanAllMyWhitelists)

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h2 className="text-2xl font-black text-white">Analíticas del Docente</h2>
                    <p className="text-slate-400">Métricas de rendimiento y participación de tus alumnos.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button 
                         onClick={async () => {
                            if (!confirm("Esto eliminará duplicados y normalizará los RUTs en TODAS tus listas de alumnos. ¿Continuar?")) return
                            setCleaning(true)
                            try {
                                const res = await cleanAllWhitelists()
                                toast.success(`Limpieza lista: ${res.totalDeleted} duplicados eliminados en ${res.coursesCount} ramos.`)
                            } catch (err: any) {
                                toast.error("Error al limpiar: " + err.message)
                            } finally {
                                setCleaning(false)
                            }
                        }}
                        disabled={cleaning}
                        className="flex items-center gap-2 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent-light border border-accent/20 rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
                        title="Limpiar duplicados de RUT en todas las whitelists"
                    >
                        {cleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Limpiar Whitelists
                    </button>
                    <button 
                        onClick={handleUnify}
                        disabled={unifying}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary-light border border-primary/20 rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
                        title="Unificar alumnos duplicados por RUT que ya están registrados"
                    >
                        {unifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Unificar Usuarios
                    </button>
                    <button 
                        onClick={() => handleExport('TODOS')}
                        disabled={exporting === 'TODOS'}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
                    >
                        {exporting === 'TODOS' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Exportar Ranking Global
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Registros Totales', value: stats.totalStudents, color: 'text-accent-light', icon: '👥', detail: `${stats.totalUniqueStudents} alumnos reales (RUT únicos)` },
                    { label: 'Misiones Completadas', value: stats.totalMissionsCompleted, color: 'text-primary-light', icon: '🎯', detail: `${stats.totalMissionsCreated} creadas` },
                    { label: 'Rendimiento Promedio', value: `${Math.round(stats.avgQuizScore)}%`, color: 'text-gold', icon: '📈', detail: 'En quizzes IA' },
                    { label: 'Material de Apoyo', value: stats.totalDocuments, color: 'text-emerald-400', icon: '📄', detail: `${stats.totalMasterDocs} Docs Maestros` },
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Distribución Belbin */}
                {Object.keys(stats.belbinDistribution).length > 0 && (
                    <div className="bg-surface-light border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Sparkles className="w-5 h-5 text-accent-light" />
                            Distribución Belbin
                        </h3>
                        <div className="space-y-3">
                            {Object.entries(stats.belbinDistribution)
                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                .map(([role, count]) => (
                                    <div key={role} className="flex items-center gap-3">
                                        <span className="text-slate-300 text-xs w-28 truncate">{role}</span>
                                        <div className="flex-1 bg-surface rounded-full h-3 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${belbinColors[role] || 'bg-slate-500'} transition-all duration-500`}
                                                style={{ width: `${((count as number) / maxBelbin) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-white font-bold text-xs w-8 text-right">{count as number}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Tendencia de participación */}
                {stats.dailyActivity && stats.dailyActivity.length > 0 && (
                    <div className="bg-surface-light border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <BarChart3 className="w-5 h-5 text-primary-light" />
                            Tendencia (7 días)
                        </h3>
                        <div className="flex items-end justify-between gap-1 h-32 pt-2">
                            {stats.dailyActivity.map((day: any, i: number) => {
                                const maxCount = Math.max(...stats.dailyActivity.map((d: any) => d.count), 1);
                                const height = (day.count / maxCount) * 100;
                                const date = new Date(day.day);
                                const dayLabel = date.toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', '');

                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                        <div className="w-full relative flex flex-col justify-end h-full">
                                            <div 
                                                className="w-full bg-primary/20 group-hover:bg-primary/40 rounded-t-md transition-all duration-500 relative"
                                                style={{ height: `${height}%` }}
                                            >
                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 z-10">
                                                    {day.count}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[8px] font-bold text-slate-500 uppercase">{dayLabel}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Global Top Students */}
            {stats.topStudents && stats.topStudents.length > 0 && (
                <div>
                    <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3 uppercase tracking-wider">
                        <span className="p-1.5 bg-gold/10 rounded-lg">🏆</span>
                        Top 10 Alumnos Globales
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {stats.topStudents.map((s: any, i: number) => (
                            <div key={i} className="bg-surface-light border border-white/5 rounded-xl p-4 flex flex-col items-center text-center hover:border-gold/30 hover:bg-gold/5 transition-all group relative">
                                <div className={`absolute top-2 left-2 w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px]
                                    ${i === 0 ? 'bg-gold text-surface' : 
                                      i === 1 ? 'bg-slate-300 text-surface' : 
                                      i === 2 ? 'bg-orange-600 text-surface' : 'bg-white/5 text-slate-500'}`}>
                                    {i + 1}
                                </div>
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-xl mb-3 font-black text-white group-hover:bg-gold/20 transition-colors">
                                    {s.name[0]}
                                </div>
                                <p className="text-white text-xs font-bold truncate w-full px-1">{s.name}</p>
                                <p className="text-[9px] font-black text-gold mt-1">{s.totalPoints.toLocaleString()} PTS</p>
                                <p className="text-[8px] font-medium text-slate-500 uppercase tracking-tighter mt-1">{s.belbin}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabla de ramos */}
            {stats.courseStats.length > 0 && (
                <div className="bg-surface-light border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                    <h3 className="text-white font-bold p-6 pb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <BarChart3 className="w-5 h-5 text-accent-light" />
                        Desempeño por Ramo
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-white/5 text-slate-400 uppercase tracking-widest text-[10px]">
                                    <th className="text-left px-6 py-4">Ramo</th>
                                    <th className="text-center px-3 py-4">Alumnos</th>
                                    <th className="text-center px-3 py-4">Misiones</th>
                                    <th className="text-center px-3 py-4">Entregas</th>
                                    <th className="text-center px-3 py-4">Docs</th>
                                    <th className="text-center px-3 py-4">Puntos</th>
                                    <th className="text-right px-6 py-4">Reporte</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {stats.courseStats.map((cs: any, i: number) => (
                                    <tr key={i} className="hover:bg-white/5 transition-all">
                                        <td className="px-6 py-4">
                                            <p className="text-white font-bold">{cs.name}</p>
                                            <p className="text-slate-500 text-[10px] font-mono">{cs.code}</p>
                                        </td>
                                        <td className="text-center text-slate-300 px-3 font-medium">{cs.students}</td>
                                        <td className="text-center text-slate-300 px-3 font-medium">{cs.missions}</td>
                                        <td className="text-center text-slate-300 px-3 font-medium">{cs.submissions}</td>
                                        <td className="text-center text-slate-300 px-3 font-medium">{cs.documents}</td>
                                        <td className="text-center text-accent-light font-black px-3">{cs.totalPoints.toLocaleString()}</td>
                                        <td className="text-right px-6 py-4">
                                            <button 
                                                onClick={() => handleExport(cs.name)}
                                                disabled={exporting === cs.name}
                                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all border border-transparent hover:border-white/10"
                                                title="Descargar Excel de este ramo"
                                            >
                                                {exporting === cs.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                            </button>
                                        </td>
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
