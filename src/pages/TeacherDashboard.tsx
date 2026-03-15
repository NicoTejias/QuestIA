import { useState } from 'react'
import { useQuery } from "convex/react"
import { useClerk } from "@clerk/clerk-react"
import { useNavigate } from 'react-router-dom'
import { api } from "../../convex/_generated/api"
import { BookOpen, Target, Trophy, Gift, Users, BarChart3, LogOut, Menu, X, Settings, FileSpreadsheet, ArrowRightLeft, Sparkles, Loader2, FileText, User, Mail } from 'lucide-react'
import RamosPanel from '../components/teacher/RamosPanel'
import CrearMisionPanel from '../components/teacher/CrearMisionPanel'
import CrearRecompensaPanel from '../components/teacher/CrearRecompensaPanel'
import WhitelistPanel from '../components/teacher/WhitelistPanel'
import MaterialPanel from '../components/teacher/MaterialPanel'
import AnaliticasPanel from '../components/teacher/AnaliticasPanel'
import RankingDocentePanel from '../components/teacher/RankingDocentePanel'
import TraspasosPanel from '../components/teacher/TraspasosPanel'
import GruposPanel from '../components/teacher/GruposPanel'
import NotificationBell from '../components/NotificationBell'
import BetaBanner from '../components/BetaBanner'

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
    const { signOut } = useClerk()
    const navigate = useNavigate()
    const user = useQuery(api.users.getProfile)
    const courses = useQuery(api.courses.getMyCourses)
    const stats = useQuery(api.analytics.getTeacherStats)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('inicio')
    const [selectedCourse, setSelectedCourse] = useState<any>(null)

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
        { id: 'traspasos', label: 'Gestión de Traspasos', icon: <ArrowRightLeft className="w-5 h-5" /> },
        { id: 'analiticas', label: 'Analíticas', icon: <BarChart3 className="w-5 h-5" /> },
        { id: 'perfil', label: 'Mi Perfil', icon: <User className="w-5 h-5" /> },
    ]

    if (!user) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
            </div>
        )
    }

    console.log("👩‍🏫 TeacherDashboard Render:", { 
        userId: user._id, 
        coursesCount: courses?.length, 
        hasStats: !!stats 
    });

    return (
        <div className="min-h-screen bg-surface flex pb-safe">

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-surface-light border-r border-white/5 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center">
                                <Settings className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <span className="text-lg font-bold text-white block tracking-tight">Quest</span>
                                <span className="text-xs text-slate-500">Panel Docente</span>
                            </div>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white" aria-label="Cerrar panel de navegación" title="Cerrar panel de navegación">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-4">
                    {/* Perfil Docente */}
                    <div className="bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20 rounded-2xl p-4 mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center text-lg overflow-hidden border border-white/10 shrink-0">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span>👩‍🏫</span>
                                )}
                            </div>
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
                <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between pt-safe">

                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white shrink-0" aria-label="Abrir panel de navegación" title="Abrir panel de navegación">
                            <Menu className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                        <h1 className="text-base md:text-xl font-bold text-white truncate">{tabs.find(t => t.id === activeTab)?.label}</h1>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <BetaBanner className="hidden lg:flex" />
                        <NotificationBell />
                    </div>
                </header>

                <div className="p-6">
                    {activeTab === 'inicio' && (
                        <InicioDocente
                            firstName={firstName}
                            coursesCount={coursesCount}
                            courses={courses || []}
                            stats={stats}
                            onSelectCourse={(c) => {
                                setSelectedCourse(c)
                                setActiveTab('ramos')
                            }}
                        />
                    )}
                    {activeTab === 'ramos' && (
                        <RamosPanel
                            courses={courses || []}
                            selectedCourse={selectedCourse}
                            setSelectedCourse={setSelectedCourse}
                            currentUserId={user._id}
                        />
                    )}
                    {activeTab === 'material' && <MaterialPanel courses={courses || []} />}
                    {activeTab === 'misiones' && <CrearMisionPanel courses={courses || []} />}
                    {activeTab === 'recompensas' && <CrearRecompensaPanel courses={courses || []} />}
                    {activeTab === 'whitelist' && <WhitelistPanel courses={courses || []} />}
                    {activeTab === 'grupos' && <GruposPanel />}
                    {activeTab === 'traspasos' && <TraspasosPanel />}
                    {activeTab === 'ranking' && <RankingDocentePanel />}
                    {activeTab === 'analiticas' && <AnaliticasPanel />}
                    {activeTab === 'perfil' && <PerfilPanel user={user} coursesCount={coursesCount} />}
                </div>
            </main>
        </div>
    )
}

