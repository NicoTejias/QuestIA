import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { ArrowRightLeft, CheckCircle, X, User, Book, MapPin, Loader2, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

export default function TraspasosPanel() {
    const transferRequests = useQuery(api.point_transfers.getPendingForTeacher);
    const processTransfer = useMutation(api.point_transfers.processTransfer);
    const [submitting, setSubmitting] = useState<string | null>(null);

    const handleProcess = async (id: any, approve: boolean) => {
        setSubmitting(id + (approve ? '-ap' : '-rj'));
        try {
            await processTransfer({ request_id: id, approve });
            toast.success(approve ? "Traspaso aprobado" : "Traspaso rechazado");
        } catch (err: any) {
            toast.error(err.message || "Error al procesar traspaso");
        } finally {
            setSubmitting(null);
        }
    };

    if (transferRequests === undefined) return (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-light border border-white/5 rounded-[2rem]">
            <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
            <p className="text-slate-400 font-medium">Cargando solicitudes de traspaso...</p>
        </div>
    );

    if (transferRequests.length === 0) return (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-light border border-white/5 rounded-[2rem]">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <ArrowRightLeft className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400 font-bold text-lg">Nada por aquí</p>
            <p className="text-slate-500 text-sm">No tienes solicitudes de traspaso pendientes que requieran tu aprobación.</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <ArrowRightLeft className="w-8 h-8 text-accent" />
                        Traspasos Pendientes
                    </h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Revisa y aprueba las solicitudes de movimiento de puntos entre tus ramos.</p>
                </div>
                <div className="px-4 py-2 bg-accent/10 border border-accent/20 rounded-xl">
                    <span className="text-accent-light font-black text-sm">{transferRequests.length} PENDIENTES</span>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {transferRequests.map((req: any) => {
                    const isSourceDoc = req.isSourceTeacher;
                    const isTargetDoc = req.isTargetTeacher;

                    return (
                        <div key={req._id} className="group bg-surface-light border border-white/5 hover:border-accent/30 rounded-3xl p-6 transition-all duration-300 shadow-lg hover:shadow-accent/5">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-black rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-accent/40 transition-colors">
                                            <User className="w-6 h-6 text-slate-400 group-hover:text-accent transition-colors" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-accent-light transition-colors">{req.student_name}</h3>
                                            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">{req.student_identifier}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className={`p-4 rounded-2xl border ${isSourceDoc ? 'bg-accent/5 border-accent/20' : 'bg-black/20 border-white/5'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                    <Book className="w-3 h-3" /> ORIGEN
                                                </span>
                                                {req.approval_source ?
                                                    <span className="text-[10px] font-bold text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> APROBADO</span> :
                                                    <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1"><Clock className="w-3 h-3" /> PENDIENTE</span>
                                                }
                                            </div>
                                            <p className="text-sm font-bold text-white truncate">{req.from_course_name}</p>
                                            {isSourceDoc && <p className="text-[9px] text-accent-light font-black mt-1 uppercase">Eres el docente de este ramo</p>}
                                        </div>

                                        <div className={`p-4 rounded-2xl border ${isTargetDoc ? 'bg-accent/5 border-accent/20' : 'bg-black/20 border-white/5'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> DESTINO
                                                </span>
                                                {req.approval_target ?
                                                    <span className="text-[10px] font-bold text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> APROBADO</span> :
                                                    <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1"><Clock className="w-3 h-3" /> PENDIENTE</span>
                                                }
                                            </div>
                                            <p className="text-sm font-bold text-white truncate">{req.to_course_name}</p>
                                            {isTargetDoc && <p className="text-[9px] text-accent-light font-black mt-1 uppercase">Eres el docente de este ramo</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center px-8 border-y lg:border-y-0 lg:border-x border-white/5 py-4 lg:py-0">
                                    <div className="bg-black/40 px-6 py-4 rounded-[2rem] border border-accent/20 flex flex-col items-center">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">MONTO</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-3xl font-black text-accent">{req.amount}</span>
                                            <span className="text-xs font-bold text-slate-400">PTS</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-slate-600 mt-3 flex items-center gap-1 italic">
                                        <AlertCircle className="w-2.5 h-2.5" /> Se requiere aprobación de ambos docentes
                                    </p>
                                </div>

                                <div className="flex flex-row lg:flex-col gap-3 min-w-[160px]">
                                    <button
                                        disabled={!!submitting}
                                        onClick={() => handleProcess(req._id, true)}
                                        className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-95 transition-all disabled:opacity-50"
                                        title="Aprobar traspaso"
                                    >
                                        {submitting === `${req._id}-ap` ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <><CheckCircle className="w-4 h-4" /> APROBAR</>}
                                    </button>
                                    <button
                                        disabled={!!submitting}
                                        onClick={() => handleProcess(req._id, false)}
                                        className="flex-1 px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                                        title="Rechazar traspaso"
                                    >
                                        {submitting === `${req._id}-rj` ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4" /> RECHAZAR</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}
