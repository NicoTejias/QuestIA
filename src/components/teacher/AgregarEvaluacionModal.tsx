import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Plus, Calendar, Clock, FileText, PenSquare, X } from 'lucide-react'
import { toast } from "sonner"

interface AgregarEvaluacionModalProps {
    courseId: string
    courseName: string
    onClose: () => void
}

export default function AgregarEvaluacionModal({ courseId, courseName, onClose }: AgregarEvaluacionModalProps) {
    const createEvaluacion = useMutation(api.evaluaciones.createEvaluacion)

    const [titulo, setTitulo] = useState("")
    const [tipo, setTipo] = useState<"prueba" | "trabajo" | "informe">("prueba")
    const [descripcion, setDescripcion] = useState("")
    const [fecha, setFecha] = useState("")
    const [hora, setHora] = useState("")
    const [puntos, setPuntos] = useState("")
    const [section, setSection] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!titulo.trim()) {
            toast.error("El título es requerido")
            return
        }
        if (!fecha) {
            toast.error("La fecha es requerida")
            return
        }

        setLoading(true)
        try {
            const fechaTimestamp = new Date(fecha).getTime()
            
            await createEvaluacion({
                course_id: courseId as any,
                titulo: titulo.trim(),
                tipo,
                descripcion: descripcion.trim() || undefined,
                fecha: fechaTimestamp,
                hora: hora || undefined,
                puntos: puntos ? parseInt(puntos) : undefined,
                section: section || undefined,
            })

            toast.success("Evaluación agregada correctamente")
            onClose()
        } catch (err: any) {
            toast.error(err.message || "Error al crear evaluación")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-surface border border-white/10 rounded-[2rem] max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-primary-light" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Nueva Evaluación</h2>
                            <p className="text-xs text-slate-400">{courseName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Tipo */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tipo</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: "prueba", label: "Prueba", icon: FileText, color: "red" },
                                { value: "trabajo", label: "Trabajo", icon: PenSquare, color: "primary" },
                                { value: "informe", label: "Informe", icon: FileText, color: "cyan" },
                            ].map((t) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setTipo(t.value as any)}
                                    className={`p-3 rounded-xl border text-center transition-all ${
                                        tipo === t.value
                                            ? t.color === "red" ? 'bg-red-500/20 border-red-500 text-red-400'
                                            : t.color === "primary" ? 'bg-primary/20 border-primary text-primary-light'
                                            : 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                    }`}
                                >
                                    <t.icon className="w-4 h-4 mx-auto mb-1" />
                                    <span className="text-[10px] font-bold">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Título */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Título</label>
                        <input
                            type="text"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            placeholder="Ej: Control 1 de Álgebra"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium outline-none focus:border-primary"
                        />
                    </div>

                    {/* Fecha y Hora */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                Fecha
                            </label>
                            <input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                <Clock className="w-3 h-3 inline mr-1" />
                                Hora (opcional)
                            </label>
                            <input
                                type="time"
                                value={hora}
                                onChange={(e) => setHora(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* Puntos */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Puntos (opcional)</label>
                        <input
                            type="number"
                            value={puntos}
                            onChange={(e) => setPuntos(e.target.value)}
                            placeholder="100"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium outline-none focus:border-primary"
                        />
                    </div>

                    {/* Sección */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                            Sección (opcional)
                        </label>
                        <input
                            type="text"
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                            placeholder="Ej: Sección A, Grupo 1"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium outline-none focus:border-primary"
                        />
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Descripción (opcional)</label>
                        <textarea
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Detalles adicionales..."
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium outline-none focus:border-primary resize-none"
                        />
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-white/5 border border-white/10 text-slate-400 font-bold rounded-xl hover:bg-white/10 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Agregar
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}