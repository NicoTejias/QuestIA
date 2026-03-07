import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Brain, ChevronRight, ChevronLeft, CheckCircle, Rocket, Loader2 } from 'lucide-react'

const PREGUNTAS_BELBIN = [
    {
        pregunta: "Cuando trabajo en equipo, yo suelo...",
        opciones: [
            { texto: "Proponer ideas originales y creativas.", rol: "Cerebro" },
            { texto: "Organizar y coordinar al grupo.", rol: "Coordinador" },
            { texto: "Impulsar al equipo a tomar acción.", rol: "Impulsor" },
            { texto: "Investigar recursos fuera del grupo.", rol: "Investigador" },
        ]
    },
    {
        pregunta: "Ante un problema difícil, mi primera reacción es...",
        opciones: [
            { texto: "Analizar los datos con objetividad.", rol: "Monitor" },
            { texto: "Buscar la solución más práctica e implementable.", rol: "Implementador" },
            { texto: "Facilitar la comunicación entre los miembros.", rol: "Cohesionador" },
            { texto: "Asegurarme de que no se nos escape ningún detalle.", rol: "Finalizador" },
        ]
    },
    {
        pregunta: "Lo que más valoro en un equipo es...",
        opciones: [
            { texto: "La innovación y el pensamiento fuera de la caja.", rol: "Cerebro" },
            { texto: "La eficiencia y el cumplimiento de plazos.", rol: "Implementador" },
            { texto: "La armonía y el bienestar del grupo.", rol: "Cohesionador" },
            { texto: "Un liderazgo claro y la delegación efectiva.", rol: "Coordinador" },
        ]
    },
    {
        pregunta: "Mis compañeros suelen valorar de mi que...",
        opciones: [
            { texto: "Traigo contactos y recursos externos.", rol: "Investigador" },
            { texto: "Hago las cosas bien hasta el último detalle.", rol: "Finalizador" },
            { texto: "Desafío las ideas para mejorarlas.", rol: "Impulsor" },
            { texto: "Ofrezco juicios estratégicos acertados.", rol: "Monitor" },
        ]
    },
    {
        pregunta: "Si tuviera que elegir un superpoder sería...",
        opciones: [
            { texto: "Creatividad ilimitada para resolver cualquier cosa.", rol: "Cerebro" },
            { texto: "Velocidad para ejecutar planes sin errores.", rol: "Implementador" },
            { texto: "Empatía para entender a todos.", rol: "Cohesionador" },
            { texto: "Visión de rayos X para detectar cada fallo.", rol: "Finalizador" },
        ]
    },
]

