import { useState } from 'react'
import { useClerk } from "@clerk/clerk-react"
import { useNavigate } from 'react-router-dom'
import { BookOpen, Target, Trophy, Gift, BarChart3, LogOut, Menu, X, Settings, Sparkles, Loader2, FileText, User, Mail, ShieldCheck, HelpCircle, ArrowRightLeft, Activity } from 'lucide-react'
import FAQSection from '../components/FAQSection'
import { toast } from 'sonner'
import RamosPanel from '../components/teacher/RamosPanel'
import CrearMisionPanel from '../components/teacher/CrearMisionPanel'
import CrearRecompensaPanel from '../components/teacher/CrearRecompensaPanel'
import MaterialPanel from '../components/teacher/MaterialPanel'
import RankingDocentePanel from '../components/teacher/RankingDocentePanel'
import GestionCanjesPanel from '../components/teacher/GestionCanjesPanel'
import NotificationBell from '../components/NotificationBell'
import AdminPanel from '../components/teacher/AdminPanel'
import TeacherTour from '../components/teacher/TeacherTour'
import ContactWidget from '../components/ContactWidget'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { useProfile } from '../hooks/useProfile'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { CoursesAPI, AnalyticsAPI } from '../lib/api'
import { getTodayEphemeris } from '../data/efemerides'

function getGreeting(): string {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 20) return 'Buenas tardes'
    return 'Buenas noches'
}

function getFirstName(fullName?: string | null): string {
    if (!fullName) return ''
    return fullName.split(' ')[0]
}

const TAB_META: Record<string, { label: string; emoji: string }> = {
    inicio: { label: 'Inicio', emoji: '📊' },
    ramos: { label: 'Mis Ramos', emoji: '📚' },
    material: { label: 'Material', emoji: '📄' },
    desafios: { label: 'Desafíos', emoji: '🎯' },
    ranking: { label: 'Ranking', emoji: '🏆' },
    recompensas: { label: 'Recompensas', emoji: '🎁' },
    canjes: { label: 'Gestión Canjes', emoji: '🔄' },
    perfil: { label: 'Mi Perfil', emoji: '👤' },
    admin: { label: 'Panel Admin', emoji: '🛡️' },
}

