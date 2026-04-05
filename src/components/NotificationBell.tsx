import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, usePaginatedQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Bell, CheckCircle, Info, Trophy, AlertTriangle, ChevronDown, Gift, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function NotificationBell({ onTabChange }: { onTabChange?: (tab: string) => void }) {
    // Usar paginación para las notificaciones
    const { results: notifications, status, loadMore } = usePaginatedQuery(
        api.notifications.getNotifications,
        {},
        { initialNumItems: 10 }
    )

    // Nueva query dedicada para el contador real de no leídas
    const unreadCount = useQuery(api.notifications.getUnreadCount) || 0

    const markAsRead = useMutation(api.notifications.markAsRead)
    const markAllAsRead = useMutation(api.notifications.markAllAsRead)
    const markAsDelivered = useMutation(api.rewards.markRedemptionDelivered)

    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleMarkAsRead = async (id: any) => {
        try {
            await markAsRead({ notification_id: id })
        } catch (e) {
            console.error(e)
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead()
            toast.success('Todas las notificaciones marcadas como leídas')
        } catch (e) {
            console.error(e)
        }
    }

    const handleDeliverQuickly = async (e: React.MouseEvent, redemptionId: any, notificationId: any) => {
        e.stopPropagation()
        setProcessingId(redemptionId)
        try {
            await markAsDelivered({ redemption_id: redemptionId })
            await markAsRead({ notification_id: notificationId })
            toast.success("Recompensa entregada correctamente")
        } catch (err: any) {
            toast.error(err.message || "Error al entregar")
        } finally {
            setProcessingId(null)
        }
    }

    const handleNotificationClick = (n: any) => {
        if (!n.read) handleMarkAsRead(n._id)
        
        // Redirigir según el tipo
        if (n.type === 'reward_redeemed' && onTabChange) {
            onTabChange('canjes')
            setIsOpen(false)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'achievement': return <Trophy className="w-4 h-4 text-amber-400" />
            case 'reward_redeemed': return <Gift className="w-4 h-4 text-primary" />
            case 'transfer_request': return <AlertTriangle className="w-4 h-4 text-amber-500" />
            case 'system': return <Info className="w-4 h-4 text-primary" />
            default: return <Bell className="w-4 h-4 text-slate-400" />
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} nuevas)` : ''}`}
                className="relative p-2 text-slate-400 hover:text-white transition-colors focus:outline-none"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-surface-dark border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-surface-light">
                        <div className="flex items-center gap-2">
                            <h3 className="text-white font-bold text-sm">Notificaciones</h3>
                            {unreadCount > 0 && (
                                <span className="bg-accent/20 text-accent-light text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    {unreadCount} nuevas
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                            >
                                <CheckCircle className="w-3 h-3" />
                                Marcar todas
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {status === "LoadingFirstPage" ? (
                            <div className="p-8 text-center text-slate-500 text-sm">Cargando...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                                <Bell className="w-8 h-8 opacity-20" />
                                <p>No tienes notificaciones</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map(n => (
                                    <div
                                        key={n._id}
                                        className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${!n.read ? 'bg-accent/5' : ''}`}
                                        onClick={() => handleNotificationClick(n)}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-0.5 p-1.5 rounded-full h-fit flex items-center justify-center ${!n.read ? 'bg-surface border border-white/10' : 'bg-transparent'}`}>
                                                {getIcon(n.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={`text-xs truncate ${!n.read ? 'text-white font-bold' : 'text-slate-300 font-medium'}`}>
                                                        {n.title}
                                                    </h4>
                                                    {!n.read && <span className="shrink-0 w-1.5 h-1.5 bg-accent rounded-full mt-1.5 ml-2"></span>}
                                                </div>
                                                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{n.message}</p>
                                                
                                                {/* Acción rápida para canjes */}
                                                {n.type === 'reward_redeemed' && n.related_id && (
                                                    <button 
                                                        onClick={(e) => handleDeliverQuickly(e, n.related_id, n._id)}
                                                        disabled={processingId === n.related_id}
                                                        className="mt-3 w-full bg-accent/20 hover:bg-accent/30 text-accent-light text-[9px] font-black py-1.5 rounded-lg border border-accent/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                                                    >
                                                        {processingId === n.related_id ? (
                                                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="w-2.5 h-2.5" />
                                                        )}
                                                        Entregar Recompensa
                                                    </button>
                                                )}

                                                <span className="text-[9px] text-slate-500 mt-2 block font-medium">
                                                    {new Date(n.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {status === "CanLoadMore" && (
                                    <button
                                        onClick={() => loadMore(10)}
                                        className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ChevronDown className="w-3 h-3" />
                                        Cargar más
                                    </button>
                                )}
                                {status === "LoadingMore" && (
                                    <div className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center animate-pulse">
                                        Cargando más...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