// ======== INICIO con saludo personalizado ========

function InicioDocente({ firstName, coursesCount, courses, stats, onSelectCourse }: { firstName: string, coursesCount: number, courses: any[], stats: any, onSelectCourse: (c: any) => void }) {
    return (
        <div className="space-y-8">
            {/* Saludo Personalizado */}
            <div className="bg-gradient-to-r from-accent/10 via-primary/5 to-surface-light border border-accent/20 rounded-2xl md:rounded-3xl p-6 md:p-8">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-accent-light" />
                    <span className="text-accent-light text-[10px] md:text-sm font-medium">{getGreeting()}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                    Hola {firstName} 👋
                </h2>
                <p className="text-slate-400 text-base md:text-lg">
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
                    { label: 'Misiones Creadas', value: stats?.totalMissionsCreated ?? '...', color: 'text-primary-light', bg: 'bg-primary/10', icon: <Target className="w-6 h-6" /> },
                    { label: 'Alumnos Inscritos', value: stats?.totalStudents ?? '...', color: 'text-gold', bg: 'bg-gold/10', icon: <Users className="w-6 h-6" /> },
                ].map((stat, i) => (
                    <div key={i} className="bg-surface-light border border-white/5 rounded-2xl p-5 transition-all hover:border-white/10">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-slate-400 font-medium">{stat.label}</span>
                            <div className={`${stat.bg} p-2 rounded-xl ${stat.color}`}>{stat.icon}</div>
                        </div>
                        <p className={`text-3xl font-black ${stat.color}`}>
                            {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                        </p>
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
                            <div key={c._id} onClick={() => onSelectCourse(c)} className="bg-surface-light border border-white/5 rounded-2xl p-6 hover:border-accent/30 transition-all group cursor-pointer">
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

// Extracted: CourseDetail

// ======== RAMOS con creación real ========

// Extracted: RamosPanel

// ======== MISIONES con creación real + Quiz IA ========

// Extracted: CrearMisionPanel

// ======== RECOMPENSAS con creación real ========

// Extracted: CrearRecompensaPanel
// ======== WHITELIST con upload real (CSV + XLSX) ========

// Extracted: WhitelistPanel

// ======== Sub-componentes con datos demo (se conectarán cuando haya datos) ========

// Extracted: GruposPanel

// Extracted: RankingDocentePanel

// Extracted: AnaliticasPanel

// ======== MATERIAL — Upload de Documentos ========

// Extracted: MaterialPanel

// Extracted: TraspasosPanel


function PerfilPanel({ user, coursesCount }: { user: any, coursesCount: number }) {
    const navigate = useNavigate()
    return (
        <div className="max-w-4xl mx-auto py-10 space-y-8">
            <div className="bg-surface-light border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="w-32 h-32 bg-gradient-to-br from-accent to-primary rounded-[2.5rem] flex items-center justify-center text-4xl shadow-2xl shadow-accent/20">
                    👩‍🏫
                </div>
                <div className="text-center md:text-left flex-1">
                    <h2 className="text-3xl font-black text-white mb-1">{user.name}</h2>
                    <p className="text-accent-light font-bold uppercase tracking-widest text-sm mb-4">Docente del Sistema</p>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                        <div className="bg-black/20 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-accent" />
                            <span className="text-white font-bold">{coursesCount} Ramos Activos</span>
                        </div>
                        <div className="bg-black/20 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-500" />
                            <span className="text-slate-400 text-sm">{user.email}</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/perfil')}
                    className="bg-white/5 hover:bg-white/10 text-white font-bold px-6 py-3 rounded-xl border border-white/10 transition-all flex items-center gap-2"
                >
                    <Settings className="w-4 h-4" />
                    Configurar Perfil
                </button>
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-3xl p-8">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    Panel de Administración
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                    Como docente, tienes acceso a herramientas avanzadas para la creación de misiones, gestión de recompensas y análisis de desempeño de tus alumnos mediante IA.
                </p>
            </div>
        </div>
    )
}

