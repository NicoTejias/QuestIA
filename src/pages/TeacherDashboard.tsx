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

// ======== WHITELIST con upload real ========

function WhitelistPanel({ courses }: { courses: any[] }) {
    const uploadWhitelist = useMutation(api.courses.batchUploadWhitelist)
    const fileRef = useRef<HTMLInputElement>(null)
    const [parsedData, setParsedData] = useState<string[]>([])
    const [fileName, setFileName] = useState('')
    const [selectedCourse, setSelectedCourse] = useState('')
    const [uploading, setUploading] = useState(false)
    const [success, setSuccess] = useState('')

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setFileName(file.name)

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const identifiers = results.data
                    .map((row: any) => {
                        const values = Object.values(row) as string[]
                        return values[0]?.toString().trim()
                    })
                    .filter((id: string | undefined) => id && id.length > 3)
                setParsedData(identifiers as string[])
            },
            error: () => alert('Error al leer el archivo. Verifica el formato.')
        })
    }

    const handleUpload = async () => {
        if (!selectedCourse || parsedData.length === 0) return
        setUploading(true)
        try {
            const result = await uploadWhitelist({
                course_id: selectedCourse as any,
                identifiers: parsedData,
            })
            setSuccess(`${result.added} identificadores cargados exitosamente.`)
            setParsedData([])
            setFileName('')
            setTimeout(() => setSuccess(''), 4000)
        } catch (err: any) {
            alert(err.message || 'Error al cargar la whitelist')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="max-w-2xl">
            <p className="text-slate-400 mb-6">Sube un archivo CSV con los RUTs o matrículas de tus alumnos para habilitar la inscripción automática.</p>

            {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-green-400 text-sm font-medium">{success}</p>
                </div>
            )}

            <div className="bg-surface-light border border-white/5 rounded-2xl p-6 space-y-5">
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Ramo</label>
                    <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary">
                        <option value="">Selecciona un ramo</option>
                        {courses.map((c: any) => (
                            <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Archivo CSV</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 bg-surface border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-accent/40 transition-all group">
                        <Upload className="w-8 h-8 text-slate-500 mb-2 group-hover:text-accent-light transition-colors" />
                        <span className="text-slate-400 text-sm">{fileName || 'Haz clic para subir tu archivo CSV'}</span>
                        <span className="text-slate-500 text-xs mt-1">.csv con una columna de identificadores</span>
                        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>

                {parsedData.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 text-green-400 mb-3">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-semibold text-sm">{parsedData.length} identificadores detectados</span>
                        </div>
                        <div className="bg-surface rounded-xl p-4 max-h-48 overflow-y-auto space-y-1">
                            {parsedData.map((id, i) => (
                                <div key={i} className="flex items-center justify-between text-sm py-1 px-3 rounded-lg hover:bg-white/5">
                                    <span className="text-slate-300 font-mono">{id}</span>
                                    <button onClick={() => setParsedData(parsedData.filter((_, idx) => idx !== i))} className="text-slate-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleUpload} disabled={uploading || !selectedCourse} className="mt-4 bg-accent hover:bg-accent-light text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
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
    const demoGroups = [
        {
            id: 1, members: [
                { name: 'María F.', role: 'Cerebro', category: 'Mental', emoji: '🧠' },
                { name: 'Carlos R.', role: 'Impulsor', category: 'Acción', emoji: '⚡' },
                { name: 'Ana L.', role: 'Cohesionador', category: 'Social', emoji: '🤝' },
            ]
        },
        {
            id: 2, members: [
                { name: 'Pedro S.', role: 'Monitor', category: 'Mental', emoji: '🔍' },
                { name: 'Lucía M.', role: 'Implementador', category: 'Acción', emoji: '⚙️' },
                { name: 'Diego V.', role: 'Coordinador', category: 'Social', emoji: '👑' },
            ]
        },
    ]

    return (
        <div>
            <p className="text-slate-400 mb-6">Genera grupos equilibrados automáticamente basándose en los perfiles Belbin de tus alumnos.</p>
            <div className="flex flex-wrap gap-4 mb-8">
                <select className="bg-surface-light border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary">
                    <option>Selecciona un ramo</option>
                </select>
                <input type="number" placeholder="Alumnos por grupo" defaultValue={3} className="bg-surface-light border border-white/10 rounded-xl px-4 py-3 text-white w-48 focus:outline-none focus:border-primary" />
                <button className="bg-gradient-to-r from-primary to-accent text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Generar Grupos
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {demoGroups.map(group => (
                    <div key={group.id} className="bg-surface-light border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-accent-light" /> Grupo {group.id}</h3>
                        <div className="space-y-3">
                            {group.members.map((m, i) => (
                                <div key={i} className="flex items-center justify-between bg-surface rounded-xl px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{m.emoji}</span>
                                        <span className="text-white font-medium">{m.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-primary-light text-sm font-semibold block">{m.role}</span>
                                        <span className="text-slate-500 text-xs">{m.category}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function RankingDocentePanel() {
    return (
        <div>
            <p className="text-slate-400 mb-6">Vista del ranking de todos tus ramos. Se actualizará automáticamente cuando tus alumnos completen misiones.</p>
            <div className="bg-surface-light border border-dashed border-white/10 rounded-2xl p-10 text-center">
                <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h4 className="text-white font-semibold mb-2">Ranking disponible pronto</h4>
                <p className="text-slate-400 text-sm">Crea un ramo y agrega alumnos para ver el ranking en tiempo real.</p>
            </div>
        </div>
    )
}

function AnaliticasPanel() {
    return (
        <div>
            <p className="text-slate-400 mb-6">Métricas de rendimiento y participación de tus alumnos.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'Total Alumnos', value: '—', color: 'text-accent-light' },
                    { label: 'Misiones Completadas', value: '—', color: 'text-primary-light' },
                    { label: 'Canjes Realizados', value: '—', color: 'text-gold' },
                ].map((s, i) => (
                    <div key={i} className="bg-surface-light border border-white/5 rounded-2xl p-6 text-center">
                        <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-slate-400 text-sm mt-1">{s.label}</p>
                    </div>
                ))}
            </div>
            <div className="bg-surface-light border border-white/5 rounded-2xl p-8 flex items-center justify-center min-h-[200px]">
                <div className="text-center text-slate-500">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="font-semibold">Gráficos de rendimiento</p>
                    <p className="text-sm">Se poblarán automáticamente con datos de tus alumnos.</p>
                </div>
            </div>
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
