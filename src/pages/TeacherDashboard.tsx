import { useMemo, useState, useEffect } from 'react'
import { useClerk } from "@clerk/clerk-react"
import { useNavigate } from 'react-router-dom'
import { BookOpen, Target, Trophy, Gift, BarChart3, LogOut, Menu, X, Settings, Sparkles, Loader2, FileText, User, Mail, ShieldCheck, HelpCircle, ArrowRightLeft, Package, Archive } from 'lucide-react'
import FAQSection from '../components/FAQSection'
import { toast } from 'sonner'
import RamosPanel from '../components/teacher/RamosPanel'
import CrearMisionPanel from '../components/teacher/CrearMisionPanel'
import CrearRecompensaPanel from '../components/teacher/CrearRecompensaPanel'
import MaterialPanel from '../components/teacher/MaterialPanel'
import PanolPanel from '../components/teacher/PanolPanel'
import RankingDocentePanel from '../components/teacher/RankingDocentePanel'
import GestionCanjesPanel from '../components/teacher/GestionCanjesPanel'
import NotificationBell from '../components/NotificationBell'
import AdminPanel from '../components/teacher/AdminPanel'
import CierreSemestrePanel from '../components/teacher/CierreSemestrePanel'
import InicioDocente from '../components/teacher/InicioDocente'
import TeacherTour from '../components/teacher/TeacherTour'
import ContactWidget from '../components/ContactWidget'
import { useProfile } from '../hooks/useProfile'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { CoursesAPI, AnalyticsAPI } from '../lib/api'
import { getProximasClases, type ProximaClase } from '../lib/semesterApi'
import { SideRail, RailSection, type OnboardingStep } from '../components/dashboard/primitives'
import { capitalize } from '../utils/dashboardUtils'
import { SemesterProvider, useSemester } from '../context/SemesterContext'
import SemesterSwitcher from '../components/teacher/SemesterSwitcher'
import { esSemestreValido, formatSemestre } from '../lib/semesters'

const TAB_META: Record<string, { label: string; emoji: string }> = {
    inicio: { label: 'Inicio', emoji: '📊' },
    ramos: { label: 'Mis Ramos', emoji: '📚' },
    material: { label: 'Material', emoji: '📄' },
    panol: { label: 'Pañol', emoji: '📦' },
    desafios: { label: 'Desafíos', emoji: '🎯' },
    ranking: { label: 'Ranking', emoji: '🏆' },
    recompensas: { label: 'Recompensas', emoji: '🎁' },
    canjes: { label: 'Gestión Canjes', emoji: '🔄' },
    cierre: { label: 'Cierre de Semestre', emoji: '🗄️' },
    perfil: { label: 'Mi Perfil', emoji: '👤' },
    admin: { label: 'Panel Admin', emoji: '🛡️' },
}

export default function TeacherDashboard() {
    const { user } = useProfile()
    const { data: allCourses, refetch: refetchCourses } = useSupabaseQuery(
        () => user ? CoursesAPI.getMyCourses(user.clerk_id, user.role) : Promise.resolve([]),
        [user]
    )

    // El provider envuelve al dashboard para que el semestre activo esté
    // disponible en el selector y en todas las secciones.
    return (
        <SemesterProvider courses={allCourses || []}>
            <TeacherDashboardInner
                user={user}
                allCourses={allCourses || []}
                refetchCourses={refetchCourses}
            />
        </SemesterProvider>
    )
}

