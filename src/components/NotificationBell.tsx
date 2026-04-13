import { useState, useRef, useEffect, useCallback } from 'react'
import { useProfile } from '../hooks/useProfile'
import { NotificationsAPI, RewardsAPI } from '../lib/api'
import { Bell, CheckCircle, Info, Trophy, AlertTriangle, ChevronDown, Gift, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function NotificationBell({ onTabChange }: { onTabChange?: (tab: string) => void }) {
    const { user } = useProfile()
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [processingId, setProcessingId] = useState<string | null>(null)

    const fetchNotifications = useCallback(async (offset = 0) => {
        if (!user?.clerk_id) return
        try {
            const data = await NotificationsAPI.getNotifications(user.clerk_id)
            if (offset === 0) {
                setNotifications(data.slice(0, 10))
                setHasMore(data.length > 10)
            } else {
                setNotifications(prev => [...prev, ...data.slice(offset, offset + 10)])
                setHasMore(data.length > offset + 10)
            }
            const unread = await NotificationsAPI.getUnreadCount(user.clerk_id)
            setUnreadCount(unread)
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }, [user?.clerk_id])

    useEffect(() => {
        if (user?.clerk_id && isOpen) {
            fetchNotifications()
        }
    }, [user?.clerk_id, isOpen, fetchNotifications])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleMarkAsRead = async (id: string) => {
        try {
            await NotificationsAPI.markAsRead(id)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (e) {
            console.error(e)
        }
    }

    const handleMarkAllAsRead = async () => {
        if (!user?.clerk_id) return
        try {
            await NotificationsAPI.markAllAsRead(user.clerk_id)
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
            toast.success('Todas las notificaciones marcadas como leídas')
        } catch (e) {
            console.error(e)
        }
    }

    const handleDeliverQuickly = async (e: React.MouseEvent, redemptionId: string, notificationId: string) => {
        e.stopPropagation()
        setProcessingId(redemptionId)
        try {
            await RewardsAPI.markRedemptionDelivered(redemptionId)
            await NotificationsAPI.markAsRead(notificationId)
            setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
            toast.success("Recompensa entregada correctamente")
        } catch (err: any) {
            toast.error(err.message || "Error al entregar")
        } finally {
            setProcessingId(null)
        }
    }

    const handleNotificationClick = (n: any) => {
        if (!n.read) handleMarkAsRead(n.id)
        
        if (n.type === 'reward_redeemed' && onTabChange) {
            onTabChange('canjes')
            setIsOpen(false)
        }
    }

    const handleLoadMore = async () => {
        setIsLoadingMore(true)
        await fetchNotifications(notifications.length)
        setIsLoadingMore(false)
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
                <div className="absolute right-0 mt-2 w-80 bg-[#0f172a] border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50">
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
                        {isLoading ? (
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
                                        key={n.id}
                                        className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${!n.read ? 'bg-accent/10' : 'bg-[#0f172a]'}`}
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
                                                
                                                {n.type === 'reward_redeemed' && n.related_id && (
                                                    <button 
                                                        onClick={(e) => handleDeliverQuickly(e, n.related_id, n.id)}
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

                                {hasMore && (
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={isLoadingMore}
                                        className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isLoadingMore ? (
                                            <span className="animate-pulse">Cargando...</span>
                                        ) : (
                                            <>
                                                <ChevronDown className="w-3 h-3" />
                                                Cargar más
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}