export default function BelbinTest() {
    const [currentQ, setCurrentQ] = useState(0)
    const [respuestas, setRespuestas] = useState<string[]>([])
    const [resultado, setResultado] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [resultCategory, setResultCategory] = useState('')
    const saveBelbin = useMutation(api.users.saveBelbinProfile)
    const user = useQuery(api.users.me)
    const navigate = useNavigate()

    const handleAnswer = (rol: string) => {
        const nuevas = [...respuestas, rol]
        setRespuestas(nuevas)

        if (currentQ < PREGUNTAS_BELBIN.length - 1) {
            setCurrentQ(currentQ + 1)
        } else {
            // Calcular rol dominante
            const conteo: Record<string, number> = {}
            nuevas.forEach(r => { conteo[r] = (conteo[r] || 0) + 1 })
            const dominant = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0][0]
            setResultado(dominant)

            // Determinar categoría
            const catMap: Record<string, string> = {
                'Cerebro': 'Mental', 'Monitor': 'Mental',
                'Coordinador': 'Social', 'Investigador': 'Social', 'Cohesionador': 'Social',
                'Impulsor': 'Acción', 'Implementador': 'Acción', 'Finalizador': 'Acción',
            }
            const category = catMap[dominant] || 'Especial'
            setResultCategory(category)

            // Guardar en Convex
            setSaving(true)
            saveBelbin({
                role_dominant: dominant,
                category,
                scores: conteo,
            }).then(() => setSaving(false))
                .catch(() => setSaving(false))
        }
    }

    const progress = ((currentQ + (resultado ? 1 : 0)) / PREGUNTAS_BELBIN.length) * 100

    // Pantalla de Resultado
    if (resultado) {
        const rolDescriptions: Record<string, { emoji: string, desc: string, category: string }> = {
            "Cerebro": { emoji: "🧠", desc: "Eres creativo y generador de ideas originales. Sobresales resolviendo problemas complejos de formas no convencionales.", category: "Mental" },
            "Monitor": { emoji: "🔍", desc: "Eres analítico y estratégico. Evalúas todas las opciones con objetividad antes de tomar decisiones.", category: "Mental" },
            "Coordinador": { emoji: "👑", desc: "Eres un líder natural. Sabes delegar, identificar talentos y mantener al equipo enfocado en los objetivos.", category: "Social" },
            "Investigador": { emoji: "🌐", desc: "Eres extrovertido y entusiasta. Exploras oportunidades y traes ideas y contactos del exterior.", category: "Social" },
            "Cohesionador": { emoji: "🤝", desc: "Eres diplomático y perceptivo. Creas armonía en el equipo y resuelves conflictos con facilidad.", category: "Social" },
            "Impulsor": { emoji: "⚡", desc: "Eres dinámico y desafías al equipo a mejorar. Tu energía empuja al grupo a superar obstáculos.", category: "Acción" },
            "Implementador": { emoji: "⚙️", desc: "Eres disciplinado y confiable. Conviertes las ideas en planes de acción prácticos y eficientes.", category: "Acción" },
            "Finalizador": { emoji: "🎯", desc: "Eres perfeccionista y meticuloso. Te aseguras de que todo esté impecable antes de entregar.", category: "Acción" },
        }
        const info = rolDescriptions[resultado] || { emoji: "✨", desc: "Tienes un perfil único.", category: "Especial" }

        return (
            <div className="min-h-screen bg-surface flex items-center justify-center p-6">
                <div className="max-w-lg w-full text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl animate-bounce">
                        {info.emoji}
                    </div>
                    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary-light mb-4">
                        <CheckCircle className="w-4 h-4" /> Test Completado
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2">Tu rol es: {resultado}</h1>
                    <span className="inline-block bg-surface-light text-slate-300 text-sm font-semibold px-3 py-1 rounded-full mb-6">Categoría: {info.category}</span>
                    <p className="text-slate-400 text-lg leading-relaxed mb-10">{info.desc}</p>

                    {saving && (
                        <div className="flex items-center justify-center gap-2 text-primary-light mb-6">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm">Guardando tu perfil...</span>
                        </div>
                    )}

                    <button
                        onClick={() => navigate(user?.role === 'teacher' ? '/docente' : '/alumno')}
                        className="bg-primary hover:bg-primary-light text-white font-bold px-8 py-4 rounded-2xl transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-95 flex items-center justify-center gap-2 mx-auto"
                    >
                        <Rocket className="w-5 h-5" />
                        Ir a mi Dashboard
                    </button>
                </div>
            </div>
        )
    }

    const pregunta = PREGUNTAS_BELBIN[currentQ]

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6">
            <div className="max-w-2xl w-full">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <Brain className="w-8 h-8 text-primary-light" />
                    <div>
                        <h1 className="text-2xl font-bold text-white">Test de Perfil (Belbin)</h1>
                        <p className="text-slate-400 text-sm">Descubre tu rol ideal en un equipo de trabajo.</p>
                    </div>
                </div>

                {/* Barra de Progreso */}
                <div className="w-full bg-surface-light rounded-full h-2.5 mb-2">
                    <div
                        className="bg-gradient-to-r from-primary to-accent h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-xs text-slate-500 mb-8">Pregunta {currentQ + 1} de {PREGUNTAS_BELBIN.length}</p>

                {/* Pregunta */}
                <h2 className="text-2xl font-bold text-white mb-8">{pregunta.pregunta}</h2>

                {/* Opciones */}
                <div className="space-y-4">
                    {pregunta.opciones.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => handleAnswer(opt.rol)}
                            className="w-full text-left bg-surface-light border border-white/5 rounded-2xl p-5 hover:border-primary/40 hover:bg-surface-lighter transition-all duration-200 group flex items-center gap-4"
                        >
                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 font-bold group-hover:bg-primary/20 group-hover:text-primary-light transition-colors shrink-0">
                                {String.fromCharCode(65 + i)}
                            </div>
                            <span className="text-slate-300 group-hover:text-white transition-colors">{opt.texto}</span>
                            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-primary-light ml-auto transition-colors" />
                        </button>
                    ))}
                </div>

                {currentQ > 0 && (
                    <button
                        onClick={() => {
                            setCurrentQ(currentQ - 1)
                            setRespuestas(respuestas.slice(0, -1))
                        }}
                        className="mt-6 text-slate-500 hover:text-white text-sm flex items-center gap-1 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Pregunta anterior
                    </button>
                )}
            </div>
        </div>
    )
}