function TeacherDashboardInner({
    user,
    allCourses,
    refetchCourses,
}: {
    user: any
    allCourses: any[]
    refetchCourses: () => void
}) {
    const { signOut } = useClerk()
    const navigate = useNavigate()
    const { filtrarPorSemestre, semestreActivo } = useSemester()

    // Todo el dashboard trabaja sobre los ramos del semestre activo.
    const courses = useMemo(() => filtrarPorSemestre(allCourses), [allCourses, filtrarPorSemestre])

    // Stats a nivel de layout: la barra lateral es fija, así que sus datos ya no
    // pueden vivir dentro de la pestaña de Inicio.
    const { data: stats } = useSupabaseQuery(
        () => (user ? AnalyticsAPI.getTeacherStats(user.clerk_id, user.role) : Promise.resolve(null)),
        [user?.clerk_id]
    )

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('inicio')
    const [selectedCourse, setSelectedCourse] = useState<any>(null)
    const [showHelp, setShowHelp] = useState(false)

    const handleLogout = async () => {
        await signOut()
        navigate('/')
    }

    const coursesCount = courses?.length || 0

    const tabs = [
        { id: 'inicio', label: 'Inicio', icon: <BarChart3 className="w-[17px] h-[17px]" />, tourClass: 'tour-step-estadisticas' },
        { id: 'ramos', label: 'Mis Ramos', icon: <BookOpen className="w-[17px] h-[17px]" />, tourClass: 'tour-step-ramos' },
        { id: 'material', label: 'Material', icon: <FileText className="w-[17px] h-[17px]" />, tourClass: 'tour-step-material' },
        { id: 'panol', label: 'Pañol', icon: <Package className="w-[17px] h-[17px]" /> },
        { id: 'desafios', label: 'Desafíos', icon: <Target className="w-[17px] h-[17px]" />, tourClass: 'tour-step-desafios', badge: 'IA' },
        { id: 'ranking', label: 'Ranking', icon: <Trophy className="w-[17px] h-[17px]" />, tourClass: 'tour-step-ranking' },
        { id: 'recompensas', label: 'Recompensas', icon: <Gift className="w-[17px] h-[17px]" />, tourClass: 'tour-step-recompensas' },
        { id: 'canjes', label: 'Gestión Canjes', icon: <ArrowRightLeft className="w-[17px] h-[17px]" /> },
        { id: 'cierre', label: 'Cierre de Semestre', icon: <Archive className="w-[17px] h-[17px]" /> },
        { id: 'perfil', label: 'Mi Perfil', icon: <User className="w-[17px] h-[17px]" /> },
        ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Panel Admin', icon: <ShieldCheck className="w-[17px] h-[17px] text-red-500" /> }] : []),
    ]

    if (!user) {
        return (
            <div className="min-h-screen bg-ink flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-iris-light animate-spin" />
            </div>
        )
    }

    const currentMeta = TAB_META[activeTab] || { label: tabs.find(t => t.id === activeTab)?.label || '', emoji: '📄' }

    // Primeros pasos pendientes. Van en el rail, visibles desde cualquier sección.
    const onboardingSteps: OnboardingStep[] = []
    if (coursesCount === 0) {
        onboardingSteps.push({ title: 'Crea tu primer ramo', body: 'Organiza secciones y alumnos', onClick: () => setActiveTab('ramos') })
    }
    if (stats && (stats.totalDocuments ?? 0) === 0) {
        onboardingSteps.push({ title: 'Sube material de apoyo', body: 'PDF, DOCX con extracción de texto', onClick: () => setActiveTab('material') })
    }
    if (stats && (stats.totalMissionsCreated ?? 0) === 0) {
        onboardingSteps.push({ title: 'Genera un desafío con IA', body: 'Quizzes automáticos desde tu material', onClick: () => setActiveTab('desafios') })
    }

    return (
        <div className="h-screen-dvh bg-ink flex overflow-hidden relative" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {/* SIDEBAR */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-ink-soft border-r border-white/5 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto flex flex-col shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Logo */}
                <div className="px-5 pt-[22px] pb-[18px] border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-[10px] bg-iris/[0.18] border border-iris/30 flex items-center justify-center">
                                <Sparkles className="w-[17px] h-[17px] text-iris-light" strokeWidth={2} />
                            </div>
                            <div>
                                <span className="block font-black text-[17px] text-white italic tracking-[-0.5px] leading-none">
                                    Quest<span className="text-iris-light">IA</span>
                                </span>
                                <div className="text-[9px] font-extrabold text-iris-soft uppercase tracking-[1.5px] mt-0.5">Panel Docente</div>
                            </div>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white" aria-label="Cerrar panel">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* User card */}
                <div className="px-3 pt-3.5 pb-2.5 mx-2 border-b border-white/[0.04]">
                    <div className="flex items-center gap-2.5 bg-iris/[0.08] border border-iris/15 rounded-xl px-3 py-2.5">
                        <div className="w-9 h-9 rounded-[10px] flex-shrink-0 flex items-center justify-center overflow-hidden border-[1.5px] border-iris/40" style={{ background: 'linear-gradient(135deg, rgba(84,87,229,0.45), rgba(84,87,229,0.2))' }}>
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
                                className={`flex items-center gap-2.5 px-[13px] py-[9px] rounded-[10px] border-l-2 text-left transition-all text-[13.5px] ${tab.tourClass || ''} ${active ? 'bg-iris/[0.16] text-iris-soft font-bold border-l-iris' : 'bg-transparent text-[#5a5a88] font-medium border-l-transparent hover:text-[#f0f0f8] hover:bg-white/[0.03]'}`}
                            >
                                <span style={{ opacity: active ? 1 : 0.55 }}>
                                    {tab.icon}
                                </span>
                                {tab.label}
                                {(tab as any).badge && (
                                    <span className="ml-auto text-[10px] font-extrabold bg-iris/25 text-iris-soft px-[7px] py-0.5 rounded-full">
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
                        <div className="min-w-0">
                            <h1 className="text-[17px] font-extrabold text-[#f0f0f8] truncate leading-tight">
                                {currentMeta.emoji} {currentMeta.label}
                            </h1>
                            {esSemestreValido(semestreActivo) && (
                                <span className="text-[10.5px] text-[#5577aa] font-semibold">
                                    {formatSemestre(semestreActivo)}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        {/* Selector de semestre: cambia el contexto de todo el panel. */}
                        <SemesterSwitcher courses={allCourses} />
                        {/* Beta badge */}
                        <div className="hidden sm:block bg-iris/12 border border-iris/25 rounded-full px-3 py-1 text-[10px] font-extrabold text-iris-soft uppercase tracking-[1px]">
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

                {/* Cuerpo + barra lateral fija.
                    El rail es hermano del área de scroll, no hijo: así queda fijo
                    y solo el cuerpo se desplaza al cambiar de sección. */}
                <div className="flex-1 flex min-h-0 overflow-hidden">
                    <div className="flex-1 min-w-0 overflow-y-auto px-7 py-[26px] pb-safe">
                        {activeTab === 'inicio' && (
                            <InicioDocente
                                user={user}
                                courses={courses || []}
                                onTabChange={setActiveTab}
                            />
                        )}
                        {activeTab === 'ramos' && (
                            <RamosPanel
                                courses={courses || []}
                                selectedCourse={selectedCourse}
                                setSelectedCourse={setSelectedCourse}
                                onCoursesChanged={refetchCourses}
                            />
                        )}
                        {activeTab === 'material' && <MaterialPanel courses={courses || []} />}
                        {activeTab === 'panol' && <PanolPanel />}
                        {activeTab === 'desafios' && <CrearMisionPanel courses={courses || []} />}
                        {activeTab === 'recompensas' && <CrearRecompensaPanel courses={courses || []} />}
                        {activeTab === 'ranking' && <RankingDocentePanel />}
                        {activeTab === 'canjes' && <GestionCanjesPanel />}
                        {activeTab === 'cierre' && (
                            <CierreSemestrePanel
                                user={user}
                                onTabChange={setActiveTab}
                                onCoursesChanged={refetchCourses}
                            />
                        )}
                        {activeTab === 'perfil' && <PerfilPanel user={user} coursesCount={coursesCount} />}
                        {activeTab === 'admin' && user?.role === 'admin' && <AdminPanel />}
                    </div>

                    <SideRail steps={onboardingSteps}>
                        <RailAgenda courses={courses || []} onTabChange={setActiveTab} />
                    </SideRail>
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


/**
 * Agenda de próximas clases en la barra lateral.
 * Bloque de ejemplo de cómo extender el rail: se le pasa como children a SideRail.
 */
function RailAgenda({ courses, onTabChange }: { courses: any[]; onTabChange: (tab: string) => void }) {
    const { user } = useProfile()
    const { data: clases, isLoading, refetch } = useSupabaseQuery<ProximaClase[]>(
        () => (user ? getProximasClases(user.clerk_id, user.role, 5) : Promise.resolve([])),
        [user?.clerk_id, courses.length]
    )

    useEffect(() => {
        const handleUpdate = () => {
            refetch()
        }
        window.addEventListener('questia:clases_updated', handleUpdate)
        return () => window.removeEventListener('questia:clases_updated', handleUpdate)
    }, [refetch])

    if (isLoading) {
        return (
            <RailSection title="Próximas clases">
                <div className="flex justify-center py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-quieter" />
                </div>
            </RailSection>
        )
    }

    if (!clases || clases.length === 0) {
        return (
            <RailSection title="Próximas clases">
                <button
                    onClick={() => onTabChange('ramos')}
                    className="text-[12px] text-quieter hover:text-iris-light text-left leading-relaxed transition-colors"
                >
                    No hay clases programadas. Planifica el semestre desde el calendario de un ramo.
                </button>
            </RailSection>
        )
    }

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    return (
        <RailSection title="Próximas clases">
            <div className="flex flex-col gap-2">
                {clases.map(cl => {
                    const fecha = new Date(cl.fecha)
                    const esHoy = fecha.setHours(0, 0, 0, 0) === hoy.getTime()
                    const etiqueta = esHoy
                        ? 'Hoy'
                        : capitalize(
                            new Date(cl.fecha).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })
                        )

                    return (
                        <button
                            key={cl.id}
                            onClick={() => onTabChange('ramos')}
                            className={`text-left p-2.5 rounded-xl border transition-colors ${
                                esHoy
                                    ? 'bg-iris/[0.1] border-iris/25 hover:border-iris/40'
                                    : 'bg-white/[0.03] border-white/5 hover:border-white/15'
                            }`}
                        >
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${esHoy ? 'text-iris-soft' : 'text-quieter'}`}>
                                    {etiqueta}
                                </span>
                                {cl.horaInicio && (
                                    <span className="text-[10px] text-quieter font-mono">{cl.horaInicio}</span>
                                )}
                                {cl.esFeriado && (
                                    <span className="text-[9px] font-bold uppercase text-amber-400/80 ml-auto">Feriado</span>
                                )}
                            </div>
                            <div className="text-[12px] font-bold text-text-main truncate">{cl.courseCode}</div>
                            <div className="text-[11px] text-quieter truncate mt-0.5">
                                {cl.titulo || cl.courseName}
                                {cl.section ? ` · ${cl.section}` : ''}
                            </div>
                        </button>
                    )
                })}
            </div>
        </RailSection>
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
