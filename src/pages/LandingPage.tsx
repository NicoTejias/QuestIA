import { Link, useNavigate } from 'react-router-dom'
import { Trophy, Users, Shield, ChevronRight, Sparkles, Target, Gift, BarChart3, LogOut, User } from 'lucide-react'
import { useConvexAuth, useQuery } from "convex/react"
import { useClerk } from "@clerk/clerk-react"
import { api } from "../../convex/_generated/api"
import { useEffect } from 'react'
import { toast } from 'sonner'
import FAQSection from '../components/FAQSection'
import ContactWidget from '../components/ContactWidget'

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
                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/20 p-1.5">
                            <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-xl font-black text-white tracking-tighter italic">
                            Quest<span className="text-primary">IA</span>
                        </span>
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
                        Aumenta la retención y el{' '}
                        <br className="hidden sm:block" />
                        <span className="bg-gradient-to-r from-primary via-primary-light to-white bg-clip-text text-transparent italic">
                            compromiso con tus ramos.
                        </span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-6 leading-relaxed font-medium">
                        Integramos tu modelo educativo y software de gestión educativa para trabajar de manera más fluida, ahorrándote horas de trabajo docente.
                    </p>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                        Incentivamos a tus alumnos de manera positiva mediante <span className="text-primary-light font-bold">rankings, recompensas y premios</span>.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/registro"
                            onClick={() => localStorage.setItem('questia_demo_intent', 'teacher')}
                            className="w-full sm:w-auto group bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all hover:shadow-2xl hover:shadow-primary/30 active:scale-95 flex items-center justify-center gap-3"
                        >
                            <span className="p-1 px-2.5 bg-white/20 rounded-lg text-sm">Probar</span>
                            Modo Docente
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <Link
                            to="/registro"
                            onClick={() => localStorage.setItem('questia_demo_intent', 'student')}
                            className="w-full sm:w-auto group bg-white/5 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-2xl text-lg border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3"
                        >
                            <span className="p-1 px-2.5 bg-primary/20 text-primary-light rounded-lg text-sm">Demo</span>
                            Modo Alumno
                            <User className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                        </Link>
                    </div>
                    
                    <div className="mt-8 space-y-2">
                        <p className="text-sm text-slate-400">
                            <span className="text-primary-light font-bold">✨ Acceso Instantáneo:</span> No necesitas cuenta institucional para probar. Usa tu Gmail personal.
                        </p>
                        <p className="text-[11px] text-slate-600 uppercase tracking-widest font-medium">
                            Los datos de prueba se eliminan automáticamente tras 14 días
                        </p>
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
                <div className="max-w-5xl mx-auto bg-gradient-to-br from-surface-light to-surface border border-white/10 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden group shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_60%)] opacity-5 group-hover:opacity-15 transition-opacity duration-700" />
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-primary/20 group-hover:border-primary/40 transition-colors">
                            <Sparkles className="w-10 h-10 text-primary-light animate-pulse" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
                            Cotiza con nosotros para <br className="hidden md:block" />
                            <span className="bg-gradient-to-r from-primary-light via-white to-primary-light bg-clip-text text-transparent italic">
                                transformar tu sala de clase
                            </span>
                        </h2>
                        <p className="text-slate-400 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                            Impulsa la retención y lleva el compromiso de tus alumnos al siguiente nivel con una plataforma diseñada para facilitar tu labor docente.
                        </p>
                        <a
                            href="mailto:nicolas.tejias@gmail.com"
                            className="inline-flex items-center gap-3 bg-gradient-to-r from-primary to-primary-dark text-white font-bold px-10 py-5 rounded-xl text-lg hover:from-primary-light hover:to-primary hover:shadow-2xl hover:shadow-primary/40 transition-all active:scale-95"
                        >
                            Comunícate con nosotros
                            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <FAQSection />

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 p-1.5 flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm text-slate-500 font-bold italic tracking-tighter">Quest<span className="text-primary">IA</span> © 2026.</span>
                    </div>
                    <div className="flex gap-6 text-sm text-slate-500">
                        <Link to="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
                        <Link to="/terms" className="hover:text-white transition-colors">Términos</Link>
                        <a href="mailto:nicolas.tejias@gmail.com" className="hover:text-white transition-colors">Contacto</a>
                    </div>
                </div>
            </footer>
            <ContactWidget />
        </div>
    );
}
