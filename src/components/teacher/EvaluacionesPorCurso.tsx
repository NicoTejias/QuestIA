import { Calendar, Clock, FileText, PenSquare, Trash2, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from "sonner"
import ConfirmModal from '../ConfirmModal'
import { useState } from "react"
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { EvaluationsAPI, supabase } from '../../lib/api'

interface EvaluacionesPorCursoProps {
    courseId: string
}

export default function EvaluacionesPorCurso({ courseId }: EvaluacionesPorCursoProps) {
    const [now] = useState(() => Date.now())
    const { data: evaluaciones, isLoading, refetch } = useSupabaseQuery(
        () => EvaluationsAPI.getEvaluationsByCourse(courseId),
        [courseId]
    )
    const [deleteTarget, setDeleteTarget] = useState<any>(null)

    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            const { error } = await supabase.from('evaluaciones').delete().eq('id', deleteTarget.id)
            if (error) throw error
            toast.success("Evaluación eliminada")
            setDeleteTarget(null)
            refetch()
        } catch (err: any) {
            toast.error(err.message || "Error al eliminar")
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
        )
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('es-CL', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        })
    }

    const evals = evaluaciones || []
    const pruebas = evals.filter((e: any) => e.tipo === 'prueba')
    const trabajos = evals.filter((e: any) => e.tipo === 'trabajo' || e.tipo === 'informe')

    if (evals.length === 0) {
        return (
            <div className="text-center py-10">
                <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No hay evaluaciones programadas</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Pruebas ({pruebas.length})
                </h4>
                <div className="space-y-2">
                    {pruebas.map((ev: any) => (
                        <EvaluacionItem key={ev.id} evaluacion={ev} onDelete={() => setDeleteTarget(ev)} formatDate={formatDate} now={now} />
                    ))}
                </div>
            </div>

            <div>
                <h4 className="text-sm font-bold text-primary-light mb-3 flex items-center gap-2">
                    <PenSquare className="w-4 h-4" />
                    Trabajos / Informes ({trabajos.length})
                </h4>
                <div className="space-y-2">
                    {trabajos.map((ev: any) => (
                        <EvaluacionItem key={ev.id} evaluacion={ev} onDelete={() => setDeleteTarget(ev)} formatDate={formatDate} now={now} />
                    ))}
                </div>
            </div>

            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                loading={false}
                title="Eliminar Evaluación"
                message={`¿Eliminar "${deleteTarget?.titulo}"?`}
                confirmText="Eliminar"
                variant="danger"
            />
        </div>
    )
}

function EvaluacionItem({ evaluacion, onDelete, formatDate, now }: { evaluacion: any, onDelete: () => void, formatDate: (ts: number) => string, now: number }) {
    const isPast = evaluacion.fecha < now
    
    return (
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isPast ? 'bg-slate-800/30 border-slate-700/30' : 'bg-white/5 border-white/5 hover:border-white/20'
        }`}>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold uppercase ${
                        isPast ? 'text-slate-500' : 'text-red-400'
                    }`}>
                        {formatDate(evaluacion.fecha)}
                    </span>
                    {evaluacion.hora && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {evaluacion.hora}
                        </span>
                    )}
                    {isPast && <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
                <h5 className={`text-sm font-bold ${isPast ? 'text-slate-500' : 'text-white'}`}>
                    {evaluacion.titulo}
                </h5>
                {evaluacion.descripcion && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{evaluacion.descripcion}</p>
                )}
            </div>
            <div className="flex items-center gap-2">
                {evaluacion.puntos && (
                    <span className="text-xs bg-accent/20 text-accent-light px-2 py-1 rounded">
                        {evaluacion.puntos} pts
                    </span>
                )}
                <button
                    onClick={onDelete}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}