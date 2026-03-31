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
    UserCircle,
    ArrowLeft,
    GraduationCap,
    School,
    Mail,
    Hash,
    Globe,
    Plus,
    Trash2,
    Save,
    Send,
    Building2,
    Edit2
} from 'lucide-react'
import { toast } from 'sonner'
import FAQManager from '../admin/FAQManager'

export default function AdminPanel() {
    const stats = useQuery(api.admin.getGlobalStats)
    const feedbacks = useQuery(api.admin.listAllFeedback)
    const [search, setSearch] = useState('')
    const [currentView, setCurrentView] = useState<'dashboard' | 'students' | 'teachers' | 'linked'>('dashboard')

    if (!stats || !feedbacks) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando datos maestros...</p>
            </div>
        )
    }

    if (currentView !== 'dashboard') {
        return <AdminDetailView view={currentView} onBack={() => setCurrentView('dashboard')} />
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Usuarios Totales" value={stats.totalUsers} icon={<Users className="w-5 h-5" />} color="primary" />
                <StatCard 
                    label="Alumnos Registrados" 
                    value={stats.students} 
                    icon={<UserCircle className="w-5 h-5" />} 
                    color="blue" 
                    onClick={() => setCurrentView('students')}
                />
                <StatCard 
                    label="Docentes Activos" 
                    value={stats.teachers} 
                    icon={<ShieldAlert className="w-5 h-5" />} 
                    color="gold" 
                    onClick={() => setCurrentView('teachers')}
                />
                <StatCard 
                    label="Vinculación Alumno-Profe" 
                    value="Ver Lista" 
                    icon={<GraduationCap className="w-5 h-5" />} 
                    color="accent" 
                    onClick={() => setCurrentView('linked')}
                />
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

            {/* Gestión de FAQ */}
            <div className="pt-10 border-t border-white/5">
                <FAQManager />
            </div>

            {/* Gestión de Dominios de Email */}
            <div className="pt-10 border-t border-white/5">
                <EmailDomainsManager />
            </div>

            {/* Gestión de Carreras e Informes Institucionales */}
            <div className="pt-10 border-t border-white/5">
                <CareersManager />
            </div>
        </div>
    )
}

