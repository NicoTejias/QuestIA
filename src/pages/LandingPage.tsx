import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, ChevronRight, ChevronDown, Target, Trophy, Gift, Users, BarChart3, Grid3x3, LogOut, GraduationCap, UserCheck, PlayCircle } from 'lucide-react'
import { useClerk, useUser } from "@clerk/clerk-react"
import { ProfilesAPI } from '../lib/api'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import ContactWidget from '../components/ContactWidget'

const pillars = [
    {
        num: '01',
        title: 'Gamificación real',
        description: 'Misiones, puntos, rankings en tiempo real y una tienda de recompensas que los alumnos realmente quieren usar. Competencia sana, motivación sostenida.',
        color: 'primary',
        icon: <Target className="w-[22px] h-[22px]" strokeWidth={2} />
    },
    {
        num: '02',
        title: 'Inteligencia Artificial',
        description: 'Sube tus materiales y Gemini genera quizzes al instante. Evalúa trabajos con rúbricas automáticas y recibe feedback personalizado para cada alumno.',
        color: 'blue',
        icon: <Sparkles className="w-[22px] h-[22px]" strokeWidth={2} />
    },
    {
        num: '03',
        title: 'Analíticas docentes',
        description: 'Visualiza el rendimiento, participación y tendencias de tus cursos en tiempo real. Toma decisiones pedagógicas con datos, no suposiciones.',
        color: 'green',
        icon: <Grid3x3 className="w-[22px] h-[22px]" strokeWidth={2} />
    },
]

const features = [
    { icon: <Target className="w-[22px] h-[22px]" />, title: "Misiones Gamificadas", description: "Transforma tareas en misiones épicas. Los alumnos ganan puntos al completar desafíos académicos y se mantienen motivados durante todo el semestre." },
    { icon: <Trophy className="w-[22px] h-[22px]" />, title: "Ranking en Tiempo Real", description: "Leaderboard reactivo que se actualiza al instante. Fomenta la competencia sana y el compromiso continuo entre compañeros de curso." },
    { icon: <Gift className="w-[22px] h-[22px]" />, title: "Tienda de Recompensas", description: "Los alumnos canjean puntos por beneficios reales: puntos extra, extensiones de plazo, ventajas en evaluaciones. Tú defines las reglas." },
    { icon: <Users className="w-[22px] h-[22px]" />, title: "Grupos Inteligentes", description: "Algoritmo basado en perfiles Belbin que genera equipos equilibrados y complementarios automáticamente, ahorrando horas de planificación." },
    { icon: <BarChart3 className="w-[22px] h-[22px]" />, title: "Analíticas del Curso", description: "Visualiza el progreso de tus alumnos con gráficos de rendimiento, participación y tendencias. Identifica quién necesita más apoyo a tiempo." },
    { icon: <Sparkles className="w-[22px] h-[22px]" />, title: "Evaluación con IA", description: "Sube un documento y Gemini genera un quiz listo para aplicar. Rúbricas automáticas y feedback instantáneo personalizado para cada estudiante." },
]

const stats = [
    { value: '3×', label: 'más participación' },
    { value: '56', label: 'preguntas Belbin' },
    { value: '∞', label: 'quizzes con IA' },
    { value: '0', label: 'horas extra corrigiendo' },
]

const steps = [
    { num: '01', title: 'Crea tu ramo y carga tu lista de alumnos', description: 'Registra tu asignatura, sube la nómina en CSV o ingresa los RUTs manualmente. QuestIA configura el acceso automáticamente para cada estudiante.' },
    { num: '02', title: 'Sube tu material y genera quizzes con IA', description: 'Comparte PDF, DOCX o PPT. Gemini analiza el contenido y genera quizzes calibrados al nivel de tu curso en segundos. Tú revisas y publicas.' },
    { num: '03', title: 'Activa misiones y define las recompensas', description: 'Crea desafíos con fechas, puntos y condiciones. Diseña tu tienda de recompensas: los alumnos se auto-motivan para completar cada misión.' },
    { num: '04', title: 'Analiza, ajusta y celebra los logros', description: 'Monitorea el avance en tiempo real. Identifica alumnos en riesgo, celebra los hitos del curso y ajusta la dificultad según los datos.' },
]

