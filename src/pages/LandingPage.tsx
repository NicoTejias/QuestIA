import { Link, useNavigate } from 'react-router-dom'
import { Rocket, Trophy, Users, BookOpen, Shield, ChevronRight, Sparkles, Target, Gift, BarChart3, LogOut } from 'lucide-react'
import { useConvexAuth, useQuery } from "convex/react"
import { useClerk } from "@clerk/clerk-react"
import { api } from "../../convex/_generated/api"
import { useEffect } from 'react'
import { toast } from 'sonner'
import FAQSection from '../components/FAQSection'

const features = [
    {
        icon: <Target className="w-7 h-7" />,
        title: "Misiones Gamificadas",
        description: "Transforma tareas en misiones épicas. Los alumnos ganan puntos al completar desafíos académicos."
    },
    {
        icon: <Trophy className="w-7 h-7" />,
        title: "Ranking en Tiempo Real",
        description: "Leaderboard reactivo que se actualiza al instante. Fomenta la competencia sana entre compañeros."
    },
    {
        icon: <Gift className="w-7 h-7" />,
        title: "Tienda de Recompensas",
        description: "Los alumnos canjean sus puntos por beneficios reales: puntos extra, extensiones de plazo y más."
    },
    {
        icon: <Users className="w-7 h-7" />,
        title: "Grupos Inteligentes",
        description: "Algoritmo basado en Belbin que genera equipos equilibrados mezclando perfiles complementarios."
    },
    {
        icon: <BarChart3 className="w-7 h-7" />,
        title: "Analíticas del Curso",
        description: "Visualiza el progreso de tus alumnos con gráficos de rendimiento y participación."
    },
    {
        icon: <Shield className="w-7 h-7" />,
        title: "Seguridad Avanzada",
        description: "Verificación de credenciales por IA, datos cifrados y control de acceso basado en roles."
    },
]

export default function LandingPage() {
    const { isAuthenticated, isLoading } = useConvexAuth()
    const { signOut } = useClerk()
    const navigate = useNavigate()

    const userProfile = useQuery(api.users.getProfile, isAuthenticated ? undefined : "skip")

    // 1. Redirigir al dashboard si ya está autenticado y tenemos su perfil
    useEffect(() => {
        if (isAuthenticated && userProfile) {
            const userRole = (userProfile as any).role || 'student'
            const target = (userRole === 'teacher' || userRole === 'admin') ? '/docente' : '/alumno'
            navigate(target, { replace: true })
        }
    }, [isAuthenticated, userProfile, navigate]);

    const handleLogout = async () => {
        await signOut()
        toast.info("Sesión cerrada. Puedes intentar con otra cuenta.")
    }
    return (
        <div className="min-h-screen bg-surface pb-safe">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-white/5 pt-safe">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                            <Rocket className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">Quest</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {!isLoading && isAuthenticated ? (
                            <button 
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium px-4 py-2"
                            >
                                <LogOut className="w-4 h-4" /> Cerrar Sesión
                            </button>
                        ) : (
                            <>
                                <Link to="/login" className="text-slate-400 hover:text-white transition-colors font-medium px-4 py-2">
                                    Iniciar Sesión
                                </Link>
                                <Link to="/registro" className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-95">
                                    Registrarse
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_50%)] opacity-15" />
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary-light mb-8">
                        <Sparkles className="w-4 h-4" />
                        Plataforma Educativa del Futuro
                    </div>

                    <h1 className="text-4xl md:text-7xl font-black text-white leading-tight mb-8">
                        Gestiona tus ramos.{' '}
                        <br className="hidden sm:block" />
                        <span className="bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent">
                            Motiva a tus alumnos.
                        </span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                        Automatiza tareas, crea misiones gamificadas y transforma tu clase en una experiencia
                        interactiva donde aprender genera recompensas.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/registro"
                            className="group bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all hover:shadow-2xl hover:shadow-primary/30 active:scale-95 flex items-center gap-2"
                        >
                            Comenzar Gratis
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a href="#features" className="text-slate-400 hover:text-white font-medium px-8 py-4 rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                            Ver Características
                        </a>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">Todo lo que necesitas para enseñar mejor</h2>
                        <p className="text-slate-400 text-lg max-w-xl mx-auto">
                            Herramientas diseñadas por y para docentes que quieren transformar la experiencia de aprendizaje.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((f, i) => (
                            <div key={i} className="group bg-surface-light border border-white/5 rounded-2xl p-8 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary-light mb-6 group-hover:bg-primary/20 transition-colors">
                                    {f.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{f.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--color-accent)_0%,_transparent_60%)] opacity-10" />
                    <div className="relative z-10">
                        <BookOpen className="w-12 h-12 text-primary-light mx-auto mb-6" />
                        <h2 className="text-4xl font-bold text-white mb-4">¿Listo para transformar tu clase?</h2>
                        <p className="text-slate-300 text-lg mb-8 max-w-lg mx-auto">
                            Únete a la comunidad de docentes que ya están motivando a sus alumnos con gamificación.
                        </p>
                        <Link
                            to="/registro"
                            className="inline-flex items-center gap-2 bg-white text-surface font-bold px-8 py-4 rounded-2xl text-lg hover:bg-slate-100 transition-all active:scale-95"
                        >
                            Crear Cuenta Gratis
                            <ChevronRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <FAQSection />

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                            <Rocket className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm text-slate-500">© 2026 Quest. Todos los derechos reservados.</span>
                    </div>
                    <div className="flex gap-6 text-sm text-slate-500">
                        <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                        <a href="#" className="hover:text-white transition-colors">Términos</a>
                        <a href="#" className="hover:text-white transition-colors">Contacto</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
