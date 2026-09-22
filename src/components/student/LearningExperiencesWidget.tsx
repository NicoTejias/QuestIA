import { useState } from 'react'
import { BookOpen, Sparkles, CheckCircle2, FileText, Star, Clock, Eye, X, HelpCircle, Flame } from 'lucide-react'
import { toast } from 'sonner'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { DocumentsAPI } from '../../lib/api'

interface Props {
    course: any;
    user?: any;
    onStartQuiz?: (quiz: any) => void;
}

interface MiniQuizModalProps {
    ea: any;
    onClose: () => void;
    onCompleted: (points: number) => void;
}

function QuickStudyQuizModal({ ea, onClose, onCompleted }: MiniQuizModalProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [selectedOption, setSelectedOption] = useState<number | null>(null)
    const [score, setScore] = useState(0)
    const [showExplanation, setShowExplanation] = useState(false)
    const [finished, setFinished] = useState(false)

    // Preguntas pedagógicas calibradas según la Experiencia de Aprendizaje
    const questions = ea.quickQuestions || [
        {
            q: `¿Cuál es el objetivo principal a desarrollar en la ${ea.title}?`,
            options: [
                'Comprender la normativa y simbología técnica para aplicarla en planos y esquemas reales',
                'Memorizar datos teóricos sin aplicación en taller o laboratorio',
                'Completar únicamente cuestionarios sin revisar los planos',
                'Ignorar las especificaciones de seguridad vigentes'
            ],
            correct: 0,
            feedback: '¡Exacto! El modelo de competencias de Duoc UC enfatiza la aplicación práctica de normas y simbología en contextos reales de ingeniería y tecnología.'
        },
        {
            q: 'Al revisar los contenidos de esta experiencia, ¿qué pauta técnica es fundamental verificar?',
            options: [
                'La versión del software sin considerar la normativa nacional',
                'Los criterios de aceptación y especificaciones del Pliego Técnico SEC / PDA',
                'El formato estético únicamente',
                'Cualquier estándar sin certificación'
            ],
            correct: 1,
            feedback: '¡Correcto! Toda memoria y plano debe respaldarse en los pliegos técnicos de la normativa y la pauta de evaluación del ramo.'
        },
        {
            q: '¿Cómo consolidas el aprendizaje de esta unidad antes de la evaluación oficial?',
            options: [
                'Estudiar a última hora sin contrastar apuntes',
                'Resolver casos prácticos, contrastar con la pauta de cotejo y validar cálculos',
                'Copiar el trabajo de semestres anteriores',
                'No revisar las observaciones del docente'
            ],
            correct: 1,
            feedback: '¡Excelente! Resolver ejercicios prácticos y autoevaluarte con la rúbrica garantiza el máximo puntaje en tu prueba oficial.'
        }
    ]

    const handleAnswer = (index: number) => {
        if (selectedOption !== null) return
        setSelectedOption(index)
        setShowExplanation(true)
        if (index === questions[currentStep].correct) {
            setScore(s => s + 1)
        }
    }

    const handleNext = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(s => s + 1)
            setSelectedOption(null)
            setShowExplanation(false)
        } else {
            setFinished(true)
            const earnedPoints = (score + 1) * 20
            onCompleted(earnedPoints)
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-ink-soft border border-white/10 rounded-3xl w-full max-w-xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-iris/20 text-iris-light flex items-center justify-center">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-white">Desafío Rápido: {ea.title}</h3>
                            <span className="text-[10px] text-iris-soft uppercase font-bold tracking-wider">
                                Pregunta {currentStep + 1} de {questions.length} • Formativo con IA
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-quiet hover:text-white bg-white/5">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {!finished ? (
                    <div className="space-y-5">
                        <div className="text-base sm:text-lg font-bold text-white leading-relaxed">
                            {questions[currentStep].q}
                        </div>

                        {/* Options */}
                        <div className="space-y-2.5">
                            {questions[currentStep].options.map((opt: string, i: number) => {
                                const isSelected = selectedOption === i
                                const isCorrect = questions[currentStep].correct === i
                                let stateStyle = 'bg-white/[0.03] border-white/10 hover:border-iris/40 text-slate-200'

                                if (selectedOption !== null) {
                                    if (isCorrect) {
                                        stateStyle = 'bg-green-500/10 border-green-500/40 text-green-300 font-bold'
                                    } else if (isSelected) {
                                        stateStyle = 'bg-red-500/10 border-red-500/40 text-red-300'
                                    } else {
                                        stateStyle = 'opacity-40 bg-white/[0.02] border-white/5 text-slate-400'
                                    }
                                }

                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleAnswer(i)}
                                        disabled={selectedOption !== null}
                                        className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-start gap-3 ${stateStyle}`}
                                    >
                                        <span className="w-5 h-5 rounded-full border border-current/30 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                                            {String.fromCharCode(65 + i)}
                                        </span>
                                        <span className="leading-relaxed flex-1">{opt}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Pedagogical Feedback */}
                        {showExplanation && (
                            <div className="p-4 rounded-2xl bg-iris/10 border border-iris/20 animate-in fade-in duration-300 space-y-2">
                                <div className="text-xs font-bold text-iris-light flex items-center gap-1.5">
                                    <HelpCircle className="w-4 h-4" />
                                    Fundamento Pedagógico Docente:
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    {questions[currentStep].feedback}
                                </p>
                                <button
                                    onClick={handleNext}
                                    className="w-full mt-2 py-2.5 px-4 bg-iris hover:bg-iris-light text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-iris/20"
                                >
                                    {currentStep < questions.length - 1 ? 'Siguiente Pregunta' : 'Ver Resultado'}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Finished Card */
                    <div className="text-center py-6 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center justify-center mx-auto text-2xl animate-bounce">
                            🏆
                        </div>
                        <h4 className="text-xl font-bold text-white">¡Desafío Formativo Completado!</h4>
                        <p className="text-xs sm:text-sm text-quiet max-w-sm mx-auto">
                            Has reforzado los contenidos clave de la {ea.title}. Este hábito continuo asegura el éxito en tus evaluaciones oficiales.
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/10 border border-gold/20 text-gold font-black text-sm">
                            <Star className="w-4 h-4 fill-gold" />
                            +60 Puntos de Estudio Obtenidos
                        </div>
                        <div>
                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-iris hover:bg-iris-light text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                            >
                                Continuar Estudiando
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function LearningExperiencesWidget({ course, user: _user, onStartQuiz: _onStartQuiz }: Props) {
    const { data: documents } = useSupabaseQuery(
        () => course?.id ? DocumentsAPI.getDocumentsByCourse(course.id) : Promise.resolve([]),
        [course?.id]
    )

    const [activeEAIndex, setActiveEAIndex] = useState(0)
    const [activeQuizEA, setActiveQuizEA] = useState<any | null>(null)
    const [studyProgress, setStudyProgress] = useState<Record<string, number>>(() => {
        try {
            return JSON.parse(localStorage.getItem(`questia_ea_progress_${course.id}`) || '{}')
        } catch {
            return {}
        }
    })

    // Experiencias de Aprendizaje adaptadas al código de la asignatura o genéricas de Duoc UC
    const code = (course.code || '').toUpperCase()
    const isPEI = code.includes('PEI') || code.includes('EAI') || code.includes('ELECTRIC')

    const experiencias = [
        {
            id: 'EA1',
            number: 1,
            title: isPEI ? 'EA 1: Normativa Eléctrica y Simbología Técnica' : 'EA 1: Fundamentos y Conceptos Clave',
            subtitle: 'Comprensión inicial y marco teórico normativo',
            description: isPEI
                ? 'Estudio pormenorizado de las normativas vigentes (RIC SEC), simbología normalizada y diagramas unilineales.'
                : 'Manejo de los conceptos estructurales y principios formativos requeridos para la asignatura.',
            keyConcepts: isPEI
                ? ['Pliego Técnico RIC 01 a 19', 'Simbología NCh Elec.', 'Cuadros de cargas y potencia', 'Esquema unilineal']
                : ['Marco teórico fundamental', 'Glosario y definiciones', 'Criterios de diagnóstico inicial', 'Metodología'],
            estimatedHours: '12 hrs',
        },
        {
            id: 'EA2',
            number: 2,
            title: isPEI ? 'EA 2: Diseño y Circuitos en Taller/Laboratorio' : 'EA 2: Aplicación Práctica y Casos',
            subtitle: 'Desarrollo procedimental y resolución técnica',
            description: isPEI
                ? 'Cálculo de conductores por capacidad y caída de tensión, dimensionamiento de protecciones termomagnéticas y diferenciales.'
                : 'Puesta en práctica de habilidades a través de ejercicios de laboratorio, simulaciones y análisis de casos.',
            keyConcepts: isPEI
                ? ['Dimensionamiento de conductores', 'Curvas de disparo (B, C, D)', 'Protección diferencial 30mA', 'Canalizaciones']
                : ['Resolución de problemas técnicos', 'Técnicas de laboratorio', 'Normas de seguridad', 'Trabajo en equipo Belbin'],
            estimatedHours: '18 hrs',
        },
        {
            id: 'EA3',
            number: 3,
            title: isPEI ? 'EA 3: Proyecto Integrador y Carpeta Técnica' : 'EA 3: Evaluación de Cierre e Integración',
            subtitle: 'Competencia integral y defensa de proyecto',
            description: isPEI
                ? 'Elaboración de carpeta técnica final apta para tramitación TE1, memoria explicativa y cubicación de materiales.'
                : 'Integración final de saberes con defensa de proyecto y resolución de desafíos de fin de semestre.',
            keyConcepts: isPEI
                ? ['Memoria explicativa TE1', 'Planos de planta y cuadro resumen', 'Cubicación y presupuesto', 'Revisión final']
                : ['Informe de cierre', 'Presentación oral y defensa', 'Autoevaluación de aprendizaje', 'Rúbrica integradora'],
            estimatedHours: '20 hrs',
        },
    ]

    const activeEA = experiencias[activeEAIndex]
    const currentProgress = studyProgress[activeEA.id] || 35

    const handleChallengeCompleted = (points: number) => {
        const nextProgress = Math.min(100, currentProgress + 35)
        const updated = { ...studyProgress, [activeEA.id]: nextProgress }
        setStudyProgress(updated)
        localStorage.setItem(`questia_ea_progress_${course.id}`, JSON.stringify(updated))
        toast.success(`¡Dominio de la ${activeEA.id} incrementado al ${nextProgress}%! (+${points} pts)`)
    }

    return (
        <section className="bg-ink-soft border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-7 space-y-6 shadow-xl relative overflow-hidden">
            {/* Modal de Desafío Rápido */}
            {activeQuizEA && (
                <QuickStudyQuizModal
                    ea={activeQuizEA}
                    onClose={() => setActiveQuizEA(null)}
                    onCompleted={handleChallengeCompleted}
                />
            )}

            {/* Header de la sección */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-iris/20 text-iris-light flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base md:text-lg font-bold text-white">Experiencias de Aprendizaje</h3>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-iris/20 text-iris-soft border border-iris/30">
                                Ruta Curricular
                            </span>
                        </div>
                        <p className="text-xs text-quiet mt-0.5">
                            Revisa los contenidos de cada unidad y completa los desafíos formativos para maximizar tu nota.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span>Racha activa: Protegida con estudio</span>
                    </div>
                </div>
            </div>

            {/* Selector de Experiencias (Tabs) */}
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/5">
                {experiencias.map((ea, index) => {
                    const active = activeEAIndex === index
                    const prog = studyProgress[ea.id] || 35
                    return (
                        <button
                            key={ea.id}
                            onClick={() => setActiveEAIndex(index)}
                            className={`p-2.5 sm:p-3 rounded-xl transition-all text-left flex flex-col gap-1 relative ${
                                active
                                    ? 'bg-iris/25 border border-iris text-white shadow-sm'
                                    : 'text-quiet hover:text-slate-200 hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">
                                    {ea.id}
                                </span>
                                <span className={`text-[10px] font-bold ${prog >= 70 ? 'text-green-400' : 'text-iris-soft'}`}>
                                    {prog}%
                                </span>
                            </div>
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-iris to-iris-light rounded-full transition-all duration-500"
                                    style={{ width: `${prog}%` }}
                                ></div>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Detalle de la Experiencia Activa */}
            <div className="bg-black/20 border border-white/5 rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-extrabold text-iris-light uppercase tracking-widest">
                                Unidad {activeEA.number}
                            </span>
                            <span className="text-quiet">•</span>
                            <span className="text-xs text-quiet font-medium flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> {activeEA.estimatedHours} estimadas
                            </span>
                        </div>
                        <h4 className="text-lg md:text-xl font-bold text-white">{activeEA.title}</h4>
                        <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                            {activeEA.description}
                        </p>
                    </div>

                    {/* Botón de Desafío Rápido Formativo */}
                    <button
                        onClick={() => setActiveQuizEA(activeEA)}
                        className="px-5 py-3 rounded-xl bg-iris hover:bg-iris-light active:scale-95 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-iris/25 transition-all shrink-0"
                    >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Reto Rápido 3 Min (IA)</span>
                    </button>
                </div>

                {/* Conceptos clave a dominar */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-xs font-bold text-quiet uppercase tracking-wider">Conceptos y competencias clave:</span>
                    <div className="flex flex-wrap gap-2">
                        {activeEA.keyConcepts.map((c, i) => (
                            <span
                                key={i}
                                className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-slate-300 font-medium flex items-center gap-1.5"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5 text-iris-light" />
                                {c}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Documentos del ramo vinculados */}
                <div className="space-y-3 pt-3 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-quiet uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-iris-light" />
                            Material de estudio de la experiencia:
                        </span>
                        <span className="text-[11px] text-iris-soft font-semibold">
                            {documents?.length || 0} archivos disponibles
                        </span>
                    </div>

                    {(!documents || documents.length === 0) ? (
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center">
                            <p className="text-xs text-quiet">
                                Tu docente habilitará las guías y presentaciones del ramo en esta sección.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {documents.map((doc: any) => (
                                <div
                                    key={doc.id}
                                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-iris/40 transition-all flex items-center justify-between gap-3 group"
                                >
                                    <div className="min-w-0 flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-iris/10 text-iris-light flex items-center justify-center shrink-0">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-white truncate group-hover:text-iris-light transition-colors">
                                                {doc.file_name}
                                            </p>
                                            <p className="text-[10px] text-quiet">
                                                {doc.is_master_doc ? '⭐ Documento Oficial / PDA' : 'Material de Clase'}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            toast.info(`Abriendo ${doc.file_name}...`)
                                            if (doc.file_url) window.open(doc.file_url, '_blank')
                                        }}
                                        className="p-1.5 rounded-lg bg-white/5 text-quiet hover:text-white hover:bg-iris transition-colors shrink-0"
                                        title="Ver material"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
