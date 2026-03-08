import { useState, useRef } from 'react'
import { useQuery, useMutation } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { useNavigate } from 'react-router-dom'
import { api } from "../../convex/_generated/api"
import { BookOpen, Target, Trophy, Gift, Users, Upload, Plus, BarChart3, LogOut, Menu, X, Settings, FileSpreadsheet, Coins, ChevronRight, Flame, Trash2, CheckCircle, Loader2, Sparkles, FileText, Eye, EyeOff } from 'lucide-react'
import Papa from 'papaparse'
import { extractTextFromFile, getFileType, getFileIcon, formatFileSize } from '../utils/documentParser'

function getGreeting(): string {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 20) return 'Buenas tardes'
    return 'Buenas noches'
}

function getFirstName(fullName?: string): string {
    if (!fullName) return ''
    return fullName.split(' ')[0]
}

export default function TeacherDashboard() {
    const { signOut } = useAuthActions()
    const navigate = useNavigate()
    const user = useQuery(api.users.me)
    const courses = useQuery(api.courses.getMyCourses)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('inicio')

    const handleLogout = async () => {
        await signOut()
        navigate('/')
    }

    const firstName = getFirstName(user?.name)
    const coursesCount = courses?.length || 0

    const tabs = [
        { id: 'inicio', label: 'Inicio', icon: <BarChart3 className="w-5 h-5" /> },
        { id: 'ramos', label: 'Mis Ramos', icon: <BookOpen className="w-5 h-5" /> },
        { id: 'material', label: 'Material', icon: <FileText className="w-5 h-5" /> },
        { id: 'misiones', label: 'Misiones', icon: <Target className="w-5 h-5" /> },
        { id: 'ranking', label: 'Ranking', icon: <Trophy className="w-5 h-5" /> },
        { id: 'recompensas', label: 'Recompensas', icon: <Gift className="w-5 h-5" /> },
        { id: 'grupos', label: 'Grupos Inteligentes', icon: <Users className="w-5 h-5" /> },
        { id: 'whitelist', label: 'Whitelist (CSV)', icon: <FileSpreadsheet className="w-5 h-5" /> },
        { id: 'analiticas', label: 'Analíticas', icon: <BarChart3 className="w-5 h-5" /> },
    ]

    if (!user) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-surface flex">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-surface-light border-r border-white/5 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center">
                                <Settings className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <span className="text-lg font-bold text-white block">Panel Docente</span>
                                <span className="text-xs text-slate-500">GestiónDocente</span>
                            </div>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-4">
                    {/* Perfil Docente */}
                    <div className="bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20 rounded-2xl p-4 mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center text-lg">👩‍🏫</div>
                            <div>
                                <p className="text-white font-semibold text-sm">{user.name}</p>
                                <p className="text-slate-400 text-xs">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-accent-light text-xs font-medium">
                            <BookOpen className="w-3.5 h-3.5" />
                            {coursesCount} {coursesCount === 1 ? 'ramo activo' : 'ramos activos'}
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-medium text-sm
                  ${activeTab === tab.id
                                        ? 'bg-accent/10 text-accent-light border border-accent/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all font-medium text-sm">
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* Main */}
            <main className="flex-1 min-h-screen">
                <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold text-white">{tabs.find(t => t.id === activeTab)?.label}</h1>
                    </div>
                </header>

                <div className="p-6">
                    {activeTab === 'inicio' && <InicioDocente firstName={firstName} coursesCount={coursesCount} courses={courses || []} />}
                    {activeTab === 'ramos' && <RamosPanel courses={courses || []} />}
                    {activeTab === 'material' && <MaterialPanel courses={courses || []} />}
                    {activeTab === 'misiones' && <CrearMisionPanel courses={courses || []} />}
                    {activeTab === 'recompensas' && <CrearRecompensaPanel courses={courses || []} />}
                    {activeTab === 'whitelist' && <WhitelistPanel courses={courses || []} />}
                    {activeTab === 'grupos' && <GruposPanel />}
                    {activeTab === 'ranking' && <RankingDocentePanel />}
                    {activeTab === 'analiticas' && <AnaliticasPanel />}
                </div>
            </main>
        </div>
    )
}

// ======== INICIO con saludo personalizado ========

