import { Link, useNavigate } from 'react-router-dom'
import {
    Sparkles,
    Target,
    Trophy,
    Users,
    Calendar,
    FileText,
    MessageSquare,
    Bell,
    LogOut,
    ChevronDown,
    ChevronRight,
    GraduationCap,
    UserCheck,
    PlayCircle,
} from 'lucide-react'
import { useClerk, useUser } from "@clerk/clerk-react"
import { ProfilesAPI } from '../lib/api'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import ContactWidget from '../components/ContactWidget'

const features = [
    {
        icon: <Target className="w-5 h-5" />,
        title: 'Misiones y desafíos',
        description: 'Quizzes generados con IA a partir de tu propio material de clase.',
    },
    {
        icon: <Trophy className="w-5 h-5" />,
        title: 'Ranking y recompensas',
        description: 'Puntajes acumulados, rachas diarias y una tienda de canjes real.',
    },
    {
        icon: <Users className="w-5 h-5" />,
        title: 'Grupos por rol Belbin',
        description: '56 preguntas identifican el rol de equipo y arman grupos equilibrados.',
    },
    {
        icon: <Sparkles className="w-5 h-5" />,
        title: 'Evaluación con IA',
        description: 'Rúbricas automáticas con Gemini para corregir trabajos y entregas.',
    },
    {
        icon: <Calendar className="w-5 h-5" />,
        title: 'Asistencia con QR',
        description: 'Control de asistencia con código QR y geolocalización opcional.',
    },
    {
        icon: <FileText className="w-5 h-5" />,
        title: 'Material de apoyo',
        description: 'Sube PDF y DOCX; el contenido queda listo para generar desafíos.',
    },
    {
        icon: <MessageSquare className="w-5 h-5" />,
        title: 'Chat en tiempo real',
        description: 'Comunicación directa entre docente y alumno, dentro de cada ramo.',
    },
    {
        icon: <Bell className="w-5 h-5" />,
        title: 'Notificaciones push',
        description: 'Alertas de nuevas misiones, logros y mensajes en la app móvil.',
    },
]

const quotes = [
    {
        text: 'Mis alumnos ahora piden hacer un quiz más. La participación en clases subió notoriamente.',
        author: 'Profesora de Electrónica',
    },
    {
        text: 'Generar un desafío desde mi propio material toma minutos, no horas de preparación.',
        author: 'Docente de Formación Técnica',
    },
    {
        text: 'Los grupos por rol Belbin cambiaron la dinámica de los proyectos en equipo.',
        author: 'Jefe de Especialidad',
    },
]

const faqs = [
    { q: '¿Necesito una cuenta institucional para usar QuestIA?', a: 'No. Puedes registrarte con tu Gmail personal y probar la plataforma en modo demo. Los datos de prueba se eliminan automáticamente después de 14 días.' },
    { q: '¿Cómo se generan los quizzes con IA?', a: 'Sube un PDF, DOCX o presentación a la sección de Material. QuestIA usa Google Gemini 2.5 Flash para analizar el contenido y generar preguntas calibradas al nivel de tu curso. Tú revisas y publicas con un clic.' },
    { q: '¿Qué es el perfil Belbin y para qué sirve?', a: 'Belbin es una metodología de 9 roles de equipo. QuestIA aplica un test de 56 preguntas a tus alumnos y luego usa los resultados para generar grupos equilibrados automáticamente, asegurando diversidad de habilidades y roles.' },
    { q: '¿Los alumnos necesitan descargar algo?', a: 'No es necesario. QuestIA funciona como PWA (Progressive Web App) desde el navegador. También ofrecemos un APK para Android si prefieres la experiencia de app nativa.' },
    { q: '¿Cómo funciona la tienda de recompensas?', a: 'Tú defines los beneficios disponibles (décimas extra, extensiones de plazo, ventajas especiales) y su costo en puntos. Los alumnos usan los puntos que acumulan en misiones y quizzes para canjearlos.' },
    { q: '¿Qué tan segura es la plataforma?', a: 'QuestIA usa Clerk para autenticación, Supabase con RLS (Row Level Security) para los datos, y verificación de credenciales por IA. Toda la información está cifrada en tránsito y en reposo.' },
]

