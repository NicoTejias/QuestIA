import { useState } from 'react'
import { useMutation, useQuery } from "convex/react"
import { useClerk } from "@clerk/clerk-react"
import { useNavigate } from 'react-router-dom'
import { api } from "../../convex/_generated/api"
import { BookOpen, Target, Trophy, Gift, BarChart3, LogOut, Menu, X, Settings, Sparkles, Loader2, FileText, User, Mail, ShieldCheck, HelpCircle, ArrowRightLeft } from 'lucide-react'
import FAQSection from '../components/FAQSection'
import { toast } from 'sonner'
import RamosPanel from '../components/teacher/RamosPanel'
import CrearMisionPanel from '../components/teacher/CrearMisionPanel'
import CrearRecompensaPanel from '../components/teacher/CrearRecompensaPanel'
import MaterialPanel from '../components/teacher/MaterialPanel'
import RankingDocentePanel from '../components/teacher/RankingDocentePanel'
import NotificationBell from '../components/NotificationBell'
import BetaBanner from '../components/BetaBanner'
import AdminPanel from '../components/teacher/AdminPanel'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

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

const EFEMERIDES = [
    { date: "16-09", text: "En 1810 se inició la independencia de Chile con la Primera Junta Nacional de Gobierno." },
    { date: "21-05", text: "En 1818 se firmó el Decreto de Ablución, que abolió la esclavitud en Chile." },
    { date: "05-04", text: "En 1818, Bernardo O'Higgins proclamó la independencia de Chile en Concepción." },
    { date: "02-04", text: "En 1982 se promulgó la Ley Orgánica Constitucional de Enseñanza en Chile." },
    { date: "11-03", text: "En 1818, Arturo Prat nació en Santiago, convirtiéndose en héroe de la Patria." },
    { date: "21-11", text: "En 1830 se fundó la Universidad de Chile, la primera institución de educación superior del país." },
    { date: "07-06", text: "En 1945, la UNESCO fue fundada para promover la paz y la educación a nivel mundial." },
    { date: "15-05", text: "En 1807 se fundó el Instituto Nacional, el primer establecimiento de educación pública de Chile." },
    { date: "27-02", text: "Cada 27 de febrero se recuerda el terremoto más fuerte registrado: 9.5° Richter en 1960." },
    { date: "10-08", text: "En 1811 se instaló la primera Junta de Gobierno en Chile, dando paso al período patrio." },
    { date: "18-10", text: "En 1816, Bernardo O'Higgins firmaba los Pactos de familia con Argentina para apoyo militar." },
    { date: "25-01", text: "En 1818, el combate de Chacabuco selló la independencia de Chile del dominio español." },
]

function getTodayEphemeris(): string {
    const monthDay = new Date().toLocaleDateString('es-CL', { timeZone: 'America/Santiago', month: '2-digit', day: '2-digit' }).replace('/', '-')
    const found = EFEMERIDES.find(e => e.date === monthDay)
    return found ? found.text : EFEMERIDES[Math.floor(Math.random() * EFEMERIDES.length)].text
}