function StatCard({ label, value, icon, color, onClick }: { label: string, value: any, icon: any, color: string, onClick?: () => void }) {
    const colors: any = {
        primary: 'text-primary bg-primary/10 border-primary/20',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        gold: 'text-gold bg-gold/10 border-gold/20',
        accent: 'text-accent bg-accent/10 border-accent/20',
    }

    const content = (
        <div className={`bg-surface-light border border-white/5 rounded-2xl p-6 transition-all h-full ${onClick ? 'hover:border-white/20 hover:bg-white/5 cursor-pointer group' : ''}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</span>
                <div className={`p-2 rounded-lg ${colors[color]} group-hover:scale-110 transition-transform`}>{icon}</div>
            </div>
            <p className="text-3xl font-black text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
            {onClick && (
                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-accent-light opacity-0 group-hover:opacity-100 transition-opacity">
                    VER DETALLE <ExternalLink className="w-3 h-3" />
                </div>
            )}
        </div>
    )

    if (onClick) {
        return <div onClick={onClick}>{content}</div>
    }

    return content
}

function AdminDetailView({ view, onBack }: { view: 'students' | 'teachers' | 'linked', onBack: () => void }) {
    const [search, setSearch] = useState('')
    
    // Fetch data based on view
    const students = useQuery(api.admin.listStudents)
    const teachers = useQuery(api.admin.listTeachers)
    const linked = useQuery(api.admin.listStudentsWithTeachers)

    const isLoading = (view === 'students' && !students) || 
                      (view === 'teachers' && !teachers) || 
                      (view === 'linked' && !linked)

    const titles = {
        students: { text: "Listado de Alumnos Registrados", icon: <UserCircle className="w-6 h-6 text-blue-400" /> },
        teachers: { text: "Listado de Docentes y Admins", icon: <ShieldAlert className="w-6 h-6 text-gold" /> },
        linked: { text: "Vinculación Estudiante - Docente", icon: <GraduationCap className="w-6 h-6 text-accent" /> }
    }

    const currentData = view === 'students' ? students : 
                        view === 'teachers' ? teachers : 
                        linked

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando detalles...</p>
        </div>
    )

    const filteredData = (currentData || []).filter((item: any) => {
        const term = search.toLowerCase()
        if (view === 'linked') {
            return item.studentName.toLowerCase().includes(term) || 
                   item.teacherName.toLowerCase().includes(term) ||
                   item.courseName.toLowerCase().includes(term) ||
                   item.studentId.toLowerCase().includes(term)
        }
        return item.name?.toLowerCase().includes(term) || item.email?.toLowerCase().includes(term)
    })

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all border border-white/5"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            {titles[view].icon}
                            {titles[view].text}
                        </h3>
                        <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">
                            {filteredData.length} registros encontrados
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Buscar..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-surface-light border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-accent/40 transition-all w-full md:w-80 shadow-xl"
                    />
                </div>
            </div>

            <div className="bg-surface-light border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 text-slate-400 uppercase tracking-widest text-[10px] font-black">
                                {view === 'linked' ? (
                                    <>
                                        <th className="px-6 py-4">Estudiante</th>
                                        <th className="px-6 py-4">Ramo</th>
                                        <th className="px-6 py-4">Docente a Cargo</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-6 py-4">Usuario</th>
                                        <th className="px-6 py-4">Contacto</th>
                                        <th className="px-6 py-4">ID Sistema</th>
                                        <th className="px-6 py-4 text-right">Rol</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredData.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-white/5 transition-all group">
                                    {view === 'linked' ? (
                                        <>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">
                                                        {item.studentName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-bold text-sm">{item.studentName}</p>
                                                        <p className="text-slate-500 text-[10px] font-mono">{item.studentId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-300 font-medium text-xs flex items-center gap-1">
                                                        <School className="w-3 h-3 text-accent" />
                                                        {item.courseName}
                                                    </span>
                                                    <span className="text-slate-500 text-[9px] font-mono uppercase">{item.courseCode}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold font-bold">
                                                        {item.teacherName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-bold text-sm">{item.teacherName}</p>
                                                        <p className="text-slate-500 text-[10px]">{item.teacherEmail}</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${view === 'students' ? 'bg-blue-500/10 text-blue-400' : 'bg-gold/10 text-gold'}`}>
                                                        {item.name?.[0] || 'U'}
                                                    </div>
                                                    <p className="text-white font-bold text-sm">{item.name || "Sin nombre"}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-slate-300 text-xs flex items-center gap-2">
                                                        <Mail className="w-3 h-3 text-slate-500" />
                                                        {item.email}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-500 text-xs font-mono flex items-center gap-2">
                                                    <Hash className="w-3 h-3" />
                                                    {item.student_id || item._id.substring(0, 8)}...
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${
                                                    item.role === 'admin' ? 'text-red-400 border-red-500/20 bg-red-400/5' :
                                                    item.role === 'teacher' ? 'text-gold border-gold/20 bg-gold/5' :
                                                    'text-blue-400 border-blue-500/20 bg-blue-400/5'
                                                }`}>
                                                    {item.role || 'student'}
                                                </span>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredData.length === 0 && (
                    <div className="py-20 text-center">
                        <UserCircle className="w-12 h-12 mx-auto mb-4 text-slate-700" />
                        <p className="text-slate-500 font-bold">No se encontraron registros que coincidan con la búsqueda.</p>
                    </div>
                )}
            </div>
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

function CareersManager() {
    const careers = useQuery((api as any).careers.getCareers)
    const createCareer = useMutation((api as any).careers.createCareer)
    const updateCareer = useMutation((api as any).careers.updateCareer)
    const deleteCareer = useMutation((api as any).careers.deleteCareer)
    const sendReports = useMutation((api as any).careers.sendReportsNow)
    const [sending, setSending] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ name: '', coordinator_email: '', director_email: '', jefe_admin_email: '' })
    const [saving, setSaving] = useState(false)

    const handleSend = async () => {
        if (!confirm('¿Enviar los reportes a todos los coordinadores y jefes de carrera ahora?')) return
        setSending(true)
        try {
            await sendReports()
            toast.success('¡Reportes enviados! Los emails llegarán en los próximos minutos.')
        } catch (err: any) {
            toast.error('Error al enviar: ' + err.message)
        } finally {
            setSending(false)
        }
    }

    const handleSave = async () => {
        if (!form.name || !form.coordinator_email || !form.director_email) {
            toast.error('Nombre, email coordinador y email director son obligatorios')
            return
        }
        setSaving(true)
        try {
            if (editingId) {
                await updateCareer({ career_id: editingId as any, ...form, jefe_admin_email: form.jefe_admin_email || undefined })
                toast.success('Carrera actualizada')
            } else {
                await createCareer({ ...form, jefe_admin_email: form.jefe_admin_email || undefined })
                toast.success('Carrera creada')
            }
            setForm({ name: '', coordinator_email: '', director_email: '', jefe_admin_email: '' })
            setShowForm(false)
            setEditingId(null)
        } catch (err: any) {
            toast.error('Error: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const startEdit = (c: any) => {
        setForm({ name: c.name, coordinator_email: c.coordinator_email, director_email: c.director_email, jefe_admin_email: c.jefe_admin_email ?? '' })
        setEditingId(c._id)
        setShowForm(true)
    }

    const handleDelete = async (id: any, name: string) => {
        if (!confirm(`¿Eliminar la carrera "${name}"? Los ramos vinculados quedarán sin carrera.`)) return
        try {
            await deleteCareer({ career_id: id })
            toast.success('Carrera eliminada')
        } catch (err: any) {
            toast.error('Error: ' + err.message)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-xl">
                        <Building2 className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Carreras e Informes Institucionales</h3>
                        <p className="text-slate-500 text-xs">Configura los destinatarios de los reportes automáticos semanales y mensuales.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', coordinator_email: '', director_email: '', jefe_admin_email: '' }) }}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                    >
                        <Plus className="w-4 h-4" /> Nueva Carrera
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending || !careers?.length}
                        title="Envía reportes semanal y mensual a todos los coordinadores y jefes de carrera ahora"
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Enviar Reportes Ahora
                    </button>
                </div>
            </div>

            {/* Formulario crear/editar */}
            {showForm && (
                <div className="bg-surface-light border border-purple-500/20 rounded-2xl p-6 space-y-4">
                    <h4 className="text-white font-bold text-sm">{editingId ? 'Editar Carrera' : 'Nueva Carrera'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Nombre de la Carrera *</label>
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Ingeniería en Computación" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/40 transition-all" />
                        </div>
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Email Coordinador *</label>
                            <input type="email" value={form.coordinator_email} onChange={e => setForm(f => ({ ...f, coordinator_email: e.target.value }))} placeholder="coordinador@instituto.cl" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/40 transition-all" />
                        </div>
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Email Director/Jefe de Carrera *</label>
                            <input type="email" value={form.director_email} onChange={e => setForm(f => ({ ...f, director_email: e.target.value }))} placeholder="director@instituto.cl" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/40 transition-all" />
                        </div>
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Email Jefe Administrativo <span className="text-slate-600 normal-case">(opcional)</span></label>
                            <input type="email" value={form.jefe_admin_email} onChange={e => setForm(f => ({ ...f, jefe_admin_email: e.target.value }))} placeholder="jefe.admin@instituto.cl" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/40 transition-all" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {editingId ? 'Guardar Cambios' : 'Crear Carrera'}
                        </button>
                        <button onClick={() => { setShowForm(false); setEditingId(null) }} className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-sm rounded-xl transition-all">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Lista de carreras */}
            {!careers ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-600" /></div>
            ) : careers.length === 0 ? (
                <div className="bg-surface-light border border-dashed border-white/10 rounded-2xl p-10 text-center">
                    <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-medium">No hay carreras configuradas.</p>
                    <p className="text-slate-600 text-xs mt-1">Agrega una carrera para activar los reportes automáticos por email.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {careers.map((c: any) => (
                        <div key={c._id} className="bg-surface-light border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-purple-500/20 transition-all">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center shrink-0">
                                    <School className="w-5 h-5 text-purple-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-white font-bold truncate">{c.name}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                        <span className="text-slate-500 text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> Coord: <span className="text-slate-400">{c.coordinator_email}</span></span>
                                        <span className="text-slate-500 text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> Dir: <span className="text-slate-400">{c.director_email}</span></span>
                                        {c.jefe_admin_email && <span className="text-slate-500 text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> Admin: <span className="text-slate-400">{c.jefe_admin_email}</span></span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button onClick={() => startEdit(c)} className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all" aria-label="Editar carrera">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(c._id, c.name)} className="p-2 bg-red-500/5 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/10 transition-all" aria-label="Eliminar carrera">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-4 flex items-start gap-3">
                        <Send className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-purple-300 font-bold text-xs">Envío automático activo</p>
                            <p className="text-slate-500 text-xs mt-1">Los reportes se envían automáticamente cada <strong className="text-slate-400">lunes a las 08:00 AM</strong> a coordinadores y el <strong className="text-slate-400">1° de cada mes</strong> a directores/jefes de carrera.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function EmailDomainsManager() {
    const domains = useQuery(api.app_config.getAllowedDomainsList)
    const updateDomains = useMutation(api.app_config.updateAllowedDomains)
    const [localDomains, setLocalDomains] = useState<string[]>([])
    const [newDomain, setNewDomain] = useState('')
    const [saving, setSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    useState(() => {
        if (domains) {
            setLocalDomains(domains.map(d => d.startsWith('@') ? d.substring(1) : d))
        }
    })

    const handleDomainChange = (index: number, value: string) => {
        const updated = [...localDomains]
        let domain = value.trim().toLowerCase()
        if (!domain.endsWith('.cl') && !domain.endsWith('.com') && !domain.endsWith('.edu')) {
            if (!domain.includes('.')) {
                domain = domain + '.cl'
            }
        }
        updated[index] = domain
        setLocalDomains(updated)
        setHasChanges(true)
    }

    const addDomain = () => {
        let domain = newDomain.trim().toLowerCase()
        if (!domain) return
        if (!domain.startsWith('@')) {
            domain = '@' + domain
        }
        if (!localDomains.includes(domain) && !localDomains.includes(domain.substring(1))) {
            setLocalDomains([...localDomains, domain])
            setNewDomain('')
            setHasChanges(true)
        }
    }

    const removeDomain = (index: number) => {
        const updated = localDomains.filter((_, i) => i !== index)
        setLocalDomains(updated)
        setHasChanges(true)
    }

    const handleSave = async () => {
        if (localDomains.length === 0) {
            toast.error("Debe haber al menos un dominio permitido")
            return
        }

        setSaving(true)
        try {
            const domainsWithAt = localDomains.map(d => d.startsWith('@') ? d : '@' + d)
            await updateDomains({ domains: domainsWithAt })
            toast.success("Dominios actualizados correctamente")
            setHasChanges(false)
        } catch (err: any) {
            toast.error("Error al guardar: " + err.message)
        } finally {
            setSaving(false)
        }
    }

    if (!domains) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-accent animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-xl">
                    <Globe className="w-6 h-6 text-accent" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Dominios de Email Permitidos</h3>
                    <p className="text-slate-500 text-xs">Configura qué dominios de email pueden registrarse en la plataforma.</p>
                </div>
            </div>

            <div className="bg-surface-light border border-white/5 rounded-3xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {localDomains.map((domain, index) => (
                        <div key={index} className="flex items-center gap-2 bg-black/20 rounded-xl px-4 py-3 border border-white/5">
                            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                                <Mail className="w-4 h-4 text-accent" />
                            </div>
                            <input
                                type="text"
                                value={domain.startsWith('@') ? domain.substring(1) : domain}
                                onChange={(e) => handleDomainChange(index, e.target.value)}
                                className="flex-1 bg-transparent text-white text-sm font-mono focus:outline-none"
                                placeholder="dominio.com"
                            />
                            <button
                                onClick={() => removeDomain(index)}
                                className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    <div className="flex-1 flex items-center gap-2 bg-black/20 rounded-xl px-4 py-3 border border-white/5">
                        <span className="text-slate-500 text-sm">@</span>
                        <input
                            type="text"
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addDomain()}
                            placeholder="Agregar nuevo dominio..."
                            className="flex-1 bg-transparent text-white text-sm font-mono focus:outline-none"
                        />
                    </div>
                    <button
                        onClick={addDomain}
                        className="p-3 bg-accent/20 hover:bg-accent/30 rounded-xl text-accent transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <p className="text-slate-500 text-xs">
                        {localDomains.length} dominio(s) configurado(s)
                    </p>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                            hasChanges && !saving
                                ? 'bg-accent hover:bg-accent/80 text-white shadow-lg shadow-accent/20'
                                : 'bg-white/5 text-slate-500 cursor-not-allowed'
                        }`}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
