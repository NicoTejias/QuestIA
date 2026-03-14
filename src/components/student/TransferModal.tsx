import { useState } from "react"
import { usePaginatedQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { X, ArrowRightLeft, Coins, AlertCircle } from 'lucide-react'
import { toast } from "sonner"

interface TransferModalProps {
    onClose: () => void;
    courses: any[];
}

export default function TransferModal({ onClose, courses }: TransferModalProps) {
    const requestTransfer = useMutation(api.point_transfers.requestTransfer)
    const { results: transferHistory, status: historyStatus, loadMore } = usePaginatedQuery(
        api.point_transfers.getStudentTransfers,
        {},
        { initialNumItems: 5 }
    )
    const [fromCourse, setFromCourse] = useState('')
    const [toCourse, setToCourse] = useState('')
    const [amount, setAmount] = useState<number>(0)
    const [loading, setLoading] = useState(false)

    const handleRequest = async () => {
        if (!fromCourse || !toCourse || amount <= 0) {
            toast.error('Por favor completa todos los campos correctamente.')
            return
        }
        if (fromCourse === toCourse) {
            toast.error('El ramo de origen y destino no pueden ser el mismo.')
            return
        }

        setLoading(true)
        try {
            await requestTransfer({
                from_course_id: fromCourse as any,
                to_course_id: toCourse as any,
                amount
            })
            toast.success('Solicitud enviada. Los docentes deben aprobar el traspaso para que sea efectivo.')
            onClose()
        } catch (err: any) {
            toast.error('Error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-white/10 w-full max-w-xl rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-white">Transferir Puntos</h2>
                        <p className="text-slate-500 text-sm font-medium">Eleva una solicitud a tus docentes</p>
                    </div>
                    <button onClick={onClose} title="Cerrar" className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block text-left">RAMO ORIGEN (De donde salen puntos)</label>
                        <select
                            title="Ramo Origen"
                            aria-label="Ramo Origen"
                            value={fromCourse}
                            onChange={(e) => setFromCourse(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                        >
                            <option value="">Seleccionar Ramo...</option>
                            {courses.map(c => (
                                <option key={c._id} value={c._id}>{c.name} (Saldo: {c.spendable_points || c.total_points || 0} pts)</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-center -my-3 relative z-10">
                        <div className="bg-primary p-3 rounded-full shadow-lg shadow-primary/20 ring-4 ring-slate-900">
                            <ArrowRightLeft className="w-5 h-5 text-white" />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block text-left">RAMO DESTINO (A donde llegan puntos)</label>
                        <select
                            title="Ramo Destino"
                            aria-label="Ramo Destino"
                            value={toCourse}
                            onChange={(e) => setToCourse(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-accent/50 transition-all font-bold appearance-none"
                        >
                            <option value="">Seleccionar Ramo...</option>
                            {courses.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block text-left">CANTIDAD DE PUNTOS</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={amount || ''}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                placeholder="Ej: 500"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-gold/50 transition-all font-black text-xl placeholder:text-slate-700"
                            />
                            <Coins className="absolute right-4 top-1/2 -translate-y-1/2 text-gold w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-amber-500 text-[11px] font-bold leading-relaxed flex gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>Los puntos transferidos se restarán de tu saldo canjeable del ramo origen. La transferencia requiere que ambos docentes aprueben la solicitud.</p>
                    </div>

                    <button
                        onClick={handleRequest}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-primary to-accent text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        {loading ? 'ENVIANDO SOLICITUD...' : 'ENVIAR SOLICITUD DE TRASPASO'}
                    </button>

                    {/* Historial de Traspasos */}
                    {transferHistory && transferHistory.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-white/10">
                            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Historial de Solicitudes</h3>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {transferHistory.map((hist: any) => (
                                    <div key={hist._id} className="bg-black/20 rounded-xl p-3 border border-white/5 flex items-center justify-between text-xs">
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-300 font-bold truncate max-w-[120px]" title={hist.from_course_name}>{hist.from_course_name}</span>
                                                <ArrowRightLeft className="w-3 h-3 text-slate-600 shrink-0" />
                                                <span className="text-slate-300 font-bold truncate max-w-[120px]" title={hist.to_course_name}>{hist.to_course_name}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-500 mt-1 uppercase font-black tracking-widest">
                                                {new Date(hist.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                                            <span className="text-gold font-black text-sm">{hist.amount.toLocaleString()} pts</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest ${hist.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                hist.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                }`}>
                                                {hist.status === 'approved' ? 'APROBADO' : hist.status === 'rejected' ? 'RECHAZADO' : 'PENDIENTE'}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {historyStatus === "CanLoadMore" && (
                                    <button
                                        onClick={() => loadMore(5)}
                                        className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all border border-white/5 rounded-xl mt-2"
                                    >
                                        Cargar más historial
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
