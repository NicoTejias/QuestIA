import { useState } from 'react'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { 
    Users, 
    MessageSquare, 
    ShieldAlert, 
    Loader2, 
    CheckCircle, 
    AlertCircle, 
    Lightbulb, 
    Heart,
    ExternalLink,
    Search,
    UserCircle
} from 'lucide-react'
import { toast } from 'sonner'

export default function AdminPanel() {
    const stats = useQuery(api.admin.getGlobalStats)
    const feedbacks = useQuery(api.admin.listAllFeedback)
    const [search, setSearch] = useState('')

    if (!stats || !feedbacks) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando datos maestros...</p>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Usuarios Totales" value={stats.totalUsers} icon={<Users className="w-5 h-5" />} color="primary" />
                <StatCard label="Alumnos" value={stats.students} icon={<UserCircle className="w-5 h-5" />} color="blue" />
                <StatCard label="Docentes" value={stats.teachers} icon={<ShieldAlert className="w-5 h-5" />} color="gold" />
                <StatCard label="Feedbacks" value={stats.totalFeedback} icon={<MessageSquare className="w-5 h-5" />} color="accent" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* FEEDBACK LIST */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <MessageSquare className="w-6 h-6 text-accent" />
                            Reportes y Sugerencias
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Buscar en feedback..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-accent/40 transition-all w-64"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        {feedbacks
                            .filter(f => f.content.toLowerCase().includes(search.toLowerCase()) || f.userName.toLowerCase().includes(search.toLowerCase()))
                            .map((f: any) => (
                            <div key={f._id} className="bg-surface-light border border-white/5 rounded-3xl p-6 hover:bg-white/10 transition-all relative group">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            f.type === 'bug' ? 'bg-red-500/10 text-red-400' :
                                            f.type === 'suggestion' ? 'bg-blue-500/10 text-blue-400' :
                                            'bg-green-500/10 text-green-400'
                                        }`}>
                                            {f.type === 'bug' ? <AlertCircle className="w-5 h-5" /> :
                                             f.type === 'suggestion' ? <Lightbulb className="w-5 h-5" /> :
                                             <Heart className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">{f.userName}</p>
                                            <p className="text-slate-500 text-xs">{f.userEmail}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-600 bg-white/5 px-2 py-1 rounded uppercase tracking-[0.2em]">
                                        {new Date(f.created_at).toLocaleString()}
                                    </span>
                                </div>

                                <p className="text-slate-300 text-sm leading-relaxed mb-4 bg-black/20 p-4 rounded-xl border border-white/5">
                                    {f.content}
                                </p>

                                {f.page_url && (
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono italic">
                                        <ExternalLink className="w-3 h-3" />
                                        URL: <span className="truncate max-w-[400px] text-accent/60">{f.page_url}</span>
                                    </div>
                                )}
                            </div>
                        ))}

                        {feedbacks.length === 0 && (
                            <div className="text-center py-20 opacity-20">
                                <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                                <p className="font-bold">No hay feedback que revisar aún.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* USER LIST SNIPPET */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <Users className="w-6 h-6 text-primary" />
                        Usuarios Recientes
                    </h3>
                    <RecentUsersList />
                </div>
            </div>
        </div>
    )
}

function StatCard({ label, value, icon, color }: { label: string, value: any, icon: any, color: string }) {
    const colors: any = {
        primary: 'text-primary bg-primary/10 border-primary/20',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        gold: 'text-gold bg-gold/10 border-gold/20',
        accent: 'text-accent bg-accent/10 border-accent/20',
    }
    return (
        <div className="bg-surface-light border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</span>
                <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
            </div>
            <p className="text-3xl font-black text-white">{value.toLocaleString()}</p>
        </div>
    )
}

function RecentUsersList() {
    const users = useQuery(api.admin.listAllUsers, { limit: 10 })
    const updateUserRole = useMutation(api.admin.updateUserRole)
    const [adminUpdating, setAdminUpdating] = useState<string | null>(null)

    const handleRoleUpdate = async (userId: string, currentRole: string) => {
        const roles = ['student', 'teacher', 'admin']
        const nextRole = roles[(roles.indexOf(currentRole) + 1) % roles.length]
        
        if (!confirm(`¿Cambiar rol de ${currentRole} a ${nextRole}?`)) return

        setAdminUpdating(userId)
        try {
            await updateUserRole({ targetUserId: userId as any, newRole: nextRole })
            toast.success("Rol actualizado correctamente")
        } catch (err: any) {
            toast.error("Error al actualizar rol: " + err.message)
        } finally {
            setAdminUpdating(null)
        }
    }

    if (!users) return <Loader2 className="w-6 h-6 animate-spin text-slate-600 mx-auto" />

    return (
        <div className="bg-surface-light border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
            {users.map((u: any) => (
                <div key={u._id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-3 truncate">
                        <div className="w-8 h-8 bg-black/20 rounded-lg flex items-center justify-center text-sm font-bold border border-white/5">
                            {u.name?.[0] || 'U'}
                        </div>
                        <div className="truncate">
                            <p className="text-white text-xs font-bold truncate">{u.name || 'Sin nombre'}</p>
                            <p className="text-slate-500 text-[10px] truncate">{u.email}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleRoleUpdate(u._id, u.role || 'student')}
                        disabled={adminUpdating === u._id}
                        className={`text-[9px] font-black uppercase px-2 py-1 rounded border transition-all ${
                            u.role === 'admin' ? 'text-red-400 border-red-500/20 bg-red-400/5' :
                            u.role === 'teacher' ? 'text-gold border-gold/20 bg-gold/5' :
                            'text-slate-400 border-white/10 bg-white/5'
                        }`}
                    >
                        {adminUpdating === u._id ? <Loader2 className="w-3 h-3 animate-spin" /> : (u.role || 'student')}
                    </button>
                </div>
            ))}
        </div>
    )
}