function InicioDocente({ firstName, coursesCount, courses }: { firstName: string, coursesCount: number, courses: any[] }) {
    return (
        <div className="space-y-8">
            {/* Saludo Personalizado */}
            <div className="bg-gradient-to-r from-accent/10 via-primary/5 to-surface-light border border-accent/20 rounded-3xl p-8">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-accent-light" />
                    <span className="text-accent-light text-sm font-medium">{getGreeting()}</span>
                </div>
                <h2 className="text-3xl font-black text-white mb-2">
                    Hola {firstName} 👋
                </h2>
                <p className="text-slate-400 text-lg">
                    {coursesCount === 0
                        ? 'Comienza creando tu primer ramo para empezar a gamificar tus clases.'
                        : `Tienes ${coursesCount} ${coursesCount === 1 ? 'ramo activo' : 'ramos activos'}. ¿Listo para inspirar hoy?`
                    }
                </p>
            </div>

            {/* Stats rápidas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Ramos Activos', value: `${coursesCount}`, color: 'text-accent-light', bg: 'bg-accent/10', icon: <BookOpen className="w-6 h-6" /> },
                    { label: 'Misiones Creadas', value: '—', color: 'text-primary-light', bg: 'bg-primary/10', icon: <Target className="w-6 h-6" /> },
                    { label: 'Alumnos Totales', value: '—', color: 'text-gold', bg: 'bg-gold/10', icon: <Users className="w-6 h-6" /> },
                ].map((stat, i) => (
                    <div key={i} className="bg-surface-light border border-white/5 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-slate-400">{stat.label}</span>
                            <div className={`${stat.bg} p-2 rounded-xl ${stat.color}`}>{stat.icon}</div>
                        </div>
                        <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Ramos recientes */}
            <div>
                <h3 className="text-lg font-bold text-white mb-4">Tus Ramos</h3>
                {courses.length === 0 ? (
                    <div className="bg-surface-light border border-dashed border-white/10 rounded-2xl p-10 text-center">
                        <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h4 className="text-white font-semibold mb-2">Sin ramos aún</h4>
                        <p className="text-slate-400 text-sm">Ve a "Mis Ramos" para crear tu primer ramo.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {courses.map((c: any) => (
                            <div key={c._id} className="bg-surface-light border border-white/5 rounded-2xl p-6 hover:border-accent/30 transition-all group cursor-pointer">
                                <h4 className="text-lg font-bold text-white group-hover:text-accent-light transition-colors">{c.name}</h4>
                                <span className="text-xs text-slate-500 font-mono">{c.code}</span>
                                {c.description && <p className="text-slate-400 text-sm mt-2 line-clamp-2">{c.description}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ======== RAMOS con creación real ========

function RamosPanel({ courses }: { courses: any[] }) {
    const createCourse = useMutation(api.courses.createCourse)
    const [showCreate, setShowCreate] = useState(false)
    const [formData, setFormData] = useState({ name: '', code: '', description: '' })
    const [creating, setCreating] = useState(false)
    const [success, setSuccess] = useState('')

    const handleCreate = async () => {
        if (!formData.name || !formData.code) return
        setCreating(true)
        try {
            await createCourse(formData)
            setSuccess(`Ramo "${formData.name}" creado exitosamente.`)
            setFormData({ name: '', code: '', description: '' })
            setShowCreate(false)
            setTimeout(() => setSuccess(''), 4000)
        } catch (err: any) {
            alert(err.message || 'Error al crear el ramo')
        } finally {
            setCreating(false)
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <p className="text-slate-400">Gestiona tus ramos activos.</p>
                <button onClick={() => setShowCreate(!showCreate)} className="bg-accent hover:bg-accent-light text-white font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-2 text-sm">
                    <Plus className="w-4 h-4" />
                    Nuevo Ramo
                </button>
            </div>

            {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-green-400 text-sm font-medium">{success}</p>
                </div>
            )}

            {showCreate && (
                <div className="bg-surface-light border border-accent/20 rounded-2xl p-6 mb-6 space-y-4">
                    <h3 className="text-white font-bold">Crear Ramo</h3>
                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre del ramo (ej. Electrotecnia I)" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent" />
                    <input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="Código (ej. ELT-101)" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent" />
                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción del ramo..." className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent h-24 resize-none" />
                    <button onClick={handleCreate} disabled={creating || !formData.name || !formData.code} className="bg-accent text-white font-bold px-6 py-3 rounded-xl hover:bg-accent-light transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                        {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                        {creating ? 'Creando...' : 'Crear Ramo'}
                    </button>
                </div>
            )}

            {courses.length === 0 && !showCreate ? (
                <div className="bg-surface-light border border-dashed border-white/10 rounded-2xl p-10 text-center">
                    <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h4 className="text-white font-semibold mb-2">Sin ramos aún</h4>
                    <p className="text-slate-400 text-sm">Crea tu primer ramo con el botón de arriba.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.map((c: any) => (
                        <div key={c._id} className="bg-surface-light border border-white/5 rounded-2xl p-6 hover:border-accent/30 transition-all group cursor-pointer">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-white group-hover:text-accent-light transition-colors">{c.name}</h3>
                                    <span className="text-xs text-slate-500 font-mono">{c.code}</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-accent-light" />
                            </div>
                            {c.description && <p className="text-slate-400 text-sm mt-3 line-clamp-2">{c.description}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ======== MISIONES con creación real ========

function CrearMisionPanel({ courses }: { courses: any[] }) {
    const createMission = useMutation(api.missions.createMission)
    const [formData, setFormData] = useState({ course_id: '', title: '', description: '', points: '' })
    const [creating, setCreating] = useState(false)
    const [success, setSuccess] = useState('')

    const handleCreate = async () => {
        if (!formData.course_id || !formData.title || !formData.points) return
        setCreating(true)
        try {
            await createMission({
                course_id: formData.course_id as any,
                title: formData.title,
                description: formData.description,
                points: parseInt(formData.points),
            })
            setSuccess(`Misión "${formData.title}" creada.`)
            setFormData({ course_id: formData.course_id, title: '', description: '', points: '' })
            setTimeout(() => setSuccess(''), 4000)
        } catch (err: any) {
            alert(err.message || 'Error al crear la misión')
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className="max-w-2xl">
            <p className="text-slate-400 mb-6">Crea misiones gamificadas para motivar a tus alumnos.</p>
            {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-green-400 text-sm font-medium">{success}</p>
                </div>
            )}
            <div className="bg-surface-light border border-white/5 rounded-2xl p-6 space-y-4">
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Ramo</label>
                    <select value={formData.course_id} onChange={e => setFormData({ ...formData, course_id: e.target.value })} className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary">
                        <option value="">Selecciona un ramo</option>
                        {courses.map((c: any) => (
                            <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Título de la Misión</label>
                    <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="ej. Quiz de Leyes de Kirchhoff" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary" />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Descripción</label>
                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe la misión..." className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary h-24 resize-none" />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Puntos</label>
                    <input type="number" value={formData.points} onChange={e => setFormData({ ...formData, points: e.target.value })} placeholder="100" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary" />
                </div>
                <button onClick={handleCreate} disabled={creating || !formData.course_id || !formData.title || !formData.points} className="bg-primary hover:bg-primary-light text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Flame className="w-5 h-5" />}
                    {creating ? 'Creando...' : 'Crear Misión'}
                </button>
            </div>
        </div>
    )
}

// ======== RECOMPENSAS con creación real ========

function CrearRecompensaPanel({ courses }: { courses: any[] }) {
    const createReward = useMutation(api.rewards.createReward)
    const [formData, setFormData] = useState({ course_id: '', name: '', description: '', cost: '', stock: '' })
    const [creating, setCreating] = useState(false)
    const [success, setSuccess] = useState('')

    const handleCreate = async () => {
        if (!formData.course_id || !formData.name || !formData.cost || !formData.stock) return
        setCreating(true)
        try {
            await createReward({
                course_id: formData.course_id as any,
                name: formData.name,
                description: formData.description,
                cost: parseInt(formData.cost),
                stock: parseInt(formData.stock),
            })
            setSuccess(`Recompensa "${formData.name}" creada.`)
            setFormData({ course_id: formData.course_id, name: '', description: '', cost: '', stock: '' })
            setTimeout(() => setSuccess(''), 4000)
        } catch (err: any) {
            alert(err.message || 'Error al crear la recompensa')
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className="max-w-2xl">
            <p className="text-slate-400 mb-6">Define premios que tus alumnos podrán canjear con sus puntos.</p>
            {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-green-400 text-sm font-medium">{success}</p>
                </div>
            )}
            <div className="bg-surface-light border border-white/5 rounded-2xl p-6 space-y-4">
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Ramo</label>
                    <select value={formData.course_id} onChange={e => setFormData({ ...formData, course_id: e.target.value })} className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary">
                        <option value="">Selecciona un ramo</option>
                        {courses.map((c: any) => (
                            <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Nombre del Premio</label>
                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="ej. Punto Extra en Prueba" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary" />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Descripción</label>
                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Detalle del beneficio..." className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary h-20 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Costo (pts)</label>
                        <input type="number" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} placeholder="500" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Stock</label>
                        <input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} placeholder="10" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary" />
                    </div>
                </div>
                <button onClick={handleCreate} disabled={creating || !formData.course_id || !formData.name || !formData.cost || !formData.stock} className="bg-gradient-to-r from-gold to-gold-light text-surface font-bold px-6 py-3 rounded-xl transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Gift className="w-5 h-5" />}
                    {creating ? 'Creando...' : 'Crear Recompensa'}
                </button>
            </div>
        </div>
    )
}
// ======== WHITELIST con upload real (CSV + XLSX) ========

function WhitelistPanel({ courses }: { courses: any[] }) {
    const uploadWhitelist = useMutation(api.courses.batchUploadWhitelist)
    const fileRef = useRef<HTMLInputElement>(null)
    const [parsedData, setParsedData] = useState<{ id: string, name: string }[]>([])
    const [fileName, setFileName] = useState('')
    const [selectedCourse, setSelectedCourse] = useState('')
    const [uploading, setUploading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    // Función inteligente para detectar columnas en el XLSX/CSV
    const findColumn = (headers: string[], keywords: string[]): number => {
        for (const kw of keywords) {
            const idx = headers.findIndex(h => h.toLowerCase().includes(kw.toLowerCase()))
            if (idx !== -1) return idx
        }
        return -1
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setFileName(file.name)
        setError('')
        setParsedData([])

        const ext = file.name.split('.').pop()?.toLowerCase()

        if (ext === 'xlsx' || ext === 'xls') {
            // ===== Parsear XLSX con SheetJS =====
            try {
                const XLSX = await import('xlsx')
                const arrayBuffer = await file.arrayBuffer()
                const workbook = XLSX.read(arrayBuffer, { type: 'array' })
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
                const jsonData = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 }) as string[][]

                if (jsonData.length < 2) {
                    setError('El archivo Excel está vacío o no tiene datos.')
                    return
                }

                // Buscar la fila de headers (puede no ser la primera si tiene títulos)
                let headerRowIdx = 0
                for (let i = 0; i < Math.min(5, jsonData.length); i++) {
                    const row = jsonData[i].map(c => String(c || '').toLowerCase())
                    if (row.some(c => c.includes('rut') || c.includes('alumno') || c.includes('matrícula') || c.includes('matricula'))) {
                        headerRowIdx = i
                        break
                    }
                }

                const headers = jsonData[headerRowIdx].map(h => String(h || ''))
                const dataRows = jsonData.slice(headerRowIdx + 1)

                // Detectar columna de RUT/identificador
                const rutCol = findColumn(headers, ['rut alumno', 'rut', 'matrícula', 'matricula', 'identificador', 'id alumno'])
                // Detectar columnas de nombre
                const nombresCol = findColumn(headers, ['nombres', 'nombre'])
                const apPaternoCol = findColumn(headers, ['apellido paterno', 'ap. paterno', 'paterno'])
                const apMaternoCol = findColumn(headers, ['apellido materno', 'ap. materno', 'materno'])

                if (rutCol === -1) {
                    // Fallback: usar la primera columna numérica como RUT
                    const firstNumericCol = headers.findIndex((_, i) => {
                        const val = String(dataRows[0]?.[i] || '')
                        return /^\d{6,}/.test(val.replace(/\./g, ''))
                    })
                    if (firstNumericCol === -1) {
                        setError('No se encontró una columna de RUT o identificador en el archivo. Asegúrate de que exista una columna "Rut Alumno".')
                        return
                    }
                    // Usar esa columna
                    const entries = dataRows
                        .map(row => ({
                            id: String(row[firstNumericCol] || '').trim(),
                            name: '',
                        }))
                        .filter(e => e.id.length > 3)
                    setParsedData(entries)
                } else {
                    const entries = dataRows
                        .map(row => {
                            const rut = String(row[rutCol] || '').trim()
                            // Construir nombre completo
                            const parts = []
                            if (nombresCol !== -1) parts.push(String(row[nombresCol] || '').trim())
                            if (apPaternoCol !== -1) parts.push(String(row[apPaternoCol] || '').trim())
                            if (apMaternoCol !== -1) parts.push(String(row[apMaternoCol] || '').trim())
                            const name = parts.filter(Boolean).join(' ')
                            return { id: rut, name }
                        })
                        .filter(e => e.id.length > 3)
                    setParsedData(entries)
                }

                if (parsedData.length === 0 && dataRows.length > 0) {
                    // Re-check after state update
                }
            } catch (err: any) {
                setError(`Error al leer el archivo Excel: ${err.message}`)
            }
        } else {
            // ===== Parsear CSV con PapaParse =====
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const headers = results.meta.fields || []
                    const rutCol = findColumn(headers, ['rut alumno', 'rut', 'matrícula', 'matricula', 'identificador'])
                    const nombresCol = findColumn(headers, ['nombres', 'nombre'])
                    const apPaternoCol = findColumn(headers, ['apellido paterno', 'paterno'])

                    const entries = results.data
                        .map((row: any) => {
                            const values = Object.values(row) as string[]
                            const id = rutCol !== -1 ? String(values[rutCol] || '').trim() : String(values[0] || '').trim()
                            const parts = []
                            if (nombresCol !== -1) parts.push(String(values[nombresCol] || '').trim())
                            if (apPaternoCol !== -1) parts.push(String(values[apPaternoCol] || '').trim())
                            return { id, name: parts.filter(Boolean).join(' ') }
                        })
                        .filter(e => e.id.length > 3)
                    setParsedData(entries)
                },
                error: () => setError('Error al leer el archivo CSV. Verifica el formato.')
            })
        }
    }

    const handleUpload = async () => {
        if (!selectedCourse || parsedData.length === 0) return
        setUploading(true)
        setError('')
        try {
            const result = await uploadWhitelist({
                course_id: selectedCourse as any,
                identifiers: parsedData.map(e => e.id),
            })
            setSuccess(`✅ ${result.added} alumnos cargados exitosamente en la whitelist.`)
            setParsedData([])
            setFileName('')
            if (fileRef.current) fileRef.current.value = ''
            setTimeout(() => setSuccess(''), 5000)
        } catch (err: any) {
            setError(err.message || 'Error al cargar la whitelist')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="max-w-2xl">
            <p className="text-slate-400 mb-6">Sube el listado de alumnos en formato <strong className="text-white">XLSX</strong> o <strong className="text-white">CSV</strong>. El sistema detectará automáticamente la columna de RUT y los nombres.</p>

            {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-green-400 text-sm font-medium">{success}</p>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <span className="text-red-400 text-lg shrink-0">⚠️</span>
                    <p className="text-red-400 text-sm">{error}</p>
                    <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="bg-surface-light border border-white/5 rounded-2xl p-6 space-y-5">
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Ramo</label>
                    <select
                        value={selectedCourse}
                        onChange={e => setSelectedCourse(e.target.value)}
                        className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                        aria-label="Selecciona un ramo para la whitelist"
                    >
                        <option value="">Selecciona un ramo</option>
                        {courses.map((c: any) => (
                            <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Archivo XLSX o CSV</label>
                    <label className="flex flex-col items-center justify-center w-full h-36 bg-surface border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-accent/40 transition-all group">
                        <div className="flex gap-2 mb-2">
                            <span className="text-2xl">📗</span>
                            <span className="text-2xl">📄</span>
                        </div>
                        <span className="text-slate-400 text-sm font-medium">{fileName || 'Haz clic para subir el listado de alumnos'}</span>
                        <span className="text-slate-500 text-xs mt-1">.xlsx o .csv — se detectará automáticamente el RUT</span>
                        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>

                {parsedData.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 text-green-400 mb-3">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-semibold text-sm">{parsedData.length} alumnos detectados</span>
                        </div>
                        <div className="bg-surface rounded-xl overflow-hidden border border-white/5">
                            {/* Header de la tabla */}
                            <div className="flex items-center px-4 py-2.5 bg-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <span className="w-8 text-center">#</span>
                                <span className="w-32">RUT</span>
                                <span className="flex-1">Nombre</span>
                                <span className="w-8"></span>
                            </div>
                            {/* Filas de alumnos */}
                            <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                                {parsedData.map((entry, i) => (
                                    <div key={i} className="flex items-center px-4 py-2.5 hover:bg-white/5 transition-colors">
                                        <span className="w-8 text-center text-slate-600 text-xs">{i + 1}</span>
                                        <span className="w-32 text-slate-300 font-mono text-sm">{entry.id}</span>
                                        <span className="flex-1 text-slate-400 text-sm truncate">{entry.name || '—'}</span>
                                        <button
                                            onClick={() => setParsedData(parsedData.filter((_, idx) => idx !== i))}
                                            className="w-8 flex justify-center text-slate-600 hover:text-red-400 transition-colors"
                                            title="Eliminar alumno"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleUpload}
                            disabled={uploading || !selectedCourse}
                            className="mt-4 bg-accent hover:bg-accent-light text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                            {uploading ? 'Cargando...' : `Cargar Whitelist (${parsedData.length} alumnos)`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ======== Sub-componentes con datos demo (se conectarán cuando haya datos) ========

function GruposPanel() {
    const courses = useQuery(api.courses.getMyCourses)
    const generateGroups = useMutation(api.groups.generateGroups)
    const [selectedCourse, setSelectedCourse] = useState('')
    const [groupSize, setGroupSize] = useState(3)
    const [generating, setGenerating] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState('')

    // Obtener grupos existentes del ramo seleccionado
    const existingGroups = useQuery(
        api.groups.getGroups,
        selectedCourse ? { course_id: selectedCourse as any } : "skip"
    )

    const handleGenerate = async () => {
        if (!selectedCourse) {
            setError('Selecciona un ramo primero.')
            return
        }
        setGenerating(true)
        setError('')
        setResult(null)
        try {
            const res = await generateGroups({
                course_id: selectedCourse as any,
                group_size: groupSize,
            })
            setResult(res)
        } catch (err: any) {
            setError(err.message || 'Error al generar grupos')
        } finally {
            setGenerating(false)
        }
    }

    const rolEmoji: Record<string, string> = {
        'Cerebro': '🧠', 'Monitor': '🔍', 'Coordinador': '👑',
        'Investigador': '🌐', 'Cohesionador': '🤝', 'Impulsor': '⚡',
        'Implementador': '⚙️', 'Finalizador': '🎯', 'Sin determinar': '❓',
    }

    const categoryColor: Record<string, string> = {
        'Mental': 'text-blue-400', 'Social': 'text-green-400',
        'Acción': 'text-orange-400', 'Sin categoría': 'text-slate-500',
    }

    // Determinar qué grupos mostrar: resultado fresco o existentes
    const displayGroups = result ? result.groups : (existingGroups || []).filter((g: any) => g.name !== 'Sin grupo')

    return (
        <div>
            <p className="text-slate-400 mb-6">Genera grupos equilibrados automáticamente basándose en los perfiles Belbin de tus alumnos.</p>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <span className="text-red-400 shrink-0">⚠️</span>
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            <div className="bg-surface-light border border-white/5 rounded-2xl p-6 mb-6 space-y-4">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Ramo</label>
                        <select
                            value={selectedCourse}
                            onChange={e => { setSelectedCourse(e.target.value); setResult(null) }}
                            className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                            aria-label="Selecciona un ramo para generar grupos"
                        >
                            <option value="">Selecciona un ramo</option>
                            {(courses || []).map((c: any) => (
                                <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-48">
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Alumnos por grupo</label>
                        <input
                            type="number"
                            value={groupSize}
                            onChange={e => setGroupSize(Number(e.target.value))}
                            min={2} max={8}
                            className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                            aria-label="Cantidad de alumnos por grupo"
                        />
                    </div>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={generating || !selectedCourse}
                    className="bg-gradient-to-r from-primary to-accent text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
                    {generating ? 'Generando...' : 'Generar Grupos Inteligentes'}
                </button>
            </div>

            {result && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-green-400 text-sm font-medium">
                        ✅ {result.total_groups} grupos generados con {result.total_students} alumnos
                    </p>
                </div>
            )}

            {displayGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {displayGroups.map((group: any, idx: number) => (
                        <div key={idx} className="bg-surface-light border border-white/5 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <Users className="w-5 h-5 text-accent-light" />
                                    {group.name}
                                </h3>
                                <span className="text-xs text-slate-500">{group.members.length} miembros</span>
                            </div>
                            {/* Balance bar */}
                            <div className="flex gap-1 mb-4 h-2 rounded-full overflow-hidden bg-surface">
                                {group.stats?.mental > 0 && <div className="bg-blue-400" style={{ flex: group.stats.mental }} />}
                                {group.stats?.social > 0 && <div className="bg-green-400" style={{ flex: group.stats.social }} />}
                                {(group.stats?.accion > 0 || group.stats?.acción > 0) && <div className="bg-orange-400" style={{ flex: group.stats.accion || group.stats.acción }} />}
                            </div>
                            <div className="flex gap-3 mb-4 text-xs">
                                <span className="text-blue-400">🧠 {group.stats?.mental || 0}</span>
                                <span className="text-green-400">🤝 {group.stats?.social || 0}</span>
                                <span className="text-orange-400">⚡ {group.stats?.accion || group.stats?.acción || 0}</span>
                            </div>
                            <div className="space-y-2">
                                {group.members.map((m: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between bg-surface rounded-xl px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{rolEmoji[m.belbinRole] || '❓'}</span>
                                            <span className="text-white font-medium text-sm">{m.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-primary-light text-xs font-semibold block">{m.belbinRole}</span>
                                            <span className={`text-xs ${categoryColor[m.belbinCategory] || 'text-slate-500'}`}>{m.belbinCategory}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : selectedCourse ? (
                <div className="bg-surface-light border border-dashed border-white/10 rounded-2xl p-10 text-center">
                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h4 className="text-white font-semibold mb-2">Sin grupos aún</h4>
                    <p className="text-slate-400 text-sm">Selecciona un ramo con alumnos inscritos y haz clic en "Generar Grupos Inteligentes".</p>
                </div>
            ) : null}
        </div>
    )
}

function RankingDocentePanel() {
    const courses = useQuery(api.courses.getMyCourses)
    const [selectedCourse, setSelectedCourse] = useState('')
    const students = useQuery(
        api.courses.getCourseStudents,
        selectedCourse ? { course_id: selectedCourse as any } : "skip"
    )

    const sorted = [...(students || [])].sort((a, b) => b.total_points - a.total_points)
    const medals = ['🥇', '🥈', '🥉']

    return (
        <div>
            <p className="text-slate-400 mb-6">Ranking de alumnos por ramo en tiempo real.</p>

            <div className="mb-6">
                <label className="text-sm font-medium text-slate-300 mb-2 block">Ramo</label>
                <select
                    value={selectedCourse}
                    onChange={e => setSelectedCourse(e.target.value)}
                    className="w-full max-w-md bg-surface-light border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                    aria-label="Selecciona un ramo para ver el ranking"
                >
                    <option value="">Selecciona un ramo</option>
                    {(courses || []).map((c: any) => (
                        <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                    ))}
                </select>
            </div>

            {selectedCourse && sorted.length > 0 ? (
                <div className="bg-surface-light border border-white/5 rounded-2xl overflow-hidden">
                    <div className="flex items-center px-6 py-3 bg-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <span className="w-12 text-center">#</span>
                        <span className="flex-1">Alumno</span>
                        <span className="w-28 text-center">Belbin</span>
                        <span className="w-24 text-right">Puntos</span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {sorted.map((s, i) => (
                            <div key={s._id} className={`flex items-center px-6 py-4 hover:bg-white/5 transition-colors ${i < 3 ? 'bg-white/[0.02]' : ''}`}>
                                <span className="w-12 text-center text-lg">{medals[i] || <span className="text-slate-500 text-sm">{i + 1}</span>}</span>
                                <div className="flex-1">
                                    <p className="text-white font-medium">{s.name}</p>
                                    <p className="text-slate-500 text-xs">{s.student_id || s.email}</p>
                                </div>
                                <span className="w-28 text-center text-primary-light text-xs font-semibold">{s.belbin}</span>
                                <span className="w-24 text-right text-accent-light font-bold">{s.total_points.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : selectedCourse ? (
                <div className="bg-surface-light border border-dashed border-white/10 rounded-2xl p-10 text-center">
                    <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h4 className="text-white font-semibold mb-2">Sin alumnos inscritos</h4>
                    <p className="text-slate-400 text-sm">Carga una whitelist con los RUTs de tus alumnos para que se inscriban automáticamente.</p>
                </div>
            ) : (
                <div className="bg-surface-light border border-dashed border-white/10 rounded-2xl p-10 text-center">
                    <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h4 className="text-white font-semibold mb-2">Selecciona un ramo</h4>
                    <p className="text-slate-400 text-sm">Elige un ramo para ver el ranking de tus alumnos.</p>
                </div>
            )}
        </div>
    )
}

function AnaliticasPanel() {
    const stats = useQuery(api.analytics.getTeacherStats)

    if (!stats) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
        )
    }

    const belbinColors: Record<string, string> = {
        'Cerebro': 'bg-blue-500', 'Monitor': 'bg-blue-400',
        'Coordinador': 'bg-green-500', 'Investigador': 'bg-green-400', 'Cohesionador': 'bg-emerald-400',
        'Impulsor': 'bg-orange-500', 'Implementador': 'bg-orange-400', 'Finalizador': 'bg-amber-400',
    }

    const maxBelbin = Math.max(...Object.values(stats.belbinDistribution), 1)

    return (
        <div>
            <p className="text-slate-400 mb-6">Métricas de rendimiento y participación de tus alumnos.</p>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Alumnos Totales', value: stats.totalStudents, color: 'text-accent-light', icon: '👥' },
                    { label: 'Misiones Completadas', value: stats.totalMissionsCompleted, color: 'text-primary-light', icon: '🎯' },
                    { label: 'Canjes Realizados', value: stats.totalRedemptions, color: 'text-gold', icon: '🎁' },
                    { label: 'Puntos Otorgados', value: stats.totalPoints.toLocaleString(), color: 'text-accent-light', icon: '⭐' },
                ].map((s, i) => (
                    <div key={i} className="bg-surface-light border border-white/5 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-slate-400 text-xs uppercase tracking-wider">{s.label}</p>
                            <span className="text-2xl">{s.icon}</span>
                        </div>
                        <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Distribución Belbin */}
            {Object.keys(stats.belbinDistribution).length > 0 && (
                <div className="bg-surface-light border border-white/5 rounded-2xl p-6 mb-8">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-accent-light" />
                        Distribución Belbin
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(stats.belbinDistribution)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .map(([role, count]) => (
                                <div key={role} className="flex items-center gap-3">
                                    <span className="text-slate-300 text-sm w-28 truncate">{role}</span>
                                    <div className="flex-1 bg-surface rounded-full h-5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${belbinColors[role] || 'bg-slate-500'} transition-all duration-500`}
                                            style={{ width: `${((count as number) / maxBelbin) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-white font-bold text-sm w-8 text-right">{count as number}</span>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Tabla de ramos */}
            {stats.courseStats.length > 0 && (
                <div className="bg-surface-light border border-white/5 rounded-2xl overflow-hidden">
                    <h3 className="text-white font-bold p-6 pb-3 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-accent-light" />
                        Detalle por Ramo
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="text-left px-6 py-3">Ramo</th>
                                    <th className="text-center px-3 py-3">Alumnos</th>
                                    <th className="text-center px-3 py-3">Misiones</th>
                                    <th className="text-center px-3 py-3">Entregas</th>
                                    <th className="text-center px-3 py-3">Documentos</th>
                                    <th className="text-right px-6 py-3">Puntos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {stats.courseStats.map((cs: any, i: number) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-white font-medium">{cs.name}</p>
                                            <p className="text-slate-500 text-xs">{cs.code}</p>
                                        </td>
                                        <td className="text-center text-slate-300 px-3">{cs.students}</td>
                                        <td className="text-center text-slate-300 px-3">{cs.missions}</td>
                                        <td className="text-center text-slate-300 px-3">{cs.submissions}</td>
                                        <td className="text-center text-slate-300 px-3">{cs.documents}</td>
                                        <td className="text-right text-accent-light font-bold px-6">{cs.totalPoints.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {stats.totalCourses === 0 && (
                <div className="bg-surface-light border border-dashed border-white/10 rounded-2xl p-10 text-center">
                    <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h4 className="text-white font-semibold mb-2">Sin datos aún</h4>
                    <p className="text-slate-400 text-sm">Crea ramos y agrega alumnos para ver las analíticas.</p>
                </div>
            )}
        </div>
    )
}

// ======== MATERIAL — Upload de Documentos ========

function MaterialPanel({ courses }: { courses: any[] }) {
    const generateUploadUrl = useMutation(api.documents.generateUploadUrl)
    const saveDocument = useMutation(api.documents.saveDocument)
    const deleteDocument = useMutation(api.documents.deleteDocument)
    const documents = useQuery(api.documents.getMyDocuments)
    const fileRef = useRef<HTMLInputElement>(null)

    const [selectedCourse, setSelectedCourse] = useState('')
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [expandedDoc, setExpandedDoc] = useState<string | null>(null)
    const [dragOver, setDragOver] = useState(false)

    const ACCEPTED_TYPES = '.pdf,.docx,.pptx,.xlsx,.xls'
    const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return
        if (!selectedCourse) {
            setError('Selecciona un ramo antes de subir archivos.')
            // Limpiar el input para que se pueda volver a seleccionar archivos
            if (fileRef.current) fileRef.current.value = ''
            return
        }

        setError('')
        setSuccess('')

        for (const file of Array.from(files)) {
            const fileType = getFileType(file.name)
            if (!fileType) {
                setError(`Archivo no soportado: ${file.name}. Usa PDF, DOCX, PPTX o XLSX.`)
                continue
            }

            if (file.size > MAX_FILE_SIZE) {
                setError(`El archivo "${file.name}" excede el límite de 20MB.`)
                continue
            }

            setUploading(true)
            try {
                // Paso 1: Extraer texto del documento
                setUploadProgress(`📖 Leyendo "${file.name}"...`)
                const contentText = await extractTextFromFile(file)

                // Paso 2: Subir archivo a Convex Storage
                setUploadProgress(`📤 Subiendo "${file.name}"...`)
                const uploadUrl = await generateUploadUrl()
                const result = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': file.type || 'application/octet-stream' },
                    body: file,
                })
                const { storageId } = await result.json()

                // Paso 3: Guardar metadata + contenido en la BD
                setUploadProgress(`💾 Guardando "${file.name}"...`)
                await saveDocument({
                    course_id: selectedCourse as any,
                    file_id: storageId,
                    file_name: file.name,
                    file_type: fileType,
                    file_size: file.size,
                    content_text: contentText,
                })

                setSuccess(`✅ "${file.name}" subido y procesado exitosamente. (${contentText.length.toLocaleString()} caracteres extraídos)`)
            } catch (err: any) {
                setError(`Error con "${file.name}": ${err.message}`)
            }
        }

        setUploading(false)
        setUploadProgress('')
        if (fileRef.current) fileRef.current.value = ''
    }

    const handleDelete = async (docId: any) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este documento?')) return
        try {
            await deleteDocument({ document_id: docId })
            setSuccess('Documento eliminado.')
            setTimeout(() => setSuccess(''), 3000)
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        handleUpload(e.dataTransfer.files)
    }

    // Agrupar documentos por curso
    const docsByCourse = (documents || []).reduce((acc: Record<string, any[]>, doc: any) => {
        const cid = doc.course_id
        if (!acc[cid]) acc[cid] = []
        acc[cid].push(doc)
        return acc
    }, {})

    return (
        <div className="space-y-6">
            <p className="text-slate-400">Sube documentos de tus ramos (PDF, DOCX, PPTX, XLSX). El sistema extraerá automáticamente el contenido para que la IA pueda generar actividades gamificadas.</p>

            {/* Mensajes de estado */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-red-400 text-lg shrink-0">⚠️</span>
                    <p className="text-red-400 text-sm">{error}</p>
                    <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
            {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                    <p className="text-green-400 text-sm">{success}</p>
                </div>
            )}

            {/* Zona de Upload */}
            <div className="bg-surface-light border border-white/5 rounded-2xl p-6 space-y-5">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <Upload className="w-5 h-5 text-accent-light" />
                    Subir Material
                </h3>

                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Ramo destino</label>
                    <select
                        value={selectedCourse}
                        onChange={e => setSelectedCourse(e.target.value)}
                        className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent"
                        aria-label="Selecciona un ramo para subir material"
                    >
                        <option value="">Selecciona un ramo</option>
                        {courses.map((c: any) => (
                            <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                        ))}
                    </select>
                </div>

                {/* Drag & Drop Zone */}
                <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => !uploading && fileRef.current?.click()}
                    className={`flex flex-col items-center justify-center w-full min-h-[180px] border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300
            ${dragOver
                            ? 'border-accent bg-accent/10 scale-[1.02]'
                            : 'border-white/10 bg-surface hover:border-accent/40 hover:bg-surface-lighter'
                        } ${uploading ? 'pointer-events-none opacity-70' : ''}`}
                >
                    {uploading ? (
                        <div className="text-center">
                            <Loader2 className="w-10 h-10 text-accent-light mx-auto mb-3 animate-spin" />
                            <p className="text-accent-light font-medium text-sm">{uploadProgress}</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex gap-3 mb-4">
                                <span className="text-3xl">📕</span>
                                <span className="text-3xl">📘</span>
                                <span className="text-3xl">📙</span>
                                <span className="text-3xl">📗</span>
                            </div>
                            <p className="text-white font-medium mb-1">Arrastra archivos aquí o haz clic para seleccionar</p>
                            <p className="text-slate-500 text-sm">PDF, DOCX, PPTX, XLSX — Máximo 20MB</p>
                        </>
                    )}
                    <input
                        ref={fileRef}
                        type="file"
                        accept={ACCEPTED_TYPES}
                        multiple
                        className="hidden"
                        onChange={e => handleUpload(e.target.files)}
                    />
                </div>
            </div>

            {/* Lista de documentos subidos */}
            {Object.keys(docsByCourse).length > 0 ? (
                <div className="space-y-6">
                    {Object.entries(docsByCourse).map(([courseId, docs]) => {
                        const course = courses.find((c: any) => c._id === courseId)
                        return (
                            <div key={courseId}>
                                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-accent-light" />
                                    {course?.name || 'Ramo'} <span className="text-slate-500 text-xs font-mono">({course?.code})</span>
                                </h3>
                                <div className="space-y-2">
                                    {(docs as any[]).map((doc: any) => (
                                        <div key={doc._id} className="bg-surface-light border border-white/5 rounded-xl overflow-hidden">
                                            <div className="flex items-center justify-between px-5 py-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="text-2xl shrink-0">{getFileIcon(doc.file_type)}</span>
                                                    <div className="min-w-0">
                                                        <p className="text-white font-medium truncate">{doc.file_name}</p>
                                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                                            <span>{formatFileSize(doc.file_size)}</span>
                                                            <span>{doc.file_type.toUpperCase()}</span>
                                                            <span>{doc.content_text.length.toLocaleString()} chars</span>
                                                            <span>{new Date(doc.uploaded_at).toLocaleDateString('es-CL')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={() => setExpandedDoc(expandedDoc === doc._id ? null : doc._id)}
                                                        className="p-2 text-slate-500 hover:text-accent-light hover:bg-accent/10 rounded-lg transition-colors"
                                                        title="Ver contenido extraído"
                                                    >
                                                        {expandedDoc === doc._id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(doc._id)}
                                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                        title="Eliminar documento"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            {expandedDoc === doc._id && (
                                                <div className="px-5 pb-4 border-t border-white/5">
                                                    <div className="mt-3 bg-surface rounded-xl p-4 max-h-64 overflow-y-auto">
                                                        <pre className="text-slate-300 text-xs whitespace-pre-wrap font-mono leading-relaxed">
                                                            {doc.content_text.substring(0, 5000)}
                                                            {doc.content_text.length > 5000 && (
                                                                <span className="text-slate-500">{'\n\n'}... [{(doc.content_text.length - 5000).toLocaleString()} caracteres más]</span>
                                                            )}
                                                        </pre>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-2">
                                                        ✨ Este contenido será usado por la IA para generar quizzes, misiones y evaluaciones automáticas.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="bg-surface-light border border-dashed border-white/10 rounded-2xl p-10 text-center">
                    <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h4 className="text-white font-semibold mb-2">Sin material aún</h4>
                    <p className="text-slate-400 text-sm">Sube documentos PDF, DOCX, PPTX o XLSX para que la IA los analice y genere actividades gamificadas.</p>
                </div>
            )}
        </div>
    )
}