const faqs = [
    { q: '¿Necesito una cuenta institucional para usar QuestIA?', a: 'No. Puedes registrarte con tu Gmail personal y probar la plataforma en modo demo. Los datos de prueba se eliminan automáticamente después de 14 días.' },
    { q: '¿Cómo se generan los quizzes con IA?', a: 'Sube un PDF, DOCX o presentación a la sección de Material. QuestIA usa Google Gemini 2.5 Flash para analizar el contenido y generar preguntas calibradas al nivel de tu curso. Tú revisas y publicas con un clic.' },
    { q: '¿Qué es el perfil Belbin y para qué sirve?', a: 'Belbin es una metodología de 9 roles de equipo. QuestIA aplica un test de 56 preguntas a tus alumnos y luego usa los resultados para generar grupos equilibrados automáticamente, asegurando diversidad de habilidades y roles.' },
    { q: '¿Los alumnos necesitan descargar algo?', a: 'No es necesario. QuestIA funciona como PWA (Progressive Web App) desde el navegador. También ofrecemos un APK para Android si prefieres la experiencia de app nativa.' },
    { q: '¿Cómo funciona la tienda de recompensas?', a: 'Tú defines los beneficios disponibles (décimas extra, extensiones de plazo, ventajas especiales) y su costo en puntos. Los alumnos usan los puntos que acumulan en misiones y quizzes para canjearlos.' },
    { q: '¿Qué tan segura es la plataforma?', a: 'QuestIA usa Clerk para autenticación, Supabase con RLS (Row Level Security) para los datos, y verificación de credenciales por IA. Toda la información está cifrada en tránsito y en reposo.' },
]

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef<HTMLDivElement>(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (!ref.current) return
        const el = ref.current
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        setVisible(true)
                        observer.unobserve(el)
                    }
                })
            },
            { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
            style={{ transitionDelay: `${delay * 100}ms` }}
        >
            {children}
        </div>
    )
}