export default function TeacherDashboard() {
    const { signOut } = useClerk()
    const navigate = useNavigate()
    const user = useQuery(api.users.getProfile)
    const courses = useQuery(api.courses.getMyCourses)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('inicio')
    const [selectedCourse, setSelectedCourse] = useState<any>(null)
    const [showHelp, setShowHelp] = useState(false)

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
        { id: 'desafios', label: 'Desafíos', icon: <Target className="w-5 h-5" /> },
        { id: 'ranking', label: 'Ranking', icon: <Trophy className="w-5 h-5" /> },
        { id: 'recompensas', label: 'Recompensas', icon: <Gift className="w-5 h-5" /> },
        { id: 'perfil', label: 'Mi Perfil', icon: <User className="w-5 h-5" /> },
        ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Panel Admin', icon: <ShieldCheck className="w-5 h-5 text-red-500" /> }] : []),
    ]

    if (!user) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
            </div>
        )
    }

    return (
        <div className="h-screen-dvh bg-surface flex overflow-hidden relative">
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-surface-light border-r border-white/5 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-white/5 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/20 p-1.5">
                                <Sparkles className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <span className="text-lg font-black text-white block tracking-tighter italic leading-none mb-1">
                                    Quest<span className="text-primary">IA</span>
                                </span>
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest opacity-80 italic">Panel Docente</span>
                            </div>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white" aria-label="Cerrar panel de navegación" title="Cerrar panel de navegación">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                    <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-2xl p-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-lg overflow-hidden border border-white/10 shrink-0">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span>👩‍🏫</span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-white font-bold text-xs truncate">{user.name}</p>
                                <p className="text-slate-500 text-[10px] truncate">{user.email}</p>
                            </div>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left font-medium text-sm
                                    ${activeTab === tab.id
                                        ? 'bg-accent/10 text-accent-light border border-accent/20 shadow-sm shadow-accent/5'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <div className={`${activeTab === tab.id ? 'text-accent-light' : 'text-slate-500'}`}>
                                    {tab.icon}
                                </div>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-4 border-t border-white/5 shrink-0 bg-surface-light/50 backdrop-blur-sm">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all font-bold text-xs uppercase tracking-widest mb-1">
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                    </button>
                    <div className="px-4 py-1 flex items-center justify-between opacity-30 transition-opacity">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Questia v1.1.0</span>
                        <span className="text-[9px] font-medium text-slate-600">QuestIA Identity</span>
                    </div>
                </div>
            </aside>

            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            <main className="flex-1 h-screen-dvh flex flex-col overflow-hidden">
                <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-6 flex flex-col shrink-0">
                    <div className="flex items-center justify-between py-4 md:py-6">
                        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white shrink-0" aria-label="Abrir panel de navegación" title="Abrir panel de navegación">
                                <Menu className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                            <h1 className="text-base md:text-xl font-bold text-white truncate">{tabs.find(t => t.id === activeTab)?.label}</h1>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3">
                            <button
                                onClick={() => setShowHelp(true)}
                                className="p-2 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/5"
                                title="Ayuda / FAQ"
                            >
                                <HelpCircle className="w-5 h-5" />
                            </button>
                            <BetaBanner className="hidden lg:flex" />
                            <NotificationBell />
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-6 flex-1 overflow-y-auto pb-safe">
                    {activeTab === 'inicio' && (
                        <InicioDocente
                            firstName={firstName}
                            coursesCount={coursesCount}
                            courses={courses || []}
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
                        />
                    )}
                    {activeTab === 'material' && <MaterialPanel courses={courses || []} />}
                    {activeTab === 'desafios' && <CrearMisionPanel courses={courses || []} />}
                    {activeTab === 'recompensas' && <CrearRecompensaPanel courses={courses || []} />}
                    {activeTab === 'ranking' && <RankingDocentePanel />}
                    {activeTab === 'perfil' && <PerfilPanel user={user} coursesCount={coursesCount} />}
                    {activeTab === 'admin' && user?.role === 'admin' && <AdminPanel />}
                </div>
            </main>

            {showHelp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowHelp(false)}>
                    <div className="bg-surface-light border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-accent-light" />
                                Ayuda / FAQ
                            </h2>
                            <button onClick={() => setShowHelp(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <FAQSection category="docente" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function InicioDocente({ firstName, coursesCount, courses, onSelectCourse }: { firstName: string, coursesCount: number, courses: any[], onSelectCourse: (c: any) => void }) {
    const stats = useQuery(api.analytics.getTeacherStats)
    const quizzesCompleted = stats ? `${(stats as any).totalQuizzesCompleted ?? 0}` : '...'
    const avgScore = stats ? `${Math.round((stats as any).avgQuizScore ?? 0)}%` : '...'
    const participation = stats ? `${Math.round(((stats.totalRegisteredUniqueUsers ?? 0) / (stats.totalUniqueStudents || 1)) * 100)}%` : '...'
    const ephemeris = getTodayEphemeris()

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-primary/10 via-surface-light to-surface-light border border-primary/20 rounded-2xl md:rounded-3xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-full translate-x-12 opacity-5 pointer-events-none flex items-center justify-center">
                    <Sparkles className="w-48 h-48 text-primary" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="shrink-0 hidden md:block">
                        <div className="w-24 h-24 bg-primary/20 rounded-3xl flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/20">
                            <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                            <span className="text-primary text-[10px] md:text-sm font-black uppercase tracking-widest">{getGreeting()}</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tighter italic">
                            ¡Hola <span className="text-primary">{firstName}</span>!
                        </h2>
                        <p className="text-slate-400 text-base md:text-lg max-w-xl">
                            {coursesCount === 0
                                ? 'Dale la bienvenida a QuestIA. Comienza creando tu primer ramo para gamificar tus clases.'
                                : `Tienes ${coursesCount} ${coursesCount === 1 ? 'ramo activo' : 'ramos activos'} en QuestIA. ¡Inspiramos el futuro juntos!`
                            }
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/10 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xl">📅</span>
                    </div>
                    <div>
                        <h3 className="text-amber-300 font-bold text-sm mb-1 flex items-center gap-2">
                            Efeméride Educativa
                            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                                {new Date().toLocaleDateString('es-CL', { timeZone: 'America/Santiago', day: 'numeric', month: 'long' })}
                            </span>
                        </h3>
                        <p className="text-slate-300 text-sm leading-relaxed">{ephemeris}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {[
                    { label: 'Ramos Activos', value: `${coursesCount}`, color: 'text-accent-light', bg: 'bg-accent/10', icon: '📚' },
                    { label: 'Quizzes Completados', value: quizzesCompleted, color: 'text-primary-light', bg: 'bg-primary/10', icon: '✅' },
                    { label: 'Puntaje Promedio', value: avgScore, color: 'text-green-400', bg: 'bg-green-500/10', icon: '📊' },
                    { label: 'Tasa de Participación', value: participation, color: 'text-gold', bg: 'bg-gold/10', icon: '🎯' },
                ].map((stat: any, i) => (
                    <div key={i} className="bg-surface-light border border-white/5 rounded-2xl p-4 md:p-5 transition-all hover:border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider">{stat.label}</span>
                            <span className="text-xl">{stat.icon}</span>
                        </div>
                        <p className={`text-2xl md:text-3xl font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(stats as any).totalUniqueStudents != null && [
                        { label: 'Alumnos Inscritos (Whitelist)', value: (stats as any).totalUniqueStudents ?? 0, color: 'text-slate-300', icon: '👥', sublabel: 'en whitelist' },
                        { label: 'Alumnos Registrados', value: (stats as any).totalRegisteredUniqueUsers ?? 0, color: (stats as any).totalRegisteredUniqueUsers > 0 ? 'text-green-400' : 'text-slate-500', icon: '✅', sublabel: 'que se han registrado' },
                        { label: 'Misiones Creadas', value: (stats as any).totalMissionsCreated ?? 0, color: 'text-primary-light', icon: '🎯', sublabel: 'desafíos activos' },
                        { label: 'Documentos Subidos', value: (stats as any).totalDocumentsUploaded ?? 0, color: 'text-purple-400', icon: '📄', sublabel: 'material disponible' },
                    ].map((stat: any, i) => (
                        <div key={i} className="bg-surface-light border border-white/5 rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-white/10">
                            <span className="text-3xl">{stat.icon}</span>
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
                                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                                <p className="text-[10px] text-slate-600">{stat.sublabel}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {stats && (stats as any).courseStats?.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-surface-light border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-primary" />
                            Registro por Ramo
                        </h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={(stats as any).courseStats}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value: any) => String(value).substring(0, 15) + (String(value).length > 15 ? '...' : '')} />
                                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                        cursor={{ fill: '#ffffff05' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                    <Bar dataKey="students" name="En Whitelist" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="registered" name="Registrados" fill="#4ade80" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
                    <div className="bg-surface-light border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm">
                            <Target className="w-4 h-4 text-accent" />
                            Actividad de Desafíos
                        </h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={(stats as any).courseStats}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value: any) => String(value).substring(0, 15) + (String(value).length > 15 ? '...' : '')} />
                                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                        cursor={{ fill: '#ffffff05' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                    <Bar dataKey="missions" name="Desafíos Creados" fill="#64748b" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="submissions" name="Entregas" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-surface-light border border-white/5 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-accent-light" />
                    Acceso Rápido
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                        { label: 'Crear Desafío', icon: '🎯', tab: 'desafios', color: 'from-accent/10 to-primary/5 border-accent/10' },
                        { label: 'Subir Material', icon: '📄', tab: 'material', color: 'from-purple-500/10 to-pink-500/5 border-purple-500/10' },
                        { label: 'Ver Ranking', icon: '🏆', tab: 'ranking', color: 'from-gold/10 to-orange-500/5 border-gold/10' },
                    ].map((item, i) => (
                        <button
                            key={i}
                            onClick={() => onSelectCourse(item.tab === 'ramos' ? courses[0] : null)}
                            className={`bg-gradient-to-br ${item.color} border rounded-2xl p-4 text-left hover:scale-[1.02] transition-all`}
                        >
                            <span className="text-2xl mb-2 block">{item.icon}</span>
                            <p className="text-white font-bold text-sm">{item.label}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

function PerfilPanel({ user, coursesCount }: { user: any, coursesCount: number }) {
    const navigate = useNavigate()
    const cleanAllMyWhitelists = useMutation(api.courses.cleanAllMyWhitelists)
    const fixAllStudentIds = useMutation(api.users.fixAllStudentIds)

    return (
        <div className="max-w-4xl mx-auto py-10 space-y-8">
            <div className="bg-surface-light border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="w-32 h-32 bg-gradient-to-br from-accent to-primary rounded-[2.5rem] flex items-center justify-center overflow-hidden shadow-2xl shadow-accent/20">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-4xl">👩‍🏫</span>
                    )}
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
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => navigate('/perfil')}
                        className="bg-white/5 hover:bg-white/10 text-white font-bold px-6 py-3 rounded-xl border border-white/10 transition-all flex items-center gap-2"
                    >
                        <Settings className="w-4 h-4" />
                        Configurar Perfil
                    </button>
                </div>
            </div>

            {/* Nueva sección de Mantenimiento para el Docente */}
            <div className="bg-surface-light border border-white/5 rounded-3xl p-8 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                        <ShieldCheck className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Herramientas de Mantenimiento</h3>
                        <p className="text-slate-400 text-sm">Resuelve problemas de duplicados y sincronización de alumnos</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                        <h4 className="font-bold text-white flex items-center gap-2">
                            <User className="w-4 h-4 text-accent" />
                            Limpiar Duplicados
                        </h4>
                        <p className="text-slate-500 text-xs">Busca y elimina registros duplicados en las listas de alumnos (RUTs repetidos entre secciones o con formatos distintos).</p>
                        <button
                            onClick={async () => {
                                try {
                                    const res = await cleanAllMyWhitelists();
                                    toast.success(`Limpieza completada: ${res.totalDeleted} duplicados eliminados.`);
                                } catch (e: any) {
                                    toast.error(e.message || "Error al limpiar");
                                }
                            }}
                            className="w-full bg-accent/10 hover:bg-accent/20 text-accent-light font-bold py-3 rounded-xl border border-accent/20 transition-all text-sm"
                        >
                            Optimizar Whitelist
                        </button>
                    </div>

                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                        <h4 className="font-bold text-white flex items-center gap-2">
                            <ArrowRightLeft className="w-4 h-4 text-primary-light" />
                            Forzar Sincronización
                        </h4>
                        <p className="text-slate-500 text-xs">Re-evalúa a todos los usuarios registrados para asegurar que estén inscritos en sus respectivos ramos según la whitelist.</p>
                        <button
                            onClick={async () => {
                                try {
                                    const res = await fixAllStudentIds();
                                    toast.success(`Sincronización terminada: ${res.enrolled} nuevos accesos otorgados.`);
                                } catch (e: any) {
                                    toast.error(e.message || "Error al sincronizar");
                                }
                            }}
                            className="w-full bg-primary/10 hover:bg-primary/20 text-primary-light font-bold py-3 rounded-xl border border-primary/20 transition-all text-sm"
                        >
                            Sincronizar Alumnos
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-3xl p-8">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    Panel de Administración
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    Como docente, tienes acceso a herramientas avanzadas para la creación de desafíos, gestión de recompensas y análisis de desempeño de tus alumnos mediante IA.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a href="mailto:soporte@quest.edu" className="bg-surface border border-white/10 rounded-xl p-4 text-left hover:border-white/20 transition-all group">
                        <h4 className="text-white font-bold text-sm flex items-center gap-2 mb-1">
                            <ArrowRightLeft className="w-4 h-4 text-slate-400 group-hover:text-accent-light transition-colors" />
                            Gestión de Traspasos
                        </h4>
                        <p className="text-slate-500 text-xs">Gestiona solicitudes de traspasos de puntos entre ramos.</p>
                    </a>
                </div>
            </div>
        </div>
    )
}
