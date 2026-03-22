import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { FileText, PenSquare, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react'

export default function EvaluacionesPanel() {
    const evaluaciones = useQuery(api.evaluaciones.getEvaluacionesEstudiante)

    if (!evaluaciones) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const pruebas = evaluaciones.filter(e => e.tipo === 'prueba')
    const trabajos = evaluaciones.filter(e => e.tipo === 'trabajo' || e.tipo === 'informe')

    const now = Date.now()
    const oneWeek = 7 * 24 * 60 * 60 * 1000

    const formatDate = (timestamp: number, hora?: string) => {
        const date = new Date(timestamp)
        const formatted = date.toLocaleDateString('es-CL', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
        })
        const dayName = date.toLocaleDateString('es-CL', { weekday: 'long' })
        return { short: formatted, full: dayName, hora }
    }

    const getUrgency = (timestamp: number) => {
        const diff = timestamp - now
        if (diff < 0) return 'passed'
        if (diff < oneWeek) return 'soon'
        return 'normal'
    }

    const renderItem = (evaluacion: any) => {
        const urgency = getUrgency(evaluacion.fecha)
        const dateInfo = formatDate(evaluacion.fecha, evaluacion.hora)
        const isPassed = urgency === 'passed'

        return (
            <div 
                key={evaluacion._id}
                className={`p-3 rounded-xl border transition-all ${
                    isPassed 
                        ? 'bg-slate-800/30 border-slate-700/30 opacity-50' 
                        : urgency === 'soon'
                            ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                            : 'bg-white/5 border-white/5 hover:border-white/20'
                }`}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            {isPassed ? (
                                <CheckCircle className="w-3 h-3 text-slate-500" />
                            ) : urgency === 'soon' ? (
                                <AlertCircle className="w-3 h-3 text-red-400" />
                            ) : (
                                <Calendar className="w-3 h-3 text-slate-400" />
                            )}
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                isPassed ? 'text-slate-500' : urgency === 'soon' ? 'text-red-400' : 'text-slate-400'
                            }`}>
                                {dateInfo.short.toUpperCase()}
                            </span>
                            {evaluacion.hora && (
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {evaluacion.hora}
                                </span>
                            )}
                        </div>
                        <h4 className={`text-sm font-bold truncate ${isPassed ? 'text-slate-500 line-through' : 'text-white'}`}>
                            {evaluacion.titulo}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                            {evaluacion.course_code} - {evaluacion.course_name}
                        </p>
                    </div>
                    {evaluacion.puntos && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            isPassed ? 'bg-slate-700 text-slate-500' : 'bg-accent/20 text-accent-light'
                        }`}>
                            {evaluacion.puntos} pts
                        </span>
                    )}
                </div>
                {evaluacion.descripcion && !isPassed && (
                    <p className="text-[10px] text-slate-400 mt-2 line-clamp-2">{evaluacion.descripcion}</p>
                )}
            </div>
        )
    }

    if (evaluaciones.length === 0) {
        return (
            <div className="text-center p-8">
                <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No hay evaluaciones programadas</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pruebas */}
            <div className="bg-surface-light/50 border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-red-400" />
                    </div>
                    <h3 className="text-base font-bold text-white">Pruebas</h3>
                    {pruebas.some(p => getUrgency(p.fecha) === 'soon') && (
                        <span className="ml-auto px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full animate-pulse">
                            ¡Próximas!
                        </span>
                    )}
                </div>
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {pruebas.length === 0 ? (
                        <p className="text-slate-500 text-xs text-center py-4">No hay pruebas programadas</p>
                    ) : (
                        pruebas.map(ev => renderItem(ev))
                    )}
                </div>
            </div>

            {/* Trabajos/Informes */}
            <div className="bg-surface-light/50 border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <PenSquare className="w-4 h-4 text-primary-light" />
                    </div>
                    <h3 className="text-base font-bold text-white">Trabajos / Informes</h3>
                    {trabajos.some(t => getUrgency(t.fecha) === 'soon') && (
                        <span className="ml-auto px-2 py-0.5 bg-primary/20 text-primary-light text-[10px] font-bold rounded-full animate-pulse">
                            ¡Próximos!
                        </span>
                    )}
                </div>
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {trabajos.length === 0 ? (
                        <p className="text-slate-500 text-xs text-center py-4">No hay trabajosprogramados</p>
                    ) : (
                        trabajos.map(ev => renderItem(ev))
                    )}
                </div>
            </div>
        </div>
    )
}