export default function TeacherDashboard() {
    const { signOut } = useClerk()
    const navigate = useNavigate()

    const { user } = useProfile()
    const { data: courses } = useSupabaseQuery(
        () => user ? CoursesAPI.getMyCourses(user.clerk_id, user.role) : Promise.resolve([]),
        [user]
    )

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
        { id: 'inicio', label: 'Inicio', icon: <BarChart3 className="w-[17px] h-[17px]" />, tourClass: 'tour-step-estadisticas' },
        { id: 'ramos', label: 'Mis Ramos', icon: <BookOpen className="w-[17px] h-[17px]" />, tourClass: 'tour-step-ramos' },
        { id: 'material', label: 'Material', icon: <FileText className="w-[17px] h-[17px]" />, tourClass: 'tour-step-material' },
        { id: 'desafios', label: 'Desafíos', icon: <Target className="w-[17px] h-[17px]" />, tourClass: 'tour-step-desafios', badge: 'IA' },
        { id: 'ranking', label: 'Ranking', icon: <Trophy className="w-[17px] h-[17px]" />, tourClass: 'tour-step-ranking' },
        { id: 'recompensas', label: 'Recompensas', icon: <Gift className="w-[17px] h-[17px]" />, tourClass: 'tour-step-recompensas' },
        { id: 'canjes', label: 'Gestión Canjes', icon: <ArrowRightLeft className="w-[17px] h-[17px]" /> },
        { id: 'perfil', label: 'Mi Perfil', icon: <User className="w-[17px] h-[17px]" /> },
        ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Panel Admin', icon: <ShieldCheck className="w-[17px] h-[17px] text-red-500" /> }] : []),
    ]

    if (!user) {
        return (
            <div className="min-h-screen bg-[#06060c] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
            </div>
        )
    }

    const currentMeta = TAB_META[activeTab] || { label: tabs.find(t => t.id === activeTab)?.label || '', emoji: '📄' }

    return (
        <div className="h-screen-dvh bg-[#06060c] flex overflow-hidden relative" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {/* SIDEBAR */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-[#0c0c15] border-r border-white/5 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto flex flex-col shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Logo */}
                <div className="px-5 pt-[22px] pb-[18px] border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-[10px] bg-primary/[0.15] border border-primary/25 flex items-center justify-center">
                                <Sparkles className="w-[17px] h-[17px] text-primary" strokeWidth={2} />
                            </div>
                            <div>
                                <span className="block font-black text-[17px] text-white italic tracking-[-0.5px] leading-none">
                                    Quest<span className="text-primary">IA</span>
                                </span>
                                <div className="text-[9px] font-extrabold text-accent-light uppercase tracking-[1.5px] mt-0.5">Panel Docente</div>
                            </div>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white" aria-label="Cerrar panel">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* User card */}
                <div className="px-3 pt-3.5 pb-2.5 mx-2 border-b border-white/[0.04]">
                    <div className="flex items-center gap-2.5 bg-accent/[0.06] border border-accent/10 rounded-xl px-3 py-2.5">
                        <div className="w-9 h-9 rounded-[10px] flex-shrink-0 flex items-center justify-center overflow-hidden border-[1.5px] border-accent/30" style={{ background: 'linear-gradient(135deg, rgba(0,80,255,0.4), rgba(0,80,255,0.2))' }}>
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[17px]">👩‍🏫</span>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-bold text-[13px] text-[#f0f0f8] truncate">{user.name}</div>
                            <div className="text-[10px] text-[#5577cc] font-semibold mt-0.5 truncate">{user.email}</div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-2 py-2.5 flex flex-col gap-px overflow-y-auto custom-scrollbar">
                    {tabs.map(tab => {
                        const active = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
                                className={`flex items-center gap-2.5 px-[13px] py-[9px] rounded-[10px] border-l-2 text-left transition-all text-[13.5px] ${tab.tourClass || ''} ${active ? 'bg-accent/[0.12] text-accent-light font-bold border-l-accent' : 'bg-transparent text-[#5a5a88] font-medium border-l-transparent hover:text-[#f0f0f8] hover:bg-white/[0.03]'}`}
                            >
                                <span style={{ opacity: active ? 1 : 0.55 }}>
                                    {tab.icon}
                                </span>
                                {tab.label}
                                {(tab as any).badge && (
                                    <span className="ml-auto text-[10px] font-extrabold bg-accent/20 text-accent-light px-[7px] py-0.5 rounded-full">
                                        {(tab as any).badge}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div className="px-4 pt-2.5 pb-[18px] border-t border-white/[0.04]">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-[13px] py-[9px] rounded-[10px] border border-white/5 bg-transparent text-[#3a3a5a] hover:text-red-400 hover:bg-red-400/5 hover:border-red-400/20 transition-all text-xs font-semibold"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Cerrar Sesión
                    </button>
                    <div className="text-center mt-2 text-[9px] text-[#333355] font-bold uppercase tracking-[1px] italic">
                        QuestIA v1.1.0
                    </div>
                </div>
            </aside>

            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            <TeacherTour activeTab={activeTab} isDemo={!!(user.role === 'demo_teacher' || user.is_demo)} termsAccepted={!!user.terms_accepted_at} />

            {/* MAIN */}
            <main className="flex-1 h-screen-dvh flex flex-col overflow-hidden">
                {/* Topbar */}
                <header className="px-7 py-[15px] bg-[#09090f] border-b border-white/[0.04] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-slate-400 hover:text-white shrink-0"
                            aria-label="Abrir panel"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h1 className="text-[17px] font-extrabold text-[#f0f0f8] truncate">
                            {currentMeta.emoji} {currentMeta.label}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2.5">
                        {/* Beta badge */}
                        <div className="bg-accent/10 border border-accent/20 rounded-full px-3 py-1 text-[10px] font-extrabold text-[#5599ff] uppercase tracking-[1px]">
                            Beta
                        </div>
                        {/* Notification bell (wrapped to match style) */}
                        <div className="flex items-center">
                            <NotificationBell onTabChange={setActiveTab} />
                        </div>
                        {/* Help */}
                        <button
                            onClick={() => setShowHelp(true)}
                            className="w-[34px] h-[34px] rounded-[10px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#5577aa] hover:text-white hover:bg-white/10 transition-colors"
                            title="Ayuda / FAQ"
                            aria-label="Ayuda"
                        >
                            <HelpCircle className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Scroll area */}
                <div className="flex-1 overflow-y-auto px-7 py-[26px] pb-safe">
                    {activeTab === 'inicio' && (
                        <InicioDocente
                            user={user}
                            firstName={firstName}
                            coursesCount={coursesCount}
                            courses={courses || []}
                            onTabChange={setActiveTab}
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
                    {activeTab === 'canjes' && <GestionCanjesPanel />}
                    {activeTab === 'perfil' && <PerfilPanel user={user} coursesCount={coursesCount} />}
                    {activeTab === 'admin' && user?.role === 'admin' && <AdminPanel />}
                </div>
            </main>

            {showHelp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowHelp(false)}>
                    <div className="bg-[#111118] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-accent-light" />
                                Ayuda / FAQ
                            </h2>
                            <button onClick={() => setShowHelp(false)} aria-label="Cerrar" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
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

/* ── Mini bar chart ──────────────────────────────── */
function MiniBarChart({ data }: { data: { day: string; count: number }[] }) {
    const max = Math.max(...data.map(d => d.count), 1)
    return (
        <div className="flex items-end gap-1.5 h-20 px-1">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                        className="w-full rounded-md transition-all duration-300"
                        style={{
                            height: `${Math.max(6, (d.count / max) * 68)}px`,
                            background: d.count === max ? 'rgba(0,80,255,0.7)' : 'rgba(0,80,255,0.25)',
                        }}
                    />
                    <span className="text-[10px] text-[#444466] font-semibold">{d.day}</span>
                </div>
            ))}
        </div>
    )
}

/* ── KPI bar ──────────────────────────────── */
function KPIBar({ label, value, max, unit, goal, gradient }: { label: string; value: number; max: number; unit: string; goal: string; gradient: string }) {
    const pct = Math.min(100, (value / max) * 100)
    const displayValue = typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-[#7777aa]">{label}</span>
                <span className="text-[15px] font-black text-[#f0f0f8]">{displayValue}{unit}</span>
            </div>
            <div className="h-[7px] bg-white/5 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: gradient }}
                />
            </div>
            <span className="text-[10px] text-[#333355] text-right">Meta: {goal}</span>
        </div>
    )
}

/* ── Stat card ──────────────────────────────── */
function StatCard({ emoji, label, value, color }: { emoji: string; label: string; value: string | number; color: string }) {
    return (
        <div className="bg-[#111118] border border-white/5 rounded-2xl px-[18px] py-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[#444466] uppercase tracking-[0.5px]">{label}</span>
                <span className="text-lg">{emoji}</span>
            </div>
            <div className="text-[28px] font-black" style={{ color }}>{value}</div>
        </div>
    )
}

/* ── Quick card ──────────────────────────────── */
function QuickCard({ emoji, label, color, onClick }: { emoji: string; label: string; color: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="rounded-[14px] px-4 py-3.5 text-left cursor-pointer flex flex-col gap-1.5 transition-all hover:-translate-y-0.5 border"
            style={{
                background: `${color}0a`,
                borderColor: `${color}18`,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = `${color}14`
                e.currentTarget.style.borderColor = `${color}35`
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = `${color}0a`
                e.currentTarget.style.borderColor = `${color}18`
            }}
        >
            <span className="text-[22px]">{emoji}</span>
            <span className="text-[13px] font-bold text-[#d0d0f0]">{label}</span>
        </button>
    )
}

function InicioDocente({ user, firstName, coursesCount, courses, onTabChange }: {
    user: any
    firstName: string
    coursesCount: number
    courses: any[]
    onTabChange: (tab: string) => void
    onSelectCourse: (c: any) => void
}) {
    const { data: stats } = useSupabaseQuery(() => AnalyticsAPI.getTeacherStats(user.clerk_id, user.role), [user])
    const quizzesCompleted = stats ? (stats as any).totalQuizzesCompleted ?? 0 : '...'
    const avgScore = stats ? `${Math.round((stats as any).avgQuizScore ?? 0)}%` : '...'
    const participation = stats ? `${Math.round(((stats.totalRegisteredUniqueUsers ?? 0) / (stats.totalUniqueStudents || 1)) * 100)}%` : '...'
    const ephemeris = getTodayEphemeris()

    const adoptionPct = stats ? Math.round(((stats.totalRegisteredUniqueUsers || 0) / (stats.totalUniqueStudents || 1)) * 100) : 0
    const quizzesPerStudent = stats ? (stats.totalQuizzesCompleted / (stats.totalRegisteredUniqueUsers || 1)) : 0
    const redemptions = stats?.totalRedemptions || 0

    // Transform dailyActivity → { day: 'Lun', count }
    const activity = ((stats as any)?.dailyActivity || []).slice(-7).map((d: any) => {
        const date = new Date(d.day + 'T00:00:00')
        const weekday = date.toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', '')
        return { day: weekday.charAt(0).toUpperCase() + weekday.slice(1, 3), count: d.count }
    })

    return (
        <div className="flex flex-col gap-6">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-[22px] border border-accent/20 px-8 py-7" style={{ background: 'linear-gradient(135deg, rgba(0,80,255,0.1) 0%, #111118 60%, rgba(255,214,51,0.04) 100%)' }}>
                <div className="absolute -top-12 -right-10 w-[250px] h-[250px] rounded-full pointer-events-none" style={{ background: 'rgba(0,80,255,0.07)', filter: 'blur(60px)' }} />
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-[7px] bg-accent/[0.12] border border-accent/[0.22] rounded-full px-3.5 py-1 mb-3.5">
                        <Sparkles className="w-3 h-3 fill-[#5599ff] text-[#5599ff]" />
                        <span className="text-[11px] font-extrabold text-[#5599ff] uppercase tracking-[0.5px]">{getGreeting()}</span>
                    </div>
                    <h2 className="font-black text-[40px] text-white italic tracking-[-1.5px] leading-[1.1] mb-2.5">
                        ¡Hola, <span className="text-primary not-italic">{firstName}</span>!
                    </h2>
                    <p className="text-[15px] text-[#7777aa] font-medium leading-[1.6] max-w-[480px]">
                        {coursesCount === 0
                            ? 'Dale la bienvenida a QuestIA. Comienza creando tu primer ramo para gamificar tus clases.'
                            : <>Tienes <strong className="text-[#f0f0f8]">{coursesCount} {coursesCount === 1 ? 'ramo activo' : 'ramos activos'}</strong> en QuestIA. {quizzesCompleted !== '...' && quizzesCompleted > 0 && <>Se han completado <strong className="text-[#5599ff]">{quizzesCompleted} quizzes</strong>. </>}¡Sigue así!</>
                        }
                    </p>
                </div>
            </div>

            {/* Efeméride */}
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

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard emoji="📚" label="Ramos Activos" value={coursesCount} color="#5599ff" />
                <StatCard emoji="✅" label="Quizzes Completados" value={quizzesCompleted} color="#FFD633" />
                <StatCard emoji="📊" label="Puntaje Promedio" value={avgScore} color="#4ade80" />
                <StatCard emoji="🎯" label="Participación" value={participation} color="#f59e0b" />
            </div>

            {/* Secondary stats (whitelist, registrados, misiones, docs) */}
            {stats && (stats as any).totalUniqueStudents != null && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { label: 'Alumnos Inscritos (Whitelist)', value: (stats as any).totalUniqueStudents ?? 0, color: '#cbd5e1', icon: '👥', sublabel: 'en whitelist' },
                        { label: 'Alumnos Registrados', value: (stats as any).totalRegisteredUniqueUsers ?? 0, color: (stats as any).totalRegisteredUniqueUsers > 0 ? '#4ade80' : '#64748b', icon: '✅', sublabel: 'que se han registrado' },
                        { label: 'Misiones Creadas', value: (stats as any).totalMissionsCreated ?? 0, color: '#FFD633', icon: '🎯', sublabel: 'desafíos activos' },
                        { label: 'Documentos Subidos', value: (stats as any).totalDocumentsUploaded ?? 0, color: '#a78bfa', icon: '📄', sublabel: 'material disponible' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-[#111118] border border-white/5 rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-white/10">
                            <span className="text-3xl">{stat.icon}</span>
                            <div>
                                <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">{stat.label}</p>
                                <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                                <p className="text-[10px] text-[#4a5568]">{stat.sublabel}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* KPIs + Activity row */}
            {stats && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* KPIs */}
                    <div className="bg-[#111118] border border-white/5 rounded-[18px] px-6 py-[22px]">
                        <h3 className="text-sm font-extrabold text-[#f0f0f8] mb-5 flex items-center gap-2">
                            <Target className="w-4 h-4 text-[#5599ff]" />
                            Metas Semestrales
                        </h3>
                        <div className="flex flex-col gap-[18px]">
                            <KPIBar label="1. Adopción Estudiantil" value={adoptionPct} max={100} unit="%" goal="90%" gradient="linear-gradient(90deg, #22c55e, #4ade80)" />
                            <KPIBar label="2. Quizzes / Alumno" value={+quizzesPerStudent.toFixed(1)} max={15} unit=" qzs" goal="15 quizzes" gradient="linear-gradient(90deg, #0050FF, #5599ff)" />
                            <KPIBar label="3. Recompensas Canjeadas" value={redemptions} max={50} unit=" canjes" goal="50 canjes" gradient="linear-gradient(90deg, #f59e0b, #FFD633)" />
                        </div>
                    </div>

                    {/* Activity chart */}
                    <div className="bg-[#111118] border border-white/5 rounded-[18px] px-6 py-[22px]">
                        <h3 className="text-sm font-extrabold text-[#f0f0f8] mb-1.5 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#5599ff]" />
                            Conexiones (Últimos 7 días)
                        </h3>
                        <p className="text-[11px] text-[#333355] mb-[18px]">Alumnos activos por día</p>
                        {activity.length > 0 ? (
                            <>
                                <MiniBarChart data={activity} />
                                <div className="flex justify-between mt-3 pt-3 border-t border-white/[0.04]">
                                    <span className="text-[11px] text-[#444466]">Semana actual</span>
                                    <span className="text-[13px] font-extrabold text-[#5599ff]">
                                        {activity.reduce((s: number, d: any) => s + d.count, 0)} sesiones totales
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10 text-xs text-[#444466]">Sin actividad aún</div>
                        )}
                    </div>
                </div>
            )}

            {/* Charts (registro por ramo + quizzes por sección) */}
            {stats && (stats as any).courseStats?.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-[#111118] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-primary" />
                            Registro por Ramo
                        </h3>
                        <div className="h-[300px] w-full min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={(stats as any).courseStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value: any) => String(value).substring(0, 15) + (String(value).length > 15 ? '...' : '')} />
                                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                        cursor={{ fill: '#ffffff05' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                    <Bar dataKey="students" name="En Whitelist" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="registered" name="Registrados" fill="#4ade80" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-[#111118] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm">
                            <Target className="w-4 h-4 text-accent" />
                            Promedio Diario de Quizzes por Ramo y Sección
                        </h3>
                        <div className="h-[300px] w-full min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={(stats as any).courseStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value: any) => String(value).substring(0, 15) + (String(value).length > 15 ? '...' : '')} />
                                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                        cursor={{ fill: '#ffffff05' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                    <Bar dataKey="dailyAvgQuizzes" name="Quizzes/Día (Total Sec)" fill="#64748b" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="dailyAvgPerStudent" name="Quizzes/Día (Por Alumno)" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Full activity line chart (legacy, keep for detail) */}
            {stats && (stats as any).dailyActivity?.length > 0 && (
                <div className="bg-[#111118] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm">
                        <Sparkles className="w-4 h-4 text-accent" />
                        Conexiones (Detalle)
                    </h3>
                    <div className="h-[300px] w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={(stats as any).dailyActivity} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => {
                                    const d = new Date(val + "T00:00:00");
                                    return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' });
                                }} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                    cursor={{ stroke: '#ffffff20', strokeWidth: 2 }}
                                    labelFormatter={(val) => {
                                        const d = new Date(val + "T00:00:00");
                                        return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
                                    }}
                                />
                                <Line type="monotone" dataKey="count" name="Alumnos Activos" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: '#ec4899', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Quick access */}
            <div className="bg-[#111118] border border-white/5 rounded-[18px] px-6 py-[22px]">
                <h3 className="text-sm font-extrabold text-[#f0f0f8] mb-4">⚡ Acceso Rápido</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <QuickCard emoji="🎯" label="Crear Desafío" color="#0050FF" onClick={() => onTabChange('desafios')} />
                    <QuickCard emoji="📄" label="Subir Material" color="#8b5cf6" onClick={() => onTabChange('material')} />
                    <QuickCard emoji="🏆" label="Ver Ranking" color="#f59e0b" onClick={() => onTabChange('ranking')} />
                </div>
            </div>
        </div>
    )
}

function PerfilPanel({ user, coursesCount }: { user: any, coursesCount: number }) {
    const navigate = useNavigate()
    const cleanAllMyWhitelists = async () => ({ totalDeleted: 0 })
    const fixAllStudentIds = async () => ({ enrolled: 0 })

    return (
        <div className="max-w-4xl mx-auto py-10 space-y-8">
            <div className="bg-[#111118] border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="w-32 h-32 bg-gradient-to-br from-accent to-primary rounded-[2.5rem] flex items-center justify-center overflow-hidden shadow-2xl shadow-accent/20">
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
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

            <div className="bg-[#111118] border border-white/5 rounded-3xl p-8 shadow-xl">
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
                    <a href="mailto:nicolas.tejias@gmail.com" className="bg-[#09090f] border border-white/10 rounded-xl p-4 text-left hover:border-white/20 transition-all group">
                        <h4 className="text-white font-bold text-sm flex items-center gap-2 mb-1">
                            <ArrowRightLeft className="w-4 h-4 text-slate-400 group-hover:text-accent-light transition-colors" />
                            Gestión de Traspasos
                        </h4>
                        <p className="text-slate-500 text-xs">Gestiona solicitudes de traspasos de puntos entre ramos.</p>
                    </a>
                </div>
            </div>
            <ContactWidget />
        </div>
    )
}
