import { usePaginatedQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Bell, BellOff, Loader2, ArrowRightLeft, Target, Info } from 'lucide-react'

export default function NotificacionesPanel() {
    const { results: notifications, status, loadMore } = usePaginatedQuery(
        api.notifications.getNotifications,
        {},
        { initialNumItems: 10 }
    )
    const markAsRead = useMutation(api.notifications.markAsRead)
    const markAllAsRead = useMutation(api.notifications.markAllAsRead)

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <Bell className="w-8 h-8 text-primary" />
                        Notificaciones
                    </h2>
                    <p className="text-slate-500 font-medium">Historial de puntos, insignias y avisos del sistema.</p>
                </div>
                {notifications && notifications.length > 0 && (
                    <button
                        onClick={() => markAllAsRead()}
                        className="text-xs font-black text-primary hover:text-primary-light transition-colors uppercase tracking-widest"
                    >
                        Marcar todas como leídas
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {status === 'LoadingFirstPage' ? (
                    <div className="flex flex-col items-center py-20">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                        <p className="text-slate-500">Buscando novedades...</p>
                    </div>
                ) : notifications?.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] py-20 flex flex-col items-center text-center px-10">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                            <BellOff className="w-10 h-10 text-slate-700" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Todo en orden</h3>
                        <p className="text-slate-500 max-w-sm">No tienes notificaciones por el momento. ¡Sigue participando para ganar puntos!</p>
                    </div>
                ) : (
                    <>
                        {notifications?.map((n: any) => (
                            <div
                                key={n._id}
                                onMouseEnter={() => !n.read && markAsRead({ notification_id: n._id })}
                                className={`group p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden ${n.read ? 'bg-white/5 border-white/5 opacity-80' : 'bg-primary/5 border-primary/20 shadow-lg shadow-primary/5'}`}
                            >
                                {!n.read && <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary"></div>}
                                <div className="flex items-start gap-5">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${n.type === 'transfer_request' ? 'bg-amber-500/20 text-amber-500' :
                                        n.type === 'mission_complete' ? 'bg-green-500/20 text-green-500' :
                                            'bg-primary/20 text-primary-light'
                                        }`}>
                                        {n.type === 'transfer_request' ? <ArrowRightLeft className="w-6 h-6" /> :
                                            n.type === 'mission_complete' ? <Target className="w-6 h-6" /> :
                                                <Info className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1 gap-4">
                                            <h4 className="font-bold text-white truncate">{n.title}</h4>
                                            <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                                                {new Date(n.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 leading-relaxed">{n.message}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {status === 'CanLoadMore' && (
                            <button
                                onClick={() => loadMore(10)}
                                className="w-full py-4 border border-white/5 rounded-2xl text-slate-500 font-bold hover:bg-white/5 transition-all outline-none"
                            >
                                Cargar más notificaciones
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
