import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { ArrowRightLeft, CheckCircle, X } from 'lucide-react'
import { toast } from 'sonner'

export default function TraspasosPanel() {
    const transferRequests = useQuery(api.point_transfers.getPendingForTeacher);
    const processTransfer = useMutation(api.point_transfers.processTransfer);

    if (transferRequests === undefined) return <div className="p-8 text-center text-slate-400">Cargando solicitudes...</div>;
    if (transferRequests.length === 0) return <div className="p-8 text-center text-slate-400">No hay solicitudes de traspaso pendientes.</div>;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                <ArrowRightLeft className="w-6 h-6 text-accent" />
                Solicitudes de Traspaso Pendientes
            </h2>

            <div className="grid gap-4">
                {transferRequests.map((req: any) => (
                    <div key={req._id} className="bg-surface p-4 rounded-xl border border-white/5 flex items-center justify-between">
                        <div>
                            <div className="font-bold">{req.student_name} <span className="text-sm font-normal text-slate-400">({req.student_identifier})</span></div>
                            <div className="text-sm text-slate-400 mt-1">
                                Quiere transferir <span className="font-bold text-accent">{req.amount} puntos</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                De: <span className="text-slate-300">{req.from_course_name}</span> → A: <span className="text-slate-300">{req.to_course_name}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    processTransfer({ request_id: req._id, approve: true })
                                        .then(() => toast.success("Traspaso aprobado"))
                                        .catch((err) => toast.error(err.message));
                                }}
                                className="px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                            >
                                <CheckCircle className="w-4 h-4" /> Aprobar
                            </button>
                            <button
                                onClick={() => {
                                    processTransfer({ request_id: req._id, approve: false })
                                        .then(() => toast.success("Traspaso rechazado"))
                                        .catch((err) => toast.error(err.message));
                                }}
                                className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                            >
                                <X className="w-4 h-4" /> Rechazar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
