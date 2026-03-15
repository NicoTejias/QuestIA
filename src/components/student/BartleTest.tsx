import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Trophy, Users, Compass, Sword, Loader2, Star, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface BartleTestProps {
    onComplete: (profile: string) => void;
}

const QUESTIONS = [
    {
        id: 1,
        text: "¿Qué te motiva más al terminar un ramo?",
        options: [
            { text: "Haber dominado todas las competencias", score: { achiever: 10 } },
            { text: "Haber hecho buenos amigos y contactos", score: { socializer: 10 } },
            { text: "Haber descubierto herramientas que no conocía", score: { explorer: 10 } },
            { text: "Haber quedado en el primer lugar de la sección", score: { killer: 10 } }
        ]
    },
    {
        id: 2,
        text: "Si encuentras un error en la plataforma Quest, tú...",
        options: [
            { text: "Lo reportas para que la experiencia mejore para todos", score: { achiever: 5, socializer: 5 } },
            { text: "Se lo comentas a tus compañeros en el chat", score: { socializer: 10 } },
            { text: "Intentas explorar hasta dónde llega ese error", score: { explorer: 10 } },
            { text: "Ves si puedes usarlo para sacar ventaja en el ranking", score: { killer: 10 } }
        ]
    },
    {
        id: 3,
        text: "En un trabajo grupal, prefieres...",
        options: [
            { text: "Asegurar que el entregable sea perfecto", score: { achiever: 10 } },
            { text: "Mantener un buen ambiente y que todos participen", score: { socializer: 10 } },
            { text: "Investigar la solución más innovadora", score: { explorer: 10 } },
            { text: "Ser el grupo que obtenga la nota más alta", score: { killer: 10 } }
        ]
    },
    {
        id: 4,
        text: "¿Cuál de estas funciones te emociona más?",
        options: [
            { text: "Coleccionar todas las insignias posibles", score: { achiever: 10 } },
            { text: "El sistema de chat y colaboración", score: { socializer: 10 } },
            { text: "Que la IA genere contextos profesionales curiosos", score: { explorer: 10 } },
            { text: "Superar a los 'invencibles' del ranking", score: { killer: 10 } }
        ]
    }
]

export default function BartleTest({ onComplete }: BartleTestProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [scores, setScores] = useState({ achiever: 0, socializer: 0, explorer: 0, killer: 0 })
    const [loading, setLoading] = useState(false)
    const saveProfile = useMutation(api.users.saveBartleProfile)

    const handleOptionSelect = async (score: any) => {
        const newScores = {
            achiever: scores.achiever + (score.achiever || 0),
            socializer: scores.socializer + (score.socializer || 0),
            explorer: scores.explorer + (score.explorer || 0),
            killer: scores.killer + (score.killer || 0),
        }
        setScores(newScores)

        if (currentStep < QUESTIONS.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            setLoading(true)
            const profile = Object.entries(newScores).reduce((a, b) => a[1] > b[1] ? a : b)[0]
            try {
                await saveProfile({ profile: profile as any })
                toast.success('¡Perfil de jugador detectado!')
                onComplete(profile)
            } catch (err) {
                toast.error('Error al guardar tu perfil')
                setLoading(false)
            }
        }
    }

    const progress = ((currentStep + 1) / QUESTIONS.length) * 100

    return (
        <div className="bg-surface-light border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -z-10" />
            
            <div className="mb-10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10 mb-6">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Test de Personalidad</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4">¿Qué tipo de jugador eres?</h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto">Tus respuestas adaptarán Quest a tu forma de aprender.</p>
            </div>

            <div className="relative h-2 bg-white/5 rounded-full mb-12 overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                />
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                >
                    <div className="text-xl md:text-2xl font-bold text-white mb-10 text-center">
                        {QUESTIONS[currentStep].text}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {QUESTIONS[currentStep].options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleOptionSelect(opt.score)}
                                disabled={loading}
                                className="group relative w-full text-left p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-2xl md:rounded-3xl transition-all active:scale-[0.98] flex items-center gap-6"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-blue-500/20 flex items-center justify-center text-slate-500 group-hover:text-blue-300 transition-colors text-xl font-black">
                                    {String.fromCharCode(65 + idx)}
                                </div>
                                <span className="flex-1 text-slate-200 font-bold text-lg">{opt.text}</span>
                                <Zap className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>

            {loading && (
                <div className="absolute inset-0 bg-surface-light/80 backdrop-blur-sm flex items-center justify-center z-20">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                        <p className="text-white font-black uppercase tracking-widest text-xs">Calculando tu esencia...</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export function BartleProfileDisplay({ profile }: { profile: string }) {
    const config: Record<string, any> = {
        achiever: {
            title: "Triunfador",
            icon: Trophy,
            color: "text-yellow-400",
            bg: "bg-yellow-400/10",
            desc: "Te motiva el progreso, las insignias y dominar cada habilidad del curso."
        },
        socializer: {
            title: "Socializador",
            icon: Users,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
            desc: "Para ti, el aprendizaje es mejor cuando se comparte y se colabora con otros."
        },
        explorer: {
            title: "Explorador",
            icon: Compass,
            color: "text-purple-400",
            bg: "bg-purple-400/10",
            desc: "Te encanta descubrir contenido nuevo, secretos y entender el 'por qué' de las cosas."
        },
        killer: {
            title: "Competidor",
            icon: Sword,
            color: "text-red-400",
            bg: "bg-red-400/10",
            desc: "La adrenalina del ranking y superar desafíos difíciles es lo que te impulsa."
        }
    }

    const { title, icon: Icon, color, bg, desc } = config[profile] || config.achiever

    return (
        <div className={`${bg} border border-white/5 rounded-3xl p-6 flex items-start gap-4`}>
            <div className={`w-14 h-14 rounded-2xl ${bg} border border-white/10 flex items-center justify-center ${color} shrink-0`}>
                <Icon className="w-8 h-8" />
            </div>
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tu Perfil de Jugador</span>
                    <div className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-black text-white uppercase tracking-tighter">BARTLE</div>
                </div>
                <h4 className={`text-xl font-black ${color} mb-2`}>{title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
            </div>
        </div>
    )
}