export default function LandingPage() {
    const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser()
    const { signOut } = useClerk()
    const navigate = useNavigate()
    const [openFaq, setOpenFaq] = useState<number | null>(null)

    const { data: profile } = useSupabaseQuery(
        () => ProfilesAPI.getProfile(clerkUser?.id || ''),
        [clerkUser],
        { enabled: !!clerkUser }
    )

    useEffect(() => {
        if (isSignedIn && profile) {
            const userRole = profile.role || 'student'
            const target = (userRole === 'teacher' || userRole === 'admin') ? '/docente' : '/alumno'
            navigate(target, { replace: true })
        }
    }, [isSignedIn, profile, navigate])

    const handleLogout = async () => {
        await signOut()
        toast.info("Sesión cerrada. Puedes intentar con otra cuenta.")
    }

    return (
        <div className="min-h-screen bg-[#08090d] text-[#eceef2] overflow-x-hidden" style={{ fontFamily: "'Inter', 'Outfit', system-ui, sans-serif" }}>
            {/* HEADER */}
            <header className="border-b border-white/[0.06] sticky top-0 z-50 bg-[#08090d]/90 backdrop-blur-xl">
                <div className="max-w-[1120px] mx-auto px-6 sm:px-8 flex items-center justify-between h-[68px]">
                    <Link to="/" className="flex items-center gap-2 font-extrabold text-[17px] text-white">
                        <div className="w-[22px] h-[22px] rounded-md bg-iris flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-white" strokeWidth={2.5} />
                        </div>
                        QuestIA
                    </Link>

                    <nav className="hidden lg:flex gap-7">
                        <a href="#producto" className="text-sm text-[#a6a8b3] hover:text-white transition-colors">Producto</a>
                        <a href="#docentes" className="text-sm text-[#a6a8b3] hover:text-white transition-colors">Para docentes</a>
                        <a href="#alumnos" className="text-sm text-[#a6a8b3] hover:text-white transition-colors">Para alumnos</a>
                        <a href="#historias" className="text-sm text-[#a6a8b3] hover:text-white transition-colors">Historias</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        {clerkLoaded && isSignedIn ? (
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-sm text-[#a6a8b3] hover:text-white transition-colors px-3 py-2 rounded-lg"
                            >
                                <LogOut className="w-4 h-4" /> Cerrar sesión
                            </button>
                        ) : (
                            <>
                                <Link to="/login" className="hidden sm:inline-block text-sm text-[#a6a8b3] hover:text-white transition-colors">
                                    Iniciar sesión
                                </Link>
                                <Link
                                    to="/registro"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-iris hover:bg-[#6567f0] text-white transition-colors"
                                >
                                    Comenzar gratis
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* HERO */}
            <section className="pt-20 sm:pt-24 pb-16">
                <div className="max-w-[1120px] mx-auto px-6 sm:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 text-[13px] text-[#a6a8b3] mb-7">
                        <Sparkles className="w-3.5 h-3.5 text-iris-light" />
                        Nuevo: desafíos generados con IA
                    </div>
                    <h1 className="font-extrabold leading-[1.08] tracking-[-0.02em] mb-6 text-[clamp(36px,6vw,60px)] text-white">
                        Gamifica tu sala<br className="hidden sm:block" /> de clases con QuestIA
                    </h1>
                    <p className="text-[17px] sm:text-[18px] text-[#a6a8b3] max-w-[560px] mx-auto mb-10 leading-relaxed">
                        Misiones, puntajes y evaluación con inteligencia artificial. Motiva a tus alumnos y ahorra horas de trabajo docente.
                    </p>

                    {/* Rutas de entrada por rol */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[920px] mx-auto text-left">
                        <Link
                            to="/registro"
                            onClick={() => localStorage.setItem('questia_demo_intent', 'teacher')}
                            className="group flex flex-col justify-between p-6 rounded-[18px] border border-iris/30 hover:border-iris/60 transition-all duration-300 hover:-translate-y-1"
                            style={{ background: 'linear-gradient(160deg, rgba(84,87,229,0.16), transparent 65%)' }}
                        >
                            <div className="w-12 h-12 rounded-xl bg-iris text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <GraduationCap className="w-6 h-6" strokeWidth={2.2} />
                            </div>
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-white mb-1.5">Soy Docente</h3>
                                <p className="text-[13px] text-[#9294a3] leading-relaxed">
                                    Crea tu asignatura, automatiza quizzes con IA y monitorea el progreso de tus alumnos.
                                </p>
                            </div>
                            <span className="inline-flex items-center justify-center gap-1.5 bg-iris group-hover:bg-[#6567f0] text-white text-[13px] font-semibold px-4 py-2.5 rounded-lg transition-colors w-full">
                                Crear mi curso <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                        </Link>

                        <Link
                            to="/registro"
                            onClick={() => localStorage.setItem('questia_demo_intent', 'student')}
                            className="group flex flex-col justify-between p-6 rounded-[18px] bg-white/[0.03] border border-white/10 hover:border-white/25 hover:bg-white/[0.06] transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center mb-4 border border-white/15 group-hover:scale-110 transition-transform">
                                <UserCheck className="w-6 h-6" strokeWidth={2.2} />
                            </div>
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-white mb-1.5">Soy Alumno</h3>
                                <p className="text-[13px] text-[#9294a3] leading-relaxed">
                                    Ingresa a tus misiones, realiza los quizzes de tu curso y canjea tus puntos.
                                </p>
                            </div>
                            <span className="inline-flex items-center justify-center gap-1.5 bg-white/10 group-hover:bg-white/20 text-white text-[13px] font-semibold px-4 py-2.5 rounded-lg transition-colors border border-white/15 w-full">
                                Ingresar como alumno <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                        </Link>

                        <Link
                            to="/login"
                            onClick={() => localStorage.setItem('questia_demo_intent', 'demo')}
                            className="group flex flex-col justify-between p-6 rounded-[18px] border border-white/10 hover:border-white/25 transition-all duration-300 hover:-translate-y-1"
                            style={{ background: 'linear-gradient(160deg, rgba(214,0,108,0.10), transparent 65%)' }}
                        >
                            <div className="w-12 h-12 rounded-xl bg-[#d6006c]/20 text-[#ff7ab8] flex items-center justify-center mb-4 border border-[#d6006c]/30 group-hover:scale-110 transition-transform">
                                <PlayCircle className="w-6 h-6" strokeWidth={2.2} />
                            </div>
                            <div className="mb-4">
                                <span className="inline-block bg-white/10 text-[#cfd0d8] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2">
                                    Prueba rápida
                                </span>
                                <h3 className="text-lg font-bold text-white mb-1.5">Demo Docente</h3>
                                <p className="text-[13px] text-[#9294a3] leading-relaxed">
                                    Explora un curso completo con datos de prueba sin configuración previa.
                                </p>
                            </div>
                            <span className="inline-flex items-center justify-center gap-1.5 bg-white/10 group-hover:bg-white/20 text-white text-[13px] font-semibold px-4 py-2.5 rounded-lg transition-colors border border-white/15 w-full">
                                Ver demo interactiva <Sparkles className="w-3.5 h-3.5" />
                            </span>
                        </Link>
                    </div>

                    <p className="text-[13px] text-[#6b6d78] mt-8">
                        <strong className="text-iris-soft font-semibold">Sin cuenta institucional.</strong> Prueba con tu Gmail personal. Datos demo eliminados tras 14 días.
                    </p>
                </div>

                {/* Vista previa del panel */}
                <div className="max-w-[1120px] mx-auto px-6 sm:px-8 mt-16">
                    <div className="border border-white/[0.08] rounded-[20px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] bg-[#0a0b10]">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                        </div>
                        <div className="aspect-video flex flex-col gap-4 p-5 sm:p-10">
                            <div className="flex gap-3">
                                <div className="w-[3px] bg-iris rounded-sm" />
                                <div className="h-5 w-40 sm:w-56 rounded bg-white/10" />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {['#5457e5', '#22c55e', '#f5a524', '#8890f5'].map((c) => (
                                    <div key={c} className="qi-stat-card">
                                        <div
                                            className="qi-ring"
                                            style={{ background: `conic-gradient(${c} 70%, rgba(255,255,255,0.08) 0)` }}
                                        >
                                            <div className="qi-ring-inner">
                                                <div className="w-[7px] h-[7px] rounded-full" style={{ background: c }} />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-1.5 min-w-0">
                                            <div className="h-3 w-10 rounded bg-white/15" />
                                            <div className="h-2 w-16 rounded bg-white/[0.07]" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="qi-card flex-1 p-5 flex items-end gap-2.5">
                                {[45, 70, 35, 88, 60, 95, 25].map((h, i) => (
                                    <div key={i} className="flex-1 qi-bar" style={{ height: `${h}%` }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FUNCIONES */}
            <section id="producto" className="py-16">
                <div className="max-w-[1120px] mx-auto px-6 sm:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {features.map((f) => (
                            <div
                                key={f.title}
                                className="p-5 border border-white/[0.07] rounded-[14px] bg-white/[0.015] hover:border-white/[0.14] transition-colors"
                            >
                                <div className="text-iris-light">{f.icon}</div>
                                <h4 className="text-[15px] font-semibold text-white mt-3 mb-1.5">{f.title}</h4>
                                <p className="text-[13.5px] text-[#9294a3] leading-relaxed m-0">{f.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* UNA APP PARA CADA ROL */}
            <section className="py-20">
                <div className="max-w-[640px] mx-auto px-6 sm:px-8 text-center mb-12">
                    <h2 className="text-[clamp(28px,4vw,36px)] font-extrabold tracking-[-0.01em] mb-3.5 text-white">Una app para cada rol</h2>
                    <p className="text-base text-[#a6a8b3] m-0">El mismo ramo, dos experiencias hechas a medida.</p>
                </div>
                <div className="max-w-[1120px] mx-auto px-6 sm:px-8 flex flex-col md:flex-row gap-5">
                    <div
                        id="docentes"
                        className="flex-1 p-8 rounded-[18px] border border-white/[0.08]"
                        style={{ background: 'linear-gradient(160deg, rgba(84,87,229,0.12), transparent 60%)' }}
                    >
                        <h3 className="text-xl font-bold mb-2.5 text-white">Para docentes</h3>
                        <p className="text-[14.5px] text-[#a6a8b3] leading-relaxed mb-5">
                            Crea ramos, sube material y genera desafíos con IA en minutos. Analíticas claras de participación y desempeño.
                        </p>
                        <Link
                            to="/registro"
                            onClick={() => localStorage.setItem('questia_demo_intent', 'teacher')}
                            className="text-iris-light hover:text-iris-soft text-sm font-semibold transition-colors"
                        >
                            Ver panel docente →
                        </Link>
                    </div>
                    <div
                        id="alumnos"
                        className="flex-1 p-8 rounded-[18px] border border-white/[0.08]"
                        style={{ background: 'linear-gradient(160deg, rgba(214,0,108,0.10), transparent 60%)' }}
                    >
                        <h3 className="text-xl font-bold mb-2.5 text-white">Para alumnos</h3>
                        <p className="text-[14.5px] text-[#a6a8b3] leading-relaxed mb-5">
                            Resuelve misiones, sube en el ranking y canjea puntos por recompensas reales. Aprender se siente como jugar.
                        </p>
                        <Link
                            to="/registro"
                            onClick={() => localStorage.setItem('questia_demo_intent', 'student')}
                            className="text-iris-light hover:text-iris-soft text-sm font-semibold transition-colors"
                        >
                            Ver panel alumno →
                        </Link>
                    </div>
                </div>
            </section>

            {/* HISTORIAS */}
            <section id="historias" className="pt-10 pb-24">
                <div className="max-w-[1120px] mx-auto px-6 sm:px-8">
                    <h2 className="text-[28px] font-extrabold mb-7 text-white">Lo que dicen los docentes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {quotes.map((q) => (
                            <div key={q.author} className="p-6 border border-white/[0.07] rounded-[14px] bg-white/[0.015]">
                                <p className="text-sm text-[#cfd0d8] leading-relaxed mb-3.5">"{q.text}"</p>
                                <span className="text-[13px] text-[#6b6d78]">{q.author}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="pb-24">
                <div className="max-w-[760px] mx-auto px-6 sm:px-8">
                    <h2 className="text-[28px] font-extrabold mb-7 text-white">Preguntas frecuentes</h2>
                    <div className="flex flex-col gap-2.5">
                        {faqs.map((f, i) => {
                            const isOpen = openFaq === i
                            return (
                                <div
                                    key={f.q}
                                    className={`border rounded-[14px] bg-white/[0.015] overflow-hidden transition-colors ${isOpen ? 'border-iris/30' : 'border-white/[0.07]'}`}
                                >
                                    <button
                                        onClick={() => setOpenFaq(isOpen ? null : i)}
                                        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                                        aria-expanded={isOpen}
                                    >
                                        <span className={`text-[14.5px] font-semibold ${isOpen ? 'text-iris-soft' : 'text-[#eceef2]'}`}>{f.q}</span>
                                        <ChevronDown
                                            className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-iris-light' : 'text-[#6b6d78]'}`}
                                        />
                                    </button>
                                    {isOpen && (
                                        <p className="px-5 pb-4 text-[13.5px] text-[#9294a3] leading-relaxed m-0">{f.a}</p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* CTA FINAL */}
            <section className="py-16 border-t border-white/[0.06]">
                <div className="max-w-[1120px] mx-auto px-6 sm:px-8 text-center">
                    <h2 className="text-[clamp(28px,4vw,38px)] font-extrabold tracking-[-0.01em] mb-4 text-white">Gamifica tu sala de clases hoy</h2>
                    <p className="text-base text-[#a6a8b3] mb-7">Crea tu cuenta docente y arma tu primer ramo en minutos.</p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link
                            to="/registro"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold bg-iris hover:bg-[#6567f0] text-white transition-colors"
                        >
                            Comenzar gratis
                        </Link>
                        <a
                            href="mailto:nicolas.tejias@gmail.com"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold border border-white/[0.14] text-[#eceef2] hover:bg-white/5 transition-colors"
                        >
                            Contáctanos
                            <ChevronRight className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-white/[0.06] py-8">
                <div className="max-w-[1120px] mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#6b6d78]">
                    <span>© {new Date().getFullYear()} QuestIA</span>
                    <div className="flex gap-5">
                        <Link to="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
                        <Link to="/terms" className="hover:text-white transition-colors">Términos</Link>
                        <a href="mailto:nicolas.tejias@gmail.com" className="hover:text-white transition-colors">Contacto</a>
                    </div>
                </div>
            </footer>

            <ContactWidget />
        </div>
    )
}