export default function LandingPage() {
    const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser()
    const { signOut } = useClerk()
    const navigate = useNavigate()
    const [scrolled, setScrolled] = useState(false)
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

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const handleLogout = async () => {
        await signOut()
        toast.info("Sesión cerrada. Puedes intentar con otra cuenta.")
    }

    return (
        <div className="min-h-screen bg-[#08080e] text-[#f0f0f8] overflow-x-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {/* NAVBAR */}
            <nav
                className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/5 transition-colors duration-300 ${scrolled ? 'bg-[#08080e]/[0.97]' : 'bg-[#08080e]/85'}`}
            >
                <div className="max-w-[1160px] mx-auto px-7 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-[34px] h-[34px] rounded-[9px] bg-primary/[0.14] border border-primary/25 flex items-center justify-center">
                            <Sparkles className="w-[17px] h-[17px] text-primary" strokeWidth={2} />
                        </div>
                        <span className="text-[18px] font-black text-white italic tracking-[-0.5px]">
                            Quest<span className="text-primary">IA</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <a href="#features" className="hidden md:inline-block text-sm font-semibold text-[#7070a0] hover:text-[#f0f0f8] hover:bg-white/5 px-3.5 py-2 rounded-lg transition-all">Funciones</a>
                        <a href="#how" className="hidden md:inline-block text-sm font-semibold text-[#7070a0] hover:text-[#f0f0f8] hover:bg-white/5 px-3.5 py-2 rounded-lg transition-all">Cómo funciona</a>
                        <a href="#faq" className="hidden md:inline-block text-sm font-semibold text-[#7070a0] hover:text-[#f0f0f8] hover:bg-white/5 px-3.5 py-2 rounded-lg transition-all">FAQ</a>
                        {clerkLoaded && isSignedIn ? (
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-sm font-semibold text-[#7070a0] hover:text-white transition-colors px-3.5 py-2 rounded-lg"
                            >
                                <LogOut className="w-4 h-4" /> Cerrar Sesión
                            </button>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-semibold text-[#7070a0] hover:text-[#f0f0f8] hover:bg-white/5 px-3.5 py-2 rounded-lg transition-all">
                                    Iniciar sesión
                                </Link>
                                <Link
                                    to="/registro"
                                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-[#0a0a0a] font-extrabold text-[13px] px-[18px] py-[9px] rounded-[9px] transition-all hover:shadow-[0_6px_24px_rgba(255,214,51,0.25)] hover:-translate-y-0.5 active:scale-[0.97] tracking-[-0.2px]"
                                >
                                    Comenzar gratis
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* HERO */}
            <section id="hero" className="relative min-h-screen flex items-center pt-[120px] pb-20 overflow-hidden">
                <div
                    className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at center, rgba(255,214,51,0.08) 0%, transparent 70%)' }}
                />
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                        maskImage: 'radial-gradient(ellipse at center top, rgba(0,0,0,0.4) 0%, transparent 70%)',
                        WebkitMaskImage: 'radial-gradient(ellipse at center top, rgba(0,0,0,0.4) 0%, transparent 70%)',
                    }}
                />

                <div className="relative z-10 max-w-[1160px] mx-auto px-7 flex flex-col items-center text-center w-full">
                    <Reveal>
                        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/[0.22] rounded-full px-4 py-1.5 mb-7 text-xs font-extrabold text-primary uppercase tracking-[1px]">
                            <Sparkles className="w-3 h-3 fill-primary" />
                            Plataforma Educativa con IA
                        </div>
                    </Reveal>

                    <Reveal delay={1}>
                        <h1 className="font-black text-white leading-[1.12] tracking-[-3px] mb-12 max-w-[820px] text-[clamp(40px,6vw,76px)]">
                            Motiva a tus alumnos.<br />
                            <em className="not-italic font-black italic text-primary">Simplifica tu docencia.</em>
                        </h1>
                    </Reveal>

                    <Reveal delay={2}>
                        <p className="text-[#7070a0] font-medium leading-[1.65] mb-10 max-w-[560px] text-[clamp(16px,2vw,19px)]">
                            QuestIA transforma tus ramos en experiencias gamificadas. Misiones, rankings, recompensas y evaluación automática con inteligencia artificial, todo en un solo lugar.
                        </p>
                    </Reveal>

                    <Reveal delay={3}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-[920px] mb-14 text-left">
                            {/* Botón 1: Soy Docente */}
                            <Link
                                to="/registro"
                                onClick={() => localStorage.setItem('questia_demo_intent', 'teacher')}
                                className="group relative flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-b from-primary/20 via-primary/10 to-transparent border border-primary/40 hover:border-primary transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,214,51,0.25)] hover:-translate-y-1"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary text-[#0a0a0a] flex items-center justify-center mb-4 shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                                    <GraduationCap className="w-6 h-6" strokeWidth={2.5} />
                                </div>
                                <div className="mb-4">
                                    <h3 className="text-lg font-black text-white mb-1 flex items-center gap-2">
                                        Soy Docente
                                    </h3>
                                    <p className="text-xs text-[#9090c0] font-medium leading-relaxed">
                                        Crea tu asignatura, automatiza quizzes con IA y monitorea el progreso de tus alumnos.
                                    </p>
                                </div>
                                <span className="inline-flex items-center justify-center gap-1.5 bg-primary text-[#0a0a0a] text-xs font-extrabold px-4 py-2.5 rounded-lg group-hover:bg-primary-light transition-colors w-full">
                                    Crear mi Curso <ChevronRight className="w-3.5 h-3.5" />
                                </span>
                            </Link>

                            {/* Botón 2: Soy Alumno */}
                            <Link
                                to="/registro"
                                onClick={() => localStorage.setItem('questia_demo_intent', 'student')}
                                className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/25 hover:bg-white/[0.06] transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center mb-4 border border-white/15 group-hover:scale-110 transition-transform">
                                    <UserCheck className="w-6 h-6" strokeWidth={2.5} />
                                </div>
                                <div className="mb-4">
                                    <h3 className="text-lg font-black text-white mb-1 flex items-center gap-2">
                                        Soy Alumno
                                    </h3>
                                    <p className="text-xs text-[#9090c0] font-medium leading-relaxed">
                                        Ingresa a tus misiones, realiza los quizzes de tu curso y canjea tus puntos.
                                    </p>
                                </div>
                                <span className="inline-flex items-center justify-center gap-1.5 bg-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-lg group-hover:bg-white/20 transition-colors border border-white/15 w-full">
                                    Ingresar como Alumno <ChevronRight className="w-3.5 h-3.5" />
                                </span>
                            </Link>

                            {/* Botón 3: Demo Docente */}
                            <Link
                                to="/login"
                                onClick={() => localStorage.setItem('questia_demo_intent', 'demo')}
                                className="group relative flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-b from-blue-500/15 via-blue-500/5 to-transparent border border-blue-500/30 hover:border-blue-400 transition-all duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] hover:-translate-y-1"
                            >
                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/30 group-hover:scale-110 transition-transform">
                                    <PlayCircle className="w-6 h-6" strokeWidth={2.5} />
                                </div>
                                <div className="mb-4">
                                    <div className="inline-block bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-1">
                                        Prueba Rápida
                                    </div>
                                    <h3 className="text-lg font-black text-white mb-1 flex items-center gap-2">
                                        Demo Docente
                                    </h3>
                                    <p className="text-xs text-[#9090c0] font-medium leading-relaxed">
                                        Explora un curso completo con datos de prueba sin configuración previa.
                                    </p>
                                </div>
                                <span className="inline-flex items-center justify-center gap-1.5 bg-blue-500/20 text-blue-300 text-xs font-bold px-4 py-2.5 rounded-lg group-hover:bg-blue-500/30 transition-colors border border-blue-500/30 w-full">
                                    Ver Demo Interactiva <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                                </span>
                            </Link>
                        </div>
                    </Reveal>

                    <Reveal delay={3}>
                        <p className="text-xs text-[#3a3a5a] font-semibold tracking-[0.3px]">
                            <strong className="text-primary">✨ Sin cuenta institucional.</strong> Prueba con tu Gmail personal. Datos demo eliminados tras 14 días.
                        </p>
                    </Reveal>

                    <Reveal delay={4}>
                        <div className="flex gap-8 flex-wrap justify-center items-center mt-12 max-md:flex-col max-md:gap-3">
                            <div className="flex items-center gap-2 text-[13px] text-[#7070a0] font-semibold">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Generación de quizzes con Gemini AI
                            </div>
                            <div className="flex items-center gap-2 text-[13px] text-[#7070a0] font-semibold">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Grupos Belbin automáticos
                            </div>
                            <div className="flex items-center gap-2 text-[13px] text-[#7070a0] font-semibold">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                App móvil incluida
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* PILLARS */}
            <section id="pillars" className="py-24 bg-[#0f0f1a]">
                <div className="max-w-[1160px] mx-auto px-7">
                    <Reveal>
                        <span className="inline-flex items-center gap-[7px] text-[11px] font-extrabold text-[#4488ff] uppercase tracking-[2px] mb-3.5 before:content-[''] before:w-5 before:h-0.5 before:bg-[#4488ff] before:rounded" >
                            Núcleo de la plataforma
                        </span>
                    </Reveal>
                    <Reveal delay={1}>
                        <h2 className="font-black text-white leading-[1.1] tracking-[-1.5px] mb-3.5 text-[clamp(28px,4vw,46px)]">
                            Tres pilares que<br />
                            <em className="not-italic italic text-primary">transforman tu sala de clases</em>
                        </h2>
                    </Reveal>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5 bg-white/5 rounded-[20px] overflow-hidden mt-14">
                        {pillars.map((p, i) => (
                            <Reveal key={p.num} delay={i + 1}>
                                <div className="bg-[#0f0f1a] p-9 flex flex-col gap-3.5 h-full">
                                    <span className="text-[11px] font-extrabold text-[#3a3a5a] uppercase tracking-[2px]">{p.num}</span>
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                                        p.color === 'primary' ? 'bg-primary/[0.08] border-primary/[0.14] text-primary' :
                                        p.color === 'blue' ? 'bg-[#0050ff]/10 border-[#0050ff]/[0.18] text-[#4488ff]' :
                                        'bg-emerald-500/10 border-emerald-500/[0.18] text-emerald-500'
                                    }`}>
                                        {p.icon}
                                    </div>
                                    <h3 className="text-xl font-extrabold text-white tracking-[-0.5px]">{p.title}</h3>
                                    <p className="text-sm text-[#7070a0] leading-[1.65] font-medium">{p.description}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="py-24 bg-[#08080e]">
                <div className="max-w-[1160px] mx-auto px-7">
                    <Reveal>
                        <span className="inline-flex items-center gap-[7px] text-[11px] font-extrabold text-[#4488ff] uppercase tracking-[2px] mb-3.5 before:content-[''] before:w-5 before:h-0.5 before:bg-[#4488ff] before:rounded">
                            Funcionalidades
                        </span>
                    </Reveal>
                    <Reveal delay={1}>
                        <h2 className="font-black text-white leading-[1.1] tracking-[-1.5px] mb-3.5 text-[clamp(28px,4vw,46px)]">
                            Todo lo que necesitas para<br />
                            <em className="not-italic italic text-primary">enseñar mejor</em>
                        </h2>
                    </Reveal>
                    <Reveal delay={2}>
                        <p className="text-[17px] text-[#7070a0] font-medium max-w-[520px] leading-[1.65]">
                            Herramientas diseñadas por y para docentes que quieren transformar la experiencia de aprendizaje sin perder horas en gestión.
                        </p>
                    </Reveal>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-14">
                        {features.map((f, i) => (
                            <Reveal key={f.title} delay={(i % 3) + 1}>
                                <div className="bg-[#0f0f1a] border border-white/5 rounded-[18px] p-7 flex flex-col gap-3.5 h-full transition-all hover:border-primary/20 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(255,214,51,0.06)]">
                                    <div className="w-[46px] h-[46px] rounded-xl bg-primary/[0.08] border border-primary/[0.14] flex items-center justify-center text-primary">
                                        {f.icon}
                                    </div>
                                    <h3 className="text-[17px] font-extrabold text-white tracking-[-0.3px]">{f.title}</h3>
                                    <p className="text-sm text-[#7070a0] leading-[1.65] font-medium">{f.description}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* STATS */}
            <section className="py-16 bg-[#0f0f1a] border-y border-white/5">
                <div className="max-w-[1160px] mx-auto px-7">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5">
                        {stats.map((s, i) => (
                            <Reveal key={s.label} delay={i}>
                                <div className="bg-[#0f0f1a] px-6 py-8 text-center">
                                    <div className="text-[42px] font-black text-primary tracking-[-2px] leading-none mb-2">{s.value}</div>
                                    <div className="text-[13px] text-[#7070a0] font-semibold uppercase tracking-[0.5px]">{s.label}</div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how" className="py-24 bg-[#08080e]">
                <div className="max-w-[780px] mx-auto px-7">
                    <Reveal>
                        <span className="inline-flex items-center gap-[7px] text-[11px] font-extrabold text-[#4488ff] uppercase tracking-[2px] mb-3.5 before:content-[''] before:w-5 before:h-0.5 before:bg-[#4488ff] before:rounded">
                            Proceso
                        </span>
                    </Reveal>
                    <Reveal delay={1}>
                        <h2 className="font-black text-white leading-[1.1] tracking-[-1.5px] mb-3.5 text-[clamp(28px,4vw,46px)]">
                            Empieza en minutos,<br />
                            <em className="not-italic italic text-primary">impacta todo el semestre</em>
                        </h2>
                    </Reveal>

                    <div className="flex flex-col mt-14">
                        {steps.map((s, i) => (
                            <Reveal key={s.num} delay={i}>
                                <div className={`grid grid-cols-[48px_1fr] md:grid-cols-[64px_1fr] gap-4 md:gap-6 items-start py-7 ${i < steps.length - 1 ? 'border-b border-white/5' : ''}`}>
                                    <div className="w-12 h-12 rounded-xl bg-primary/[0.08] border border-primary/[0.18] flex items-center justify-center text-lg font-black text-primary tracking-[-1px] flex-shrink-0 mt-0.5">
                                        {s.num}
                                    </div>
                                    <div>
                                        <h3 className="text-[19px] font-extrabold text-white tracking-[-0.3px] mb-1.5">{s.title}</h3>
                                        <p className="text-sm text-[#7070a0] leading-[1.7] font-medium max-w-[560px]">{s.description}</p>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 bg-[#0f0f1a]">
                <div className="max-w-[1160px] mx-auto px-7">
                    <Reveal>
                        <div className="bg-[#151525] border border-white/[0.08] rounded-[28px] p-10 md:p-16 text-center relative overflow-hidden">
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,214,51,0.07) 0%, transparent 60%)' }}
                            />
                            <div className="text-5xl mb-5 relative z-10">✨</div>
                            <h2 className="font-black text-white leading-[1.1] tracking-[-2px] mb-4 text-[clamp(28px,4vw,48px)] relative z-10">
                                ¿Listo para transformar<br />
                                <em className="not-italic italic text-primary">tu sala de clases?</em>
                            </h2>
                            <p className="text-[17px] text-[#7070a0] max-w-[480px] mx-auto mb-9 leading-[1.65] font-medium relative z-10">
                                Cotiza con nosotros y lleva el compromiso de tus alumnos al siguiente nivel. Sin instalaciones, sin complicaciones.
                            </p>
                            <div className="flex gap-3 justify-center flex-wrap relative z-10">
                                <a
                                    href="mailto:nicolas.tejias@gmail.com"
                                    className="inline-flex items-center gap-2.5 bg-primary hover:bg-primary-light text-[#0a0a0a] font-extrabold text-base px-8 py-4 rounded-[14px] transition-all hover:shadow-[0_8px_32px_rgba(255,214,51,0.3)] hover:-translate-y-0.5 active:scale-[0.97]"
                                >
                                    Contáctanos ahora
                                    <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                                </a>
                                <Link
                                    to="/registro"
                                    className="inline-flex items-center gap-2 bg-transparent text-[#f0f0f8] font-bold text-[15px] px-7 py-[13px] rounded-xl border border-white/5 hover:border-white/20 hover:bg-white/[0.04] transition-all"
                                >
                                    Crear cuenta gratis
                                </Link>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="py-24 bg-[#08080e]">
                <div className="max-w-[780px] mx-auto px-7">
                    <Reveal>
                        <span className="inline-flex items-center gap-[7px] text-[11px] font-extrabold text-[#4488ff] uppercase tracking-[2px] mb-3.5 before:content-[''] before:w-5 before:h-0.5 before:bg-[#4488ff] before:rounded">
                            Preguntas frecuentes
                        </span>
                    </Reveal>
                    <Reveal delay={1}>
                        <h2 className="font-black text-white leading-[1.1] tracking-[-1.5px] mb-3.5 text-[clamp(28px,4vw,46px)]">
                            Todo lo que<br />
                            <em className="not-italic italic text-primary">necesitas saber</em>
                        </h2>
                    </Reveal>

                    <div className="flex flex-col gap-2 mt-12">
                        {faqs.map((f, i) => {
                            const isOpen = openFaq === i
                            return (
                                <Reveal key={i} delay={Math.min(i + 1, 6)}>
                                    <div className={`bg-[#0f0f1a] border rounded-[14px] overflow-hidden transition-colors ${isOpen ? 'border-primary/20' : 'border-white/5'}`}>
                                        <button
                                            onClick={() => setOpenFaq(isOpen ? null : i)}
                                            className={`w-full flex items-center justify-between px-6 py-5 gap-4 text-left text-base font-bold transition-colors ${isOpen ? 'text-primary-light' : 'text-[#f0f0f8] hover:text-white'}`}
                                        >
                                            {f.q}
                                            <ChevronDown className={`w-[18px] h-[18px] flex-shrink-0 transition-transform ${isOpen ? 'rotate-180 stroke-primary' : 'stroke-[#3a3a5a]'}`} strokeWidth={2} />
                                        </button>
                                        <div
                                            className="overflow-hidden transition-all duration-300 ease-in-out"
                                            style={{ maxHeight: isOpen ? '300px' : '0', padding: isOpen ? '0 24px 22px' : '0 24px' }}
                                        >
                                            <p className="text-sm text-[#7070a0] leading-[1.75] font-medium">{f.a}</p>
                                        </div>
                                    </div>
                                </Reveal>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-[#08080e] border-t border-white/5 py-10">
                <div className="max-w-[1160px] mx-auto px-7">
                    <div className="flex items-center justify-between flex-wrap gap-5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-[7px] bg-primary/[0.14] border border-primary/25 flex items-center justify-center">
                                <Sparkles className="w-[13px] h-[13px] text-primary" strokeWidth={2} />
                            </div>
                            <span className="text-xs text-[#3a3a5a] font-semibold italic">
                                Quest<span className="text-primary">IA</span> © 2026
                            </span>
                        </div>
                        <div className="flex gap-5">
                            <Link to="/privacy" className="text-[13px] text-[#3a3a5a] hover:text-[#7070a0] transition-colors font-semibold">Privacidad</Link>
                            <Link to="/terms" className="text-[13px] text-[#3a3a5a] hover:text-[#7070a0] transition-colors font-semibold">Términos</Link>
                            <a href="mailto:nicolas.tejias@gmail.com" className="text-[13px] text-[#3a3a5a] hover:text-[#7070a0] transition-colors font-semibold">Contacto</a>
                        </div>
                    </div>
                </div>
            </footer>

            <ContactWidget />
        </div>
    )
}
