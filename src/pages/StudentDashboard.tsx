import { useState } from 'react'
import { useQuery } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { useNavigate } from 'react-router-dom'
import { api } from "../../convex/_generated/api"
import { BookOpen, Target, Trophy, Gift, User, LogOut, Menu, X, BarChart3, Brain, Coins, ChevronRight, Flame, Clock, Star, Loader2 } from 'lucide-react'

// Datos demo para cuando el alumno no tiene enrollments aún
const DEMO_MISSIONS = [
    { id: '1', title: 'Simulación de Circuito RC', points: 150, status: 'active', course: 'ELT-101' },
    { id: '2', title: 'Quiz de Leyes de Kirchhoff', points: 100, status: 'active', course: 'ELT-101' },
    { id: '3', title: 'Proyecto Final: Filtro Pasabanda', points: 500, status: 'active', course: 'CIR-201' },
]

const DEMO_LEADERBOARD = [
    { name: 'María Fernández', points: 2100, position: 1 },
    { name: 'Tú', points: 1250, position: 2, isMe: true },
    { name: 'Carlos Rojas', points: 1180, position: 3 },
    { name: 'Ana López', points: 950, position: 4 },
    { name: 'Pedro Soto', points: 720, position: 5 },
]

export default function StudentDashboard() {
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

    // Calculamos datos reales del usuario
    const userName = user?.name || 'Cargando...'
    const userEmail = user?.email || ''
    const belbinRole = user?.belbin_profile?.role_dominant || 'Sin determinar'
    const belbinCategory = user?.belbin_profile?.category || ''
    const totalPoints = courses?.reduce((sum: number, c: any) => sum + (c.total_points || 0), 0) || 0
    const coursesCount = courses?.length || 0

    const tabs = [
        { id: 'inicio', label: 'Inicio', icon: <BarChart3 className="w-5 h-5" /> },
        { id: 'misiones', label: 'Misiones', icon: <Target className="w-5 h-5" /> },
        { id: 'ranking', label: 'Ranking', icon: <Trophy className="w-5 h-5" /> },
        { id: 'tienda', label: 'Tienda', icon: <Gift className="w-5 h-5" /> },
        { id: 'perfil', label: 'Mi Perfil', icon: <User className="w-5 h-5" /> },
    ]

    if (!user) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
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
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold text-white">GestiónDocente</span>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-4">
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-4 mb-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-lg">
                                {belbinRole === 'Cerebro' ? '🧠' : belbinRole === 'Impulsor' ? '⚡' : belbinRole === 'Coordinador' ? '👑' : '🎓'}
                            </div>
                            <div>
                                <p className="text-white font-semibold text-sm">{userName}</p>
                                <p className="text-slate-400 text-xs">
                                    {belbinRole !== 'Sin determinar' ? `Rol: ${belbinRole}` : 'Realiza el Test Belbin'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-gold" />
                            <span className="text-gold font-bold">{totalPoints.toLocaleString()} pts</span>
                        </div>
                    </div>

                    {belbinRole === 'Sin determinar' && (
                        <button
                            onClick={() => navigate('/test-belbin')}
                            className="w-full bg-accent/10 text-accent-light text-sm font-semibold px-4 py-3 rounded-xl mb-4 hover:bg-accent/20 transition-colors flex items-center gap-2"
                        >
                            <Brain className="w-4 h-4" />
                            Completar Test Belbin
                        </button>
                    )}

                    <nav className="space-y-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-medium
                  ${activeTab === tab.id
                                        ? 'bg-primary/10 text-primary-light border border-primary/20'
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
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all font-medium">
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* Main Content */}
            <main className="flex-1 min-h-screen">
                <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold text-white capitalize">{tabs.find(t => t.id === activeTab)?.label}</h1>
                    </div>
                    <div className="flex items-center gap-2 bg-surface-light rounded-xl px-4 py-2 border border-white/5">
                        <Coins className="w-4 h-4 text-gold" />
                        <span className="text-gold font-bold text-sm">{totalPoints.toLocaleString()}</span>
                    </div>
                </header>

                <div className="p-6">
                    {activeTab === 'inicio' && <DashboardHome courses={courses || []} totalPoints={totalPoints} coursesCount={coursesCount} />}
                    {activeTab === 'misiones' && <MisionesPanel />}
                    {activeTab === 'ranking' && <RankingPanel />}
                    {activeTab === 'tienda' && <TiendaPanel />}
                    {activeTab === 'perfil' && <PerfilPanel user={user} totalPoints={totalPoints} belbinRole={belbinRole} belbinCategory={belbinCategory} />}
                </div>
            </main>
        </div>
    )
}

// ======== Sub-componentes ========

