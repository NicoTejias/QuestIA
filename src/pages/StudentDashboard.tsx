import { useState, useEffect } from 'react'
import { useQuery, useMutation, usePaginatedQuery } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { useNavigate, Link } from 'react-router-dom'
import { api } from "../../convex/_generated/api"
import {
    BookOpen, Target, Trophy, Gift, User, LogOut, Menu, X,
    BarChart3, Brain, Coins, ChevronRight, Flame,
    Star, Loader2, ArrowRightLeft,
    AlertCircle, PlayCircle, Bell, BellOff, Info, Settings, Sparkles, Mail, GraduationCap
} from 'lucide-react'
import { toast } from 'sonner'
import NotificationBell from '../components/NotificationBell'
import BetaBanner from '../components/BetaBanner'

// Utilidad para el saludo
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

export default function StudentDashboard() {
    const { signOut } = useAuthActions()
    const navigate = useNavigate()
    const user = useQuery(api.users.getProfile)
    const courses = useQuery(api.courses.getMyCourses)

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('inicio')
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
    const [showTransferModal, setShowTransferModal] = useState(false)
    const [showQuizPlayer, setShowQuizPlayer] = useState<any>(null)

    const handleLogout = async () => {
        await signOut()
        navigate('/')
    }

    const [showCompleteProfile, setShowCompleteProfile] = useState(false)

    // Auto-enrollment logic
    const autoEnroll = useMutation(api.users.autoEnroll)
    useEffect(() => {
        if (user && user.role === 'student') {
            if (!user.student_id) {
                setShowCompleteProfile(true)
            } else {
                autoEnroll().catch(() => { })
            }
        }
    }, [user])

    if (!user) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        )
    }

    const userName = user?.name || 'Alumno'
    const firstName = getFirstName(user?.name)
    const belbinRole = user?.belbin_profile?.role_dominant || 'Sin determinar'

    // Totales agregados de todos los ramos
    const totalRankingPoints = courses?.reduce((sum: number, c: any) => sum + (c.ranking_points || c.total_points || 0), 0) || 0
    const totalSpendablePoints = courses?.reduce((sum: number, c: any) => sum + (c.spendable_points || c.total_points || 0), 0) || 0

    const tabs = [
        { id: 'inicio', label: 'Inicio', icon: <BarChart3 className="w-5 h-5" /> },
        { id: 'notificaciones', label: 'Notificaciones', icon: <Bell className="w-5 h-5" /> },
        { id: 'misiones', label: 'Misiones', icon: <Target className="w-5 h-5" /> },
        { id: 'ranking', label: 'Ranking', icon: <Trophy className="w-5 h-5" /> },
        { id: 'tienda', label: 'Tienda', icon: <Gift className="w-5 h-5" /> },
        { id: 'perfil', label: 'Mi Perfil', icon: <User className="w-5 h-5" /> },
    ]

    return (
        <div className="min-h-screen bg-surface flex text-slate-200">
            {showCompleteProfile && (
                <CompleteProfileModal 
                    user={user} 
                    onComplete={() => setShowCompleteProfile(false)} 
                />
            )}
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-surface-light border-r border-white/5 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold text-white tracking-tight">GestiónDocente</span>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white" title="Cerrar panel de navegación">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-6">
                    {/* User Mini Card */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center text-xl shadow-inner">
                                {belbinRole === 'Cerebro' ? '🧠' : belbinRole === 'Impulsor' ? '⚡' : '🎓'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-white font-bold text-sm truncate">{userName}</p>
                                <p className="text-primary-light text-xs font-medium uppercase tracking-wider">{belbinRole}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="bg-black/20 rounded-xl p-2 border border-white/5">
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Ranking</p>
                                <div className="flex items-center gap-1">
                                    <Trophy className="w-3 h-3 text-gold" />
                                    <span className="text-xs font-black text-white">{totalRankingPoints.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="bg-black/20 rounded-xl p-2 border border-white/5">
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Canjeable</p>
                                <div className="flex items-center gap-1">
                                    <Coins className="w-3 h-3 text-gold" />
                                    <span className="text-xs font-black text-white">{totalSpendablePoints.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-orange-500/10 to-gold/10 rounded-xl p-2.5 border border-orange-500/20 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-2">
                                <Flame className="w-4 h-4 text-orange-500 mb-0.5" />
                                <span className="text-[10px] text-orange-400 font-bold uppercase">Racha Actual</span>
                            </div>
                            <span className="text-sm font-black text-orange-400">{user.daily_streak || 0} 🔥</span>
                        </div>

                        {user?.ice_cubes !== undefined && user.ice_cubes > 0 && (
                            <div className="mt-2 bg-cyan-500/10 rounded-xl p-2.5 border border-cyan-500/20 flex items-center justify-between shadow-sm animate-in zoom-in duration-300">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-cyan-400 rounded-sm rotate-45 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                                    <span className="text-[10px] text-cyan-400 font-bold uppercase">Escudos Racha</span>
                                </div>
                                <span className="text-sm font-black text-cyan-400">x{user.ice_cubes}</span>
                            </div>
                        )}
                    </div>

                    <nav className="space-y-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSelectedCourseId(null); setSidebarOpen(false) }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-medium group
                                    ${activeTab === tab.id && !selectedCourseId
                                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <span className={`${activeTab === tab.id && !selectedCourseId ? 'text-white' : 'group-hover:text-primary-light'}`}>
                                    {tab.icon}
                                </span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div className="pt-4">
                        <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Acciones Rápidas</p>
                        <button
                            onClick={() => setShowTransferModal(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-accent-light hover:bg-accent/5 transition-all font-medium group"
                        >
                            <ArrowRightLeft className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                            Transferir Puntos
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all font-medium">
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {sidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* Main Content */}
            <main className="flex-1 min-h-screen flex flex-col">
                <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white" title="Abrir panel de navegación">
                            <Menu className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white capitalize leading-none mb-1">
                                {selectedCourseId ? 'Detalle del Ramo' : tabs.find(t => t.id === activeTab)?.label}
                            </h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                {selectedCourseId ? 'Contenido y Desafíos' : 'Panel de Control'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <BetaBanner className="hidden md:flex" />
                        <NotificationBell />
                        <div className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-2 border border-white/10">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-slate-500 font-bold leading-none mb-1">SALDO ACTUAL</span>
                                <span className="text-gold font-black text-sm leading-none">{totalSpendablePoints.toLocaleString()} PTS</span>
                            </div>
                            <div className="w-8 h-8 bg-gold/20 rounded-lg flex items-center justify-center">
                                <Coins className="w-4 h-4 text-gold" />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-6 flex-1 overflow-y-auto">
                    {selectedCourseId ? (
                        <CourseDetailView
                            courseId={selectedCourseId as any}
                            onBack={() => setSelectedCourseId(null)}
                            onPlayQuiz={(quiz: any) => setShowQuizPlayer(quiz)}
                        />
                    ) : (
                        <>
                            {activeTab === 'inicio' && <DashboardHome
                                courses={courses || []}
                                totalRanking={totalRankingPoints}
                                firstName={firstName}
                                onSelectCourse={(id) => setSelectedCourseId(id)}
                            />}
                            {activeTab === 'notificaciones' && <NotificacionesPanel />}
                            {activeTab === 'misiones' && <MisionesPanel courses={courses || []} onSelectCourse={(id: string) => { setSelectedCourseId(id); setActiveTab('ramos') }} />}
                            {activeTab === 'ranking' && <RankingPanel courses={courses || []} />}
                            {activeTab === 'tienda' && <TiendaPanel courses={courses || []} />}
                            {activeTab === 'perfil' && <PerfilPanel user={user} totalPoints={totalRankingPoints} belbinRole={belbinRole} />}
                        </>
                    )}
                </div>
            </main>

            {/* Modals */}
            {showTransferModal && <TransferModal onClose={() => setShowTransferModal(false)} courses={courses || []} />}
            {showQuizPlayer && <QuizPlayer quiz={showQuizPlayer} onClose={() => setShowQuizPlayer(null)} />}
        </div>
    )
}

// ======== Componentes de Vistas ========

function DashboardHome({ courses, totalRanking, firstName, onSelectCourse }: { courses: any[], totalRanking: number, firstName: string, onSelectCourse: (id: string) => void }) {
    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Hero Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-white/10 rounded-[2rem] p-10">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary/20 rounded-full blur-[80px]"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="px-3 py-1 bg-primary/20 rounded-full text-xs font-black text-primary-light uppercase tracking-widest border border-primary/20">
                                {getGreeting()}
                            </div>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-[1.1]">
                            ¡Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-accent-light">{firstName}</span>!
                        </h2>
                        <p className="text-slate-400 text-lg max-w-md leading-relaxed">
                            {courses.length === 0
                                ? 'Tu aventura está por comenzar. Espera a que tu docente te inscriba en un ramo.'
                                : `Hoy es un gran día para aprender. Tienes ${totalRanking.toLocaleString()} puntos de ranking acumulados.`
                            }
                        </p>
                    </div>
                    <div className="flex flex-col items-center p-6 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 shadow-2xl">
                        <div className="relative mb-4">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="364" strokeDashoffset={364 - (364 * 0.75)} className="text-primary transition-all duration-1000" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <Trophy className="w-8 h-8 text-gold mb-1" />
                                <span className="text-2xl font-black text-white leading-none">#2</span>
                            </div>
                        </div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Nivel 14</p>
                    </div>
                </div>
            </div>

            {/* Grid de Ramos */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-black text-white">Mis Ramos</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">ORDENAR POR</span>
                        <select className="bg-white/5 border border-white/10 rounded-lg text-xs font-bold px-3 py-1.5 text-slate-300 outline-none" title="Ordenar lista de ramos">
                            <option>RECIENTES</option>
                            <option>PUNTOS</option>
                        </select>
                    </div>
                </div>

                {courses.length === 0 ? (
                    <div className="bg-white/5 border border-dashed border-white/10 rounded-[2rem] p-16 text-center max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <BookOpen className="w-10 h-10 text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Sin ramos inscritos</h3>
                        <p className="text-slate-400 max-w-xs mx-auto">
                            Comunícate con tu docente si tu RUT debería estar en la lista de alumnos.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {courses.map((course: any) => (
                            <div
                                key={course._id}
                                onClick={() => onSelectCourse(course._id)}
                                className="group bg-surface-light border border-white/5 rounded-3xl p-6 hover:bg-white/5 hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                                    <BookOpen className="w-16 h-16 text-primary" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary-light">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-slate-500 font-black uppercase mb-1">CÓDIGO</span>
                                            <span className="text-xs font-mono text-white/50">{course.code}</span>
                                        </div>
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-6 group-hover:text-primary-light transition-colors line-clamp-1">{course.name}</h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 font-black uppercase mb-1">RANKING</span>
                                            <div className="flex items-center gap-2">
                                                <Trophy className="w-4 h-4 text-gold" />
                                                <span className="text-lg font-black text-white">{(course.ranking_points || course.total_points || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col border-l border-white/5 pl-4">
                                            <span className="text-[10px] text-slate-500 font-black uppercase mb-1">CANJEABLE</span>
                                            <div className="flex items-center gap-2">
                                                <Coins className="w-4 h-4 text-accent" />
                                                <span className="text-lg font-black text-white">{(course.spendable_points || course.total_points || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center justify-between pt-6 border-t border-white/5">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-6 h-6 rounded-full border-2 border-surface-light bg-slate-700"></div>
                                            ))}
                                            <div className="w-6 h-6 rounded-full border-2 border-surface-light bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary-light">+12</div>
                                        </div>
                                        <span className="text-xs font-black text-primary-light flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            ACCEDER <ChevronRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

function CourseDetailView({ courseId, onBack, onPlayQuiz }: { courseId: any, onBack: () => void, onPlayQuiz: (q: any) => void }) {
    const course = useQuery(api.courses.getCourseById, { courseId })
    const quizzes = useQuery(api.quizzes.getQuizzesByCourse, { course_id: courseId })
    const missions = useQuery(api.missions.getMissions, { course_id: courseId })
    const completeMission = useMutation(api.missions.completeMission)

    const [completing, setCompleting] = useState<string | null>(null)

    const handleCompleteMission = async (missionId: string) => {
        setCompleting(missionId)
        try {
            await completeMission({ mission_id: missionId as any })
            toast.success("¡Misión completada! Puntos obtenidos.")
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setCompleting(null)
        }
    }

    if (!course) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group mb-4"
            >
                <div className="p-1.5 bg-white/5 rounded-lg group-hover:bg-white/10">
                    <X className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">Volver a Ramos</span>
            </button>

            <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px]"></div>
                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-primary/20 text-primary-light text-[10px] font-black rounded-full border border-primary/20 tracking-tighter uppercase">{course.code}</span>
                            <span className="text-slate-500 font-medium">•</span>
                            <span className="text-slate-400 text-sm font-medium">Impartido por {course.teacher_name || 'Docente'}</span>
                        </div>
                        <h2 className="text-4xl font-black text-white mb-4">{course.name}</h2>
                        <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">{course.description || 'Sin descripción pormenorizada.'}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Columna Quizzes */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <PlayCircle className="w-6 h-6 text-accent" />
                            Quizzes Disponibles
                        </h3>
                        <span className="px-2.5 py-1 bg-accent/10 text-accent-light text-[10px] font-black rounded-lg">{quizzes?.length || 0} RETOS</span>
                    </div>

                    <div className="space-y-4">
                        {quizzes?.map((q: any) => (
                            <div key={q._id} className="group bg-surface-light border border-white/5 rounded-3xl p-5 hover:bg-white/5 hover:border-accent/40 transition-all flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-accent-light group-hover:bg-accent/20 transition-colors">
                                        {q.quiz_type === 'flashcard' ? <Brain className="w-7 h-7" /> : <PlayCircle className="w-7 h-7" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white group-hover:text-accent-light transition-colors">{q.title}</h4>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                                <Target className="w-3 h-3" /> {q.num_questions} PREG.
                                            </span>
                                            <span className={`text-[10px] font-bold uppercase ${q.difficulty === 'dificil' ? 'text-red-400' : q.difficulty === 'medio' ? 'text-orange-400' : 'text-green-400'}`}>
                                                {q.difficulty}
                                            </span>
                                            <span className="text-[10px] font-bold text-gold flex items-center gap-1 bg-gold/10 px-1.5 py-0.5 rounded-md border border-gold/20">
                                                <Star className="w-3 h-3 fill-gold" />
                                                HASTA {(q.num_questions || 5) * (q.difficulty === 'dificil' ? 20 : q.difficulty === 'medio' ? 15 : 10)} PTS
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex flex-col items-end mr-4">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Intentos</span>
                                            <span className={`text-xs font-black ${q.attempts_count >= q.max_attempts ? 'text-red-400' : 'text-accent-light'}`}>
                                                {q.attempts_count} / {q.max_attempts}
                                            </span>
                                        </div>
                                        {q.completed && (
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mejor Score</span>
                                                <span className="text-xs font-black text-white">
                                                    {q.score}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => q.can_take && onPlayQuiz(q)}
                                        disabled={!q.can_take}
                                        className={`font-black text-[10px] tracking-widest px-5 py-2.5 rounded-xl transition-all shadow-lg 
                                            ${!q.can_take
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20 cursor-default shadow-none'
                                                : q.completed
                                                    ? 'bg-white/10 text-white border border-white/10 hover:bg-white/20'
                                                    : 'bg-accent text-white hover:scale-105 active:scale-95 shadow-accent/20'}`}
                                    >
                                        {!q.can_take ? 'COMPLETADO' : q.completed ? 'REINTENTAR' : '¡JUGAR!'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Columna Misiones */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <Target className="w-6 h-6 text-primary" />
                            Misiones del Ramo
                        </h3>
                        <span className="px-2.5 py-1 bg-primary/10 text-primary-light text-[10px] font-black rounded-lg">{missions?.length || 0} ACTIVAS</span>
                    </div>

                    <div className="space-y-4">
                        {missions?.map((m: any) => (
                            <div key={m._id} className="group bg-surface-light border border-white/5 rounded-3xl p-5 hover:bg-white/5 hover:border-primary/40 transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary-light">
                                            <Flame className="w-6 h-6" />
                                        </div>
                                        <div className="flex flex-col">
                                            <h4 className="font-bold text-white group-hover:text-primary-light transition-colors">{m.title}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-[200px]">{m.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[9px] uppercase font-black tracking-widest text-slate-500">Recompensa</span>
                                        <div className="flex items-center gap-1 text-gold font-black bg-gold/10 px-2.5 py-1 rounded-lg border border-gold/20 shadow-sm">
                                            <Star className="w-3.5 h-3.5 fill-gold" />
                                            <span className="text-xs">+{m.points} PTS</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleCompleteMission(m._id)}
                                    disabled={completing === m._id || m.completed}
                                    className={`w-full font-bold text-xs py-2 rounded-xl border transition-all uppercase tracking-widest
                                        ${m.completed
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : 'bg-slate-800 text-slate-400 border-white/5 hover:bg-primary/20 hover:text-white hover:border-primary/20'}`}
                                >
                                    {completing === m._id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : m.completed ? 'COMPLETADA' : 'COMPLETAR MISIÓN'}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}

function MisionesPanel({ courses, onSelectCourse }: { courses: any[], onSelectCourse: (id: string) => void }) {
    console.log(courses.length); // use it to avoid lint
    return (
        <div className="max-w-4xl mx-auto py-10 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
                <Target className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-black text-white mb-4">Misiones Activas</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8">
                Selecciona un ramo para ver tus desafíos pendientes y ganar recompensas.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
                {(courses || []).map(c => (
                    <button
                        key={c._id}
                        onClick={() => onSelectCourse(c._id)}
                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:border-primary/50 text-white font-bold transition-all"
                    >
                        {c.name}
                    </button>
                ))}
            </div>
        </div>
    )
}

function RankingPanel({ courses }: { courses: any[] }) {
    const [selectedId, setSelectedId] = useState<string>(courses?.[0]?._id || '')
    const [isGlobal, setIsGlobal] = useState(false)

    // Vista Local (Paginada)
    const { results: leaderboard, status: localStatus, loadMore } = usePaginatedQuery(
        api.missions.getLeaderboard,
        (selectedId && !isGlobal) ? { course_id: selectedId as any } : 'skip',
        { initialNumItems: 10 }
    )

    // Vista Global (Top 100)
    const globalLeaderboard = useQuery(api.courses.getGlobalRanking,
        (selectedId && isGlobal) ? { course_id: selectedId as any } : 'skip'
    )

    const currentLeaderboard = isGlobal ? (globalLeaderboard || []) : leaderboard
    const status = isGlobal ? (globalLeaderboard ? "Loaded" : "LoadingFirstPage") : localStatus

    return (
        <div className="max-w-4xl mx-auto py-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 text-center lg:text-left">
                <div className="flex items-center gap-6 justify-center lg:justify-start">
                    <Trophy className="w-16 h-16 text-gold" />
                    <div>
                        <h2 className="text-3xl font-black text-white mb-1">Salón de la Fama</h2>
                        <p className="text-slate-400">Compite con tus compañeros y alcanza la cima del ranking.</p>
                    </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                    <select
                        title="Seleccionar Ramo"
                        aria-label="Seleccionar Ramo"
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="bg-transparent border-none rounded-2xl px-4 py-2 font-bold text-white outline-none"
                    >
                        {courses.length === 0 && <option value="">Sin Ramos</option>}
                        {courses.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                    
                    <div className="flex bg-black/40 rounded-xl p-1 shrink-0">
                        <button 
                            onClick={() => setIsGlobal(false)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isGlobal ? 'bg-primary text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                            Mi Sección
                        </button>
                        <button 
                            onClick={() => setIsGlobal(true)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isGlobal ? 'bg-accent text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                            Ranking Global
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-surface-light rounded-3xl overflow-hidden border border-white/10">
                {status === "LoadingFirstPage" ? (
                    <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
                ) : currentLeaderboard.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 text-center">
                        <Trophy className="w-12 h-12 text-slate-600 mb-4" />
                        <h3 className="text-white font-semibold">Sin alumnos inscritos</h3>
                        <p className="text-slate-400 text-sm mt-1">Aún no hay puntos en este ramo.</p>
                    </div>
                ) : (
                    <>
                        {currentLeaderboard.map((student: any, i: number) => (
                            <div key={student._id || student.userId} className={`flex items-center justify-between p-6 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${i < 3 ? 'bg-white/[0.02]' : ''}`}>
                                <div className="flex items-center gap-6 overflow-hidden">
                                    <span className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg
                                        ${i === 0 ? 'bg-gold/20 text-gold shadow-lg shadow-gold/20' :
                                            i === 1 ? 'bg-slate-400/20 text-slate-300' :
                                                i === 2 ? 'bg-amber-700/20 text-amber-600' :
                                                    'bg-white/5 text-slate-500'}`}>
                                        #{i + 1}
                                    </span>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-white text-lg truncate">{student.name}</h4>
                                        <div className="flex flex-wrap items-center gap-3 mt-1">
                                            <div className="flex items-center gap-1.5">
                                                <Brain className="w-3 h-3 text-slate-500" />
                                                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{student.belbin || "Sin determinar"}</span>
                                            </div>
                                            {isGlobal && (
                                                <>
                                                    <span className="text-slate-700">•</span>
                                                    <span className="text-[10px] font-black text-primary-light uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded border border-primary/10">
                                                        {student.section}
                                                    </span>
                                                    <span className="text-slate-700">•</span>
                                                    <span className="text-[10px] font-medium text-slate-500 truncate" title={student.teacherName}>
                                                        {student.teacherName}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl border border-white/5 shrink-0 ml-4">
                                    <Coins className="w-5 h-5 text-gold" />
                                    <span className="font-black text-xl text-white">{(student.points || student.ranking_points || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                        {status === "CanLoadMore" && !isGlobal && (
                            <div className="p-4 border-t border-white/5 text-center">
                                <button
                                    onClick={() => loadMore(10)}
                                    className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                                >
                                    Cargar más...
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

function NotificacionesPanel() {
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

function TiendaPanel({ courses }: { courses: any[] }) {
    const [selectedId, setSelectedId] = useState<string>(courses?.[0]?._id || '')
    const { results: rewards, status, loadMore } = usePaginatedQuery(
        api.rewards.getRewardsByCourse,
        selectedId ? { course_id: selectedId as any } : 'skip',
        { initialNumItems: 8 }
    )
    const redeemReward = useMutation(api.rewards.redeemReward)
    const [processing, setProcessing] = useState<string | null>(null)

    const handleRedeem = async (rewardId: string) => {
        if (!confirm('¿Estás seguro de canjear esta recompensa?')) return
        setProcessing(rewardId)
        try {
            await redeemReward({ reward_id: rewardId as any })
            toast.success('¡Canje exitoso! Verás esto reflejado pronto en el sistema.')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setProcessing(null)
        }
    }

    return (
        <div className="max-w-6xl mx-auto py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h2 className="text-3xl font-black text-white mb-2">Tienda de Canje</h2>
                    <p className="text-slate-400">Utiliza tus puntos para obtener beneficios académicos y cosméticos.</p>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        title="Seleccionar Ramo"
                        aria-label="Seleccionar Ramo"
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="bg-surface-light border border-white/10 rounded-2xl px-6 py-3 font-bold text-white outline-none focus:border-primary/50 transition-all"
                    >
                        {courses.length === 0 && <option value="">Sin Ramos</option>}
                        {courses.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {status === "LoadingFirstPage" ? (
                    <div className="col-span-full py-12 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>
                ) : rewards.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-surface-light border border-dashed border-white/10 rounded-3xl">
                        <Gift className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-white font-semibold mb-1">Sin Recompensas</h3>
                        <p className="text-slate-400 text-sm">Tu docente aún no ha agregado recompensas para este ramo.</p>
                    </div>
                ) : (
                    <>
                        {rewards.map((r: any) => (
                            <div key={r._id} className="group bg-surface-light border border-white/5 rounded-[2rem] p-8 hover:bg-white/5 hover:border-primary/50 transition-all overflow-hidden relative">
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-accent/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Gift className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{r.name}</h3>
                                <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-6">{r.stock} DISPONIBLES</p>

                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Coins className="w-5 h-5 text-gold" />
                                        <span className="text-2xl font-black text-white">{r.cost}</span>
                                    </div>
                                    <button
                                        onClick={() => handleRedeem(r._id)}
                                        disabled={processing === r._id}
                                        title={`Canjear ${r.name}`}
                                        className="bg-primary text-white font-black text-xs px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {processing === r._id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'CANJEAR'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
            {status === "CanLoadMore" && (
                <div className="mt-12 text-center">
                    <button
                        onClick={() => loadMore(8)}
                        className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl border border-white/10 transition-all uppercase tracking-widest text-xs"
                    >
                        Cargar más recompensas
                    </button>
                </div>
            )}
        </div>
    )
}




function QuizPlayer({ quiz, onClose }: { quiz: any, onClose: () => void }) {
    const submitQuiz = useMutation(api.quizzes.submitQuiz)
    const [currentIdx, setCurrentIdx] = useState(0)
    const [score, setScore] = useState(0)
    const [finished, setFinished] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [quizResult, setQuizResult] = useState<any>(null)

    // For Match quiz
    const [selectedA, setSelectedA] = useState<number | null>(null)
    const [matchedPairs, setMatchedPairs] = useState<number[]>([])

    // For Flashcards
    const [flipped, setFlipped] = useState(false)

    // For Multiple Choice
    const [selectedOption, setSelectedOption] = useState<number | null>(null)

    const isMatch = quiz.quiz_type === 'match'
    const isFlashcard = quiz.quiz_type === 'flashcard'
    const isMultipleChoice = !isMatch && !isFlashcard
    const questions = quiz.questions || []

    if (questions.length === 0) {
        return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-surface border border-white/10 p-8 rounded-[2rem] max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Quiz Vacío</h2>
                    <p className="text-slate-400 mb-6">Este quiz no tiene preguntas asignadas.</p>
                    <button onClick={onClose} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl">Cerrar</button>
                </div>
            </div>
        )
    }

    const currentQ = questions[currentIdx]

    const handleAnswerMC = (optIdx: number) => {
        if (selectedOption !== null) return
        setSelectedOption(optIdx)
        const isCorrect = optIdx === (currentQ.correct ?? currentQ.correctAnswerIndex);
        if (isCorrect) setScore(prev => prev + 1)

        setTimeout(() => {
            if (currentIdx < questions.length - 1) {
                setCurrentIdx(prev => prev + 1)
                setSelectedOption(null)
            } else {
                saveResult(score + (isCorrect ? 1 : 0))
            }
        }, 1200)
    }

    const handleMatchSelect = (idx: number, isRightSide: boolean) => {
        if (!isRightSide) {
            setSelectedA(idx)
        } else if (selectedA !== null) {
            if (selectedA === idx) {
                setScore(prev => prev + 1)
                setMatchedPairs(prev => [...prev, idx])
            }
            setSelectedA(null)
            if (matchedPairs.length + 1 === questions.length) {
                setTimeout(() => saveResult(score + 1), 1000)
            }
        }
    }

    const nextFlashcard = () => {
        setScore(prev => prev + 1)
        setFlipped(false)
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(prev => prev + 1)
        } else {
            saveResult(score + 1)
        }
    }

    const saveResult = async (finalScoreRaw: number) => {
        setFinished(true)
        setSubmitting(true)
        const pct = Math.round((finalScoreRaw / questions.length) * 100)
        try {
            const res = await submitQuiz({ quiz_id: quiz._id, score: pct })
            setQuizResult(res)
        } catch (err: any) {
            console.error(err)
            toast.error(err.message || "Error al guardar resultado")
        } finally {
            setSubmitting(false)
        }
    }

    const progressWidth = `${((currentIdx + 1) / questions.length) * 100}%`

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-surface-light border border-white/10 rounded-[2.5rem] max-w-3xl w-full p-8 md:p-12 relative overflow-hidden shadow-2xl">
                {!finished && (
                    <button onClick={onClose} title="Cerrar Quiz" className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                )}

                {!finished ? (
                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <span className="px-3 py-1 bg-accent/10 border border-accent/20 text-accent-light text-[10px] font-black rounded-full uppercase tracking-widest leading-none">
                                {quiz.quiz_type}
                            </span>
                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 relative mx-4">
                                <div
                                    className="h-full bg-accent transition-all duration-500 rounded-full"
                                    style={({ width: progressWidth } as React.CSSProperties)}
                                ></div>
                            </div>
                            <span className="text-slate-500 font-bold text-sm tracking-widest">{currentIdx + 1} / {questions.length}</span>
                        </div>

                        {isMultipleChoice && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-2xl font-black text-white mb-8 leading-relaxed">{currentQ.question}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {currentQ.options?.map((opt: string, i: number) => {
                                        const isCorrectOpt = i === (currentQ.correct ?? currentQ.correctAnswerIndex)
                                        let btnCls = "bg-white/5 border-white/10 text-slate-300 hover:border-accent/40"
                                        if (selectedOption !== null) {
                                            if (isCorrectOpt) btnCls = "bg-green-500/20 border-green-500/50 text-green-400"
                                            else if (i === selectedOption) btnCls = "bg-red-500/20 border-red-500/50 text-red-400"
                                            else btnCls = "bg-white/5 border-white/10 text-slate-600 opacity-50"
                                        }
                                        return (
                                            <button
                                                key={i}
                                                disabled={selectedOption !== null}
                                                onClick={() => handleAnswerMC(i)}
                                                className={`p-6 rounded-2xl border text-left font-semibold transition-all ${btnCls}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-xs font-black">{['A', 'B', 'C', 'D'][i]}</span>
                                                    <span>{opt}</span>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {isFlashcard && (
                            <div className="flex flex-col items-center justify-center min-h-[300px] animate-in zoom-in-95 duration-300">
                                <div
                                    onClick={() => setFlipped(!flipped)}
                                    className="w-full max-w-xl aspect-[3/2] cursor-pointer group perspective-1000"
                                >
                                    <div className={`relative w-full h-full transition-transform duration-500 preserve-3d ${flipped ? 'rotate-y-180' : ''}`}>
                                        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-900 to-slate-900 border-2 border-indigo-500/30 rounded-3xl p-10 flex items-center justify-center text-center shadow-xl group-hover:border-indigo-400/50 transition-colors">
                                            <h3 className="text-3xl font-black text-white">{currentQ.front || currentQ.term || currentQ.question || currentQ.concept}</h3>
                                        </div>
                                        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-tl from-emerald-900 to-slate-900 border-2 border-emerald-500/30 rounded-3xl p-10 flex items-center justify-center text-center shadow-xl">
                                            <h3 className="text-2xl font-semibold text-emerald-100">{currentQ.back || currentQ.definition || currentQ.answer}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 flex gap-4">
                                    <button onClick={() => setFlipped(!flipped)} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors">Voltear</button>
                                    <button onClick={nextFlashcard} className="px-6 py-3 bg-accent hover:bg-accent-light text-white font-black rounded-xl shadow-lg transition-all">Siguiente</button>
                                </div>
                            </div>
                        )}

                        {isMatch && (
                            <div className="animate-in fade-in duration-300 px-4">
                                <h3 className="text-center text-xl font-bold text-slate-300 mb-8">Empareja los conceptos</h3>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        {questions.map((q: any, i: number) => (
                                            <button
                                                key={`left-${i}`}
                                                disabled={matchedPairs.includes(i)}
                                                onClick={() => handleMatchSelect(i, false)}
                                                className={`w-full p-4 rounded-xl border text-left font-bold transition-all
                                                    ${matchedPairs.includes(i) ? 'bg-green-500/10 border-green-500/20 text-green-500/50 cursor-default' :
                                                        selectedA === i ? 'bg-accent/20 border-accent text-white' :
                                                            'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
                                            >
                                                {q.front || q.left || q.term || q.concept}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="space-y-4">
                                        {questions.map((q: any, i: number) => (
                                            <button
                                                key={`right-${i}`}
                                                disabled={matchedPairs.includes(i)}
                                                onClick={() => handleMatchSelect(i, true)}
                                                className={`w-full p-4 rounded-xl border text-left font-bold transition-all
                                                    ${matchedPairs.includes(i) ? 'bg-green-500/10 border-green-500/20 text-green-500/50 cursor-default' :
                                                        'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
                                            >
                                                {q.back || q.right || q.definition}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12 animate-in zoom-in-95 duration-500">
                        {submitting ? (
                            <div className="py-20 flex flex-col items-center">
                                <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
                                <p className="text-white font-bold animate-pulse">Procesando resultados...</p>
                            </div>
                        ) : (
                            <>
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl ${quizResult?.is_improvement ? 'bg-gold/20 shadow-gold/20' : 'bg-slate-800 shadow-black/50'}`}>
                                    {quizResult?.is_improvement ? <Trophy className="w-12 h-12 text-gold" /> : <Star className="w-12 h-12 text-slate-500" />}
                                </div>
                                <h2 className="text-4xl font-black text-white mb-2">
                                    {quizResult?.is_improvement ? '¡Nuevo Record!' : 'Reto Completado'}
                                </h2>
                                <p className="text-slate-400 text-lg mb-8">
                                    {quizResult?.is_improvement
                                        ? '¡Increíble! Has superado tu puntuación anterior.'
                                        : 'Bien hecho, has finalizado el quiz satisfactoriamente.'}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                    <div className="bg-black/20 p-6 rounded-3xl border border-white/5">
                                        <span className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">PUNTUACIÓN ACTUAL</span>
                                        <span className="text-4xl font-black text-white">{Math.round((score / questions.length) * 100)}%</span>
                                    </div>
                                    <div className="bg-black/20 p-6 rounded-3xl border border-white/5">
                                        <span className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">PUNTOS GANADOS</span>
                                        <div className="flex items-center justify-center gap-2">
                                            <Coins className="w-6 h-6 text-gold" />
                                            <span className="text-4xl font-black text-gold">+{quizResult?.earned || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {quizResult?.daily_bonus_applied && (
                                    <div className="bg-gold/10 border border-gold/20 rounded-2xl p-4 mb-8 text-gold flex items-center justify-center gap-2 animate-bounce">
                                        <Sparkles className="w-5 h-5 flex-shrink-0" />
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-black uppercase tracking-widest text-center leading-tight">
                                                +{quizResult.daily_bonus} PTS BONO POR RACHA
                                            </span>
                                            <span className="text-[10px] font-bold mt-1 opacity-80 uppercase tracking-widest text-center">
                                                ¡{quizResult.new_streak} {quizResult.new_streak === 1 ? 'DÍA' : 'DÍAS'} DE RACHA DIARIA! Sigue así para ganar hasta 50 pts
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <button onClick={onClose} className="bg-accent hover:bg-accent-light text-white font-black px-12 py-5 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20 uppercase tracking-widest">
                                        VOLVER AL RAMO
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}


function TransferModal({ onClose, courses }: { onClose: () => void, courses: any[] }) {
    const requestTransfer = useMutation(api.point_transfers.requestTransfer)
    const { results: transferHistory, status: historyStatus, loadMore } = usePaginatedQuery(
        api.point_transfers.getStudentTransfers,
        {},
        { initialNumItems: 5 }
    )
    const [fromCourse, setFromCourse] = useState('')
    const [toCourse, setToCourse] = useState('')
    const [amount, setAmount] = useState<number>(0)
    const [loading, setLoading] = useState(false)

    const handleRequest = async () => {
        if (!fromCourse || !toCourse || amount <= 0) {
            toast.error('Por favor completa todos los campos correctamente.')
            return
        }
        if (fromCourse === toCourse) {
            toast.error('El ramo de origen y destino no pueden ser el mismo.')
            return
        }

        setLoading(true)
        try {
            await requestTransfer({
                from_course_id: fromCourse as any,
                to_course_id: toCourse as any,
                amount
            })
            toast.success('Solicitud enviada. Los docentes deben aprobar el traspaso para que sea efectivo.')
            onClose()
        } catch (err: any) {
            toast.error('Error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-white/10 w-full max-w-xl rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-white">Transferir Puntos</h2>
                        <p className="text-slate-500 text-sm font-medium">Eleva una solicitud a tus docentes</p>
                    </div>
                    <button onClick={onClose} title="Cerrar" className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block text-left">RAMO ORIGEN (De donde salen puntos)</label>
                        <select
                            title="Ramo Origen"
                            aria-label="Ramo Origen"
                            value={fromCourse}
                            onChange={(e) => setFromCourse(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                        >
                            <option value="">Seleccionar Ramo...</option>
                            {courses.map(c => (
                                <option key={c._id} value={c._id}>{c.name} (Saldo: {c.spendable_points || c.total_points || 0} pts)</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-center -my-3 relative z-10">
                        <div className="bg-primary p-3 rounded-full shadow-lg shadow-primary/20 ring-4 ring-slate-900">
                            <ArrowRightLeft className="w-5 h-5 text-white" />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block text-left">RAMO DESTINO (A donde llegan puntos)</label>
                        <select
                            title="Ramo Destino"
                            aria-label="Ramo Destino"
                            value={toCourse}
                            onChange={(e) => setToCourse(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-accent/50 transition-all font-bold appearance-none"
                        >
                            <option value="">Seleccionar Ramo...</option>
                            {courses.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block text-left">CANTIDAD DE PUNTOS</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={amount || ''}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                placeholder="Ej: 500"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-gold/50 transition-all font-black text-xl placeholder:text-slate-700"
                            />
                            <Coins className="absolute right-4 top-1/2 -translate-y-1/2 text-gold w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-amber-500 text-[11px] font-bold leading-relaxed flex gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>Los puntos transferidos se restarán de tu saldo canjeable del ramo origen. La transferencia requiere que ambos docentes aprueben la solicitud.</p>
                    </div>

                    <button
                        onClick={handleRequest}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-primary to-accent text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        {loading ? 'ENVIANDO SOLICITUD...' : 'ENVIAR SOLICITUD DE TRASPASO'}
                    </button>

                    {/* Historial de Traspasos */}
                    {transferHistory && transferHistory.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-white/10">
                            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Historial de Solicitudes</h3>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {transferHistory.map((hist: any) => (
                                    <div key={hist._id} className="bg-black/20 rounded-xl p-3 border border-white/5 flex items-center justify-between text-xs">
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-300 font-bold truncate max-w-[120px]" title={hist.from_course_name}>{hist.from_course_name}</span>
                                                <ArrowRightLeft className="w-3 h-3 text-slate-600 shrink-0" />
                                                <span className="text-slate-300 font-bold truncate max-w-[120px]" title={hist.to_course_name}>{hist.to_course_name}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-500 mt-1 uppercase font-black tracking-widest">
                                                {new Date(hist.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                                            <span className="text-gold font-black text-sm">{hist.amount.toLocaleString()} pts</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest ${hist.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                hist.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                }`}>
                                                {hist.status === 'approved' ? 'APROBADO' : hist.status === 'rejected' ? 'RECHAZADO' : 'PENDIENTE'}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {historyStatus === "CanLoadMore" && (
                                    <button
                                        onClick={() => loadMore(5)}
                                        className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all border border-white/5 rounded-xl mt-2"
                                    >
                                        Cargar más historial
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}



function CompleteProfileModal({ user, onComplete }: { user: any, onComplete: () => void }) {
    const [rut, setRut] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const updateProfile = useMutation(api.users.updateProfile)
    const checkWhitelist = useQuery(api.users.checkWhitelist, rut.length >= 8 ? { student_id: rut } : "skip")

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (rut.length < 8) {
            setError('Ingresa un RUT válido.')
            setLoading(false)
            return
        }

        if (checkWhitelist === undefined) {
             // Loading
        } else if (!checkWhitelist?.allowed) {
            setError('RUT No Autorizado: No estás en el listado de ningún ramo. Verifica con tu docente.')
            setLoading(false)
            return
        }

        try {
            await updateProfile({ student_id: rut })
            toast.success('¡Perfil completado! Bienvenido.')
            onComplete()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] bg-surface flex items-center justify-center p-6 bg-cover bg-center" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(100, 100, 255, 0.05), transparent), radial-gradient(circle at 80% 70%, rgba(255, 100, 255, 0.05), transparent)' }}>
            <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-surface-light border border-white/10 rounded-[3rem] p-10 md:p-12 shadow-2xl relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -z-10" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/20 blur-3xl -z-10" />

                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/20">
                        <GraduationCap className="w-10 h-10 text-white" />
                    </div>

                    <h2 className="text-3xl font-black text-white mb-2">¡Hola, {user.name.split(' ')[0]}!</h2>
                    <p className="text-slate-400 mb-10 text-sm">
                        Para activar tu cuenta institucional, por favor ingresa tu **RUT o Matrícula**. Esto nos permitirá vincularte con tus ramos automáticamente.
                    </p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-8 flex items-center gap-3 text-left">
                            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                            <p className="text-red-400 text-xs font-bold leading-relaxed">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="text-left">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-2 block">RUT / Identificador de Alumno</label>
                            <input
                                type="text"
                                value={rut}
                                onChange={(e) => setRut(e.target.value)}
                                placeholder="Ej: 12.345.678-9"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-lg placeholder:text-slate-700 focus:border-primary transition-all outline-none"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || rut.length < 8}
                            className="w-full bg-primary hover:bg-primary-light text-white font-black py-5 rounded-2xl shadow-xl shadow-primary/30 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Activar mi Cuenta'}
                        </button>
                    </form>

                    <p className="mt-8 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                        Plataforma de Seguridad DuocencIA
                    </p>
                </div>
            </div>
        </div>
    )
}

function PerfilPanel({ user, totalPoints, belbinRole }: { user: any, totalPoints: number, belbinRole: string }) {
    const navigate = useNavigate()
    return (
        <div className="max-w-4xl mx-auto py-10 space-y-8">
            <div className="bg-surface-light border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="w-32 h-32 bg-gradient-to-br from-primary to-accent rounded-[2.5rem] flex items-center justify-center text-4xl shadow-2xl shadow-primary/20">
                    {belbinRole === 'Cerebro' ? '🧠' : belbinRole === 'Impulsor' ? '⚡' : '🎓'}
                </div>
                <div className="text-center md:text-left flex-1">
                    <h2 className="text-3xl font-black text-white mb-1">{user.name}</h2>
                    <p className="text-primary-light font-bold uppercase tracking-widest text-sm mb-4">{belbinRole}</p>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                        <div className="bg-black/20 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-gold" />
                            <span className="text-white font-bold">{totalPoints.toLocaleString()} PTS Totales</span>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-3xl p-8">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                        Tu Perfil Belbin
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        Tu rol dominante es <strong>{belbinRole}</strong>. Esto significa que aportas valor al equipo mediante tu capacidad de {belbinRole === 'Cerebro' ? 'generar ideas creativas y resolver problemas complejos.' : 'impulsar la acción y superar obstáculos con determinación.'}
                    </p>
                    <Link to="/test-belbin" className="text-indigo-400 hover:text-indigo-300 font-bold text-sm">Repetir Test →</Link>
                </div>

                <div className="bg-gradient-to-br from-gold/10 to-transparent border border-gold/20 rounded-3xl p-8">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Coins className="w-5 h-5 text-gold" />
                        Beneficios Diarios
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        Recuerda que cada día, al realizar tu primer quiz, recibirás un bono de <strong>20 puntos extra</strong> solo por participar. ¡Mantente activo!
                    </p>
                    <div className="text-[10px] text-gold font-black uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full inline-block">Bono Disponible hoy</div>
                </div>
            </div>
        </div>
    )
}