function DashboardHome({ courses, totalPoints, coursesCount }: { courses: any[], totalPoints: number, coursesCount: number }) {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Puntos Totales', value: totalPoints.toLocaleString(), icon: <Coins className="w-6 h-6" />, color: 'text-gold', bg: 'bg-gold/10' },
                    { label: 'Ramos Activos', value: `${coursesCount}`, icon: <BookOpen className="w-6 h-6" />, color: 'text-primary-light', bg: 'bg-primary/10' },
                    { label: 'Misiones Pendientes', value: '—', icon: <Target className="w-6 h-6" />, color: 'text-accent-light', bg: 'bg-accent/10' },
                    { label: 'Posición Ranking', value: '—', icon: <Trophy className="w-6 h-6" />, color: 'text-gold-light', bg: 'bg-gold/10' },
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

            <div>
                <h2 className="text-lg font-bold text-white mb-4">Mis Ramos</h2>
                {courses.length === 0 ? (
                    <div className="bg-surface-light border border-dashed border-white/10 rounded-2xl p-10 text-center">
                        <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-white font-semibold mb-2">Sin ramos inscritos aún</h3>
                        <p className="text-slate-400 text-sm">Tu docente debe agregarte a la whitelist del ramo para que se inscriba automáticamente.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {courses.map((course: any) => (
                            <div key={course._id} className="bg-surface-light border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-all group cursor-pointer">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-primary-light transition-colors">{course.name}</h3>
                                        <span className="text-xs text-slate-500 font-mono">{course.code}</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-primary-light transition-colors" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Coins className="w-4 h-4 text-gold" />
                                    <span className="text-gold font-bold">{(course.total_points || 0).toLocaleString()} pts</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function MisionesPanel() {
    return (
        <div className="space-y-4">
            <p className="text-slate-400 mb-6">Completa misiones para ganar puntos y subir en el ranking.</p>
            {DEMO_MISSIONS.map(m => (
                <div key={m.id} className="bg-surface-light border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Flame className="w-6 h-6 text-primary-light" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white group-hover:text-primary-light transition-colors">{m.title}</h3>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-slate-500 font-mono">{m.course}</span>
                                <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Activa</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-gold font-bold">
                            <Star className="w-4 h-4" />
                            +{m.points}
                        </div>
                        <button className="mt-2 text-xs bg-primary/10 text-primary-light px-3 py-1 rounded-full hover:bg-primary/20 transition-colors">
                            Ver Detalle
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}

function RankingPanel() {
    return (
        <div>
            <p className="text-slate-400 mb-6">Ranking general</p>
            <div className="bg-surface-light border border-white/5 rounded-2xl overflow-hidden">
                {DEMO_LEADERBOARD.map((player, i) => (
                    <div key={i} className={`flex items-center justify-between px-6 py-4 border-b border-white/5 last:border-0 ${player.isMe ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}>
                        <div className="flex items-center gap-4">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                ${i === 0 ? 'bg-gold/20 text-gold' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-white/5 text-slate-500'}`}>
                                {player.position}
                            </span>
                            <span className={`font-semibold ${player.isMe ? 'text-primary-light' : 'text-white'}`}>{player.name}</span>
                            {player.isMe && <span className="text-xs bg-primary/20 text-primary-light px-2 py-0.5 rounded-full">Tú</span>}
                        </div>
                        <div className="flex items-center gap-1 text-gold font-bold">
                            <Coins className="w-4 h-4" />
                            {player.points.toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function TiendaPanel() {
    const rewards = [
        { name: 'Punto Extra en Prueba', cost: 500, stock: 5, emoji: '📝' },
        { name: 'Comodín +24h Plazo', cost: 300, stock: 12, emoji: '⏰' },
        { name: 'Avatar Legendario', cost: 1000, stock: 99, emoji: '👑' },
    ]
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((r, i) => (
                <div key={i} className="bg-surface-light border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-all group">
                    <div className="text-4xl mb-4">{r.emoji}</div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary-light transition-colors">{r.name}</h3>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1 text-gold font-bold"><Coins className="w-4 h-4" />{r.cost}</div>
                        <span className="text-xs text-slate-500">{r.stock} disponibles</span>
                    </div>
                    <button className="w-full bg-primary/10 text-primary-light font-semibold py-2.5 rounded-xl hover:bg-primary/20 transition-colors">
                        Canjear
                    </button>
                </div>
            ))}
        </div>
    )
}

function PerfilPanel({ user, totalPoints, belbinRole, belbinCategory }: { user: any, totalPoints: number, belbinRole: string, belbinCategory: string }) {
    const belbinEmoji = belbinRole === 'Cerebro' ? '🧠' :
        belbinRole === 'Impulsor' ? '⚡' :
            belbinRole === 'Coordinador' ? '👑' :
                belbinRole === 'Monitor' ? '🔍' :
                    belbinRole === 'Implementador' ? '⚙️' :
                        belbinRole === 'Cohesionador' ? '🤝' :
                            belbinRole === 'Investigador' ? '🔬' :
                                belbinRole === 'Finalizador' ? '✅' : '🎓'

    return (
        <div className="max-w-lg">
            <div className="bg-surface-light border border-white/5 rounded-2xl p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                    {belbinEmoji}
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{user.name || 'Sin nombre'}</h2>
                <p className="text-slate-400 text-sm mb-2">{user.email}</p>
                {user.student_id && <p className="text-slate-500 text-xs mb-4 font-mono">{user.student_id}</p>}

                {belbinRole !== 'Sin determinar' ? (
                    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full text-primary-light text-sm font-semibold mb-6">
                        <Brain className="w-4 h-4" />
                        Rol Belbin: {belbinRole} {belbinCategory ? `(${belbinCategory})` : ''}
                    </div>
                ) : (
                    <p className="text-slate-500 text-sm mb-6">Aún no has completado el Test Belbin</p>
                )}

                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                    <div>
                        <p className="text-2xl font-black text-gold">{totalPoints.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">Puntos</p>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-primary-light">{user.role === 'student' ? 'Alumno' : 'Docente'}</p>
                        <p className="text-xs text-slate-500">Rol en plataforma</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
