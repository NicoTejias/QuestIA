import { useState, useEffect } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { X, AlertCircle, Trophy, Star, Coins, Sparkles, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from "sonner"

interface QuizPlayerProps {
    quiz: any;
    onClose: () => void;
}

export default function QuizPlayer({ quiz, onClose }: QuizPlayerProps) {
    const getOrCreateAttempt = useMutation(api.quizzes.getOrCreateAttempt)
    const updateAttemptProgress = useMutation(api.quizzes.updateAttemptProgress)
    const submitQuiz = useMutation(api.quizzes.submitQuiz)

    const [attemptId, setAttemptId] = useState<any>(null)
    const [currentIdx, setCurrentIdx] = useState(0)
    const [finished, setFinished] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [quizResult, setQuizResult] = useState<any>(null)
    const [loadingAttempt, setLoadingAttempt] = useState(true)

    // Current state of answers (local copy for the UI)
    const [selectedOptions, setSelectedOptions] = useState<(number | null)[]>([])

    // For Match quiz
    const [selectedA, setSelectedA] = useState<number | null>(null)
    const [matchedPairs, setMatchedPairs] = useState<number[]>([])

    // For Flashcards
    const [flipped, setFlipped] = useState(false)

    const isMatch = quiz.quiz_type === 'match'
    const isFlashcard = quiz.quiz_type === 'flashcard'
    const isMultipleChoice = !isMatch && !isFlashcard
    const questions = quiz.questions || []

    useEffect(() => {
        async function initAttempt() {
            try {
                const attempt = await getOrCreateAttempt({ quiz_id: quiz._id })
                if (attempt) {
                    setAttemptId(attempt._id)
                    setCurrentIdx(attempt.current_question_index)
                    setSelectedOptions(attempt.selected_options)
                } else {
                    toast.error("No se pudo iniciar el intento")
                    onClose()
                }
            } catch (err) {
                console.error(err)
                toast.error("Error al cargar progreso del quiz")
                onClose()
            } finally {
                setLoadingAttempt(false)
            }
        }
        initAttempt()
    }, [quiz._id, getOrCreateAttempt, onClose])

    if (loadingAttempt) {
        return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-accent animate-spin" />
            </div>
        )
    }

    if (questions.length === 0) {
        return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-surface border border-white/10 p-8 rounded-[2rem] max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Quiz Vacío</h2>
                    <p className="text-slate-400 mb-6">Este quiz no tiene preguntas asignadas.</p>
                    <button onClick={onClose} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl">Cerrar</button>
                </div>
            </div>
        )
    }

    const currentQ = questions[currentIdx]

    const saveResult = async () => {
        setSubmitting(true)
        setFinished(true)
        try {
            const res = await submitQuiz({ quiz_id: quiz._id })
            setQuizResult(res)
        } catch (err: any) {
            console.error(err)
            toast.error(err.message || "Error al guardar resultado")
        } finally {
            setSubmitting(false)
        }
    }

    const handleAnswerMC = async (optIdx: number) => {
        const newSelected = [...selectedOptions]
        newSelected[currentIdx] = optIdx
        setSelectedOptions(newSelected)

        // Save progress to DB
        try {
            await updateAttemptProgress({
                attempt_id: attemptId,
                current_question_index: currentIdx,
                selected_options: newSelected
            })
        } catch (err) {
            console.error("No se pudo guardar progreso:", err)
        }

        setTimeout(() => {
            if (currentIdx < questions.length - 1) {
                const nextIdx = currentIdx + 1
                setCurrentIdx(nextIdx)
                updateAttemptProgress({
                    attempt_id: attemptId,
                    current_question_index: nextIdx,
                    selected_options: newSelected
                })
            } else {
                saveResult()
            }
        }, 300)
    }

    const handleMatchSelect = (idx: number, isRightSide: boolean) => {
        if (!isRightSide) {
            setSelectedA(idx)
        } else if (selectedA !== null) {
            if (selectedA === idx) {
                const newMatchedPairs = [...matchedPairs, idx];
                setMatchedPairs(newMatchedPairs)
                
                // For match, we can store correctness in selectedOptions if we want persistence
                const newSelected = [...selectedOptions]
                newSelected[idx] = idx // Concept index matched
                setSelectedOptions(newSelected)

                if (newMatchedPairs.length === questions.length) {
                    setTimeout(() => saveResult(), 1000)
                }
            }
            setSelectedA(null)
        }
    }

    const nextFlashcard = () => {
        setFlipped(false)
        const newSelected = [...selectedOptions]
        newSelected[currentIdx] = 1 // Marked as "viewed/correct"
        setSelectedOptions(newSelected)

        if (currentIdx < questions.length - 1) {
            setCurrentIdx(prev => prev + 1)
        } else {
            saveResult()
        }
    }

    const progressWidth = `${((currentIdx + 1) / questions.length) * 100}%`

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className={`bg-surface-light border border-white/10 rounded-[2.5rem] ${finished ? 'max-w-4xl max-h-[90vh] overflow-y-auto' : 'max-w-3xl'} w-full p-8 md:p-12 relative shadow-2xl transition-all duration-500`}>
                {!finished && (
                    <button onClick={onClose} title="Cerrar Quiz" className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                )}

                {!finished ? (
                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <span className="px-3 py-1 bg-accent/10 border border-accent/20 text-accent-light text-[10px] font-black rounded-full uppercase tracking-widest leading-none">
                                {quiz.quiz_type}
                            </span>
                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 relative mx-4">
                                <div
                                    className="h-full bg-accent transition-all duration-500 rounded-full"
                                    style={({ width: progressWidth } as React.CSSProperties)}
                                ></div>
                            </div>
                            <span className="text-slate-500 font-bold text-sm tracking-widest">{currentIdx + 1} / {questions.length}</span>
                        </div>

                        {isMultipleChoice && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-2xl font-black text-white mb-8 leading-relaxed">{currentQ.question}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {currentQ.options?.map((opt: string, i: number) => {
                                        const isSelected = selectedOptions[currentIdx] === i
                                        let btnCls = isSelected 
                                            ? "bg-accent/20 border-accent text-white" 
                                            : "bg-white/5 border-white/10 text-slate-300 hover:border-accent/40"
                                        
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => handleAnswerMC(i)}
                                                className={`p-6 rounded-2xl border text-left font-semibold transition-all ${btnCls}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-xs font-black">{['A', 'B', 'C', 'D'][i]}</span>
                                                    <span>{opt}</span>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {isFlashcard && (
                            <div className="flex flex-col items-center justify-center min-h-[300px] animate-in zoom-in-95 duration-300">
                                <div
                                    onClick={() => setFlipped(!flipped)}
                                    className="w-full max-w-xl aspect-[3/2] cursor-pointer group perspective-1000"
                                >
                                    <div className={`relative w-full h-full transition-transform duration-500 preserve-3d ${flipped ? 'rotate-y-180' : ''}`}>
                                        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-900 to-slate-900 border-2 border-indigo-500/30 rounded-3xl p-10 flex items-center justify-center text-center shadow-xl group-hover:border-indigo-400/50 transition-colors">
                                            <h3 className="text-3xl font-black text-white">{currentQ.front || currentQ.term || currentQ.question || currentQ.concept}</h3>
                                        </div>
                                        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-tl from-emerald-900 to-slate-900 border-2 border-emerald-500/30 rounded-3xl p-10 flex items-center justify-center text-center shadow-xl">
                                            <h3 className="text-2xl font-semibold text-emerald-100">{currentQ.back || currentQ.definition || currentQ.answer}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 flex gap-4">
                                    <button onClick={() => setFlipped(!flipped)} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors">Voltear</button>
                                    <button onClick={nextFlashcard} className="px-6 py-3 bg-accent hover:bg-accent-light text-white font-black rounded-xl shadow-lg transition-all">Siguiente</button>
                                </div>
                            </div>
                        )}

                        {isMatch && (
                            <div className="animate-in fade-in duration-300 px-4">
                                <h3 className="text-center text-xl font-bold text-slate-300 mb-8">Empareja los conceptos</h3>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        {questions.map((q: any, i: number) => (
                                            <button
                                                key={`left-${i}`}
                                                disabled={matchedPairs.includes(i)}
                                                onClick={() => handleMatchSelect(i, false)}
                                                className={`w-full p-4 rounded-xl border text-left font-bold transition-all
                                                    ${matchedPairs.includes(i) ? 'bg-green-500/10 border-green-500/20 text-green-500/50 cursor-default' :
                                                        selectedA === i ? 'bg-accent/20 border-accent text-white' :
                                                            'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
                                            >
                                                {q.front || q.left || q.term || q.concept}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="space-y-4">
                                        {questions.map((q: any, i: number) => (
                                            <button
                                                key={`right-${i}`}
                                                disabled={matchedPairs.includes(i)}
                                                onClick={() => handleMatchSelect(i, true)}
                                                className={`w-full p-4 rounded-xl border text-left font-bold transition-all
                                                    ${matchedPairs.includes(i) ? 'bg-green-500/10 border-green-500/20 text-green-500/50 cursor-default' :
                                                        'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
                                            >
                                                {q.back || q.right || q.definition}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-4 animate-in zoom-in-95 duration-500">
                        {submitting ? (
                            <div className="py-20 flex flex-col items-center">
                                <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
                                <p className="text-white font-bold animate-pulse">Procesando resultados...</p>
                            </div>
                        ) : (
                            <>
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl ${quizResult?.is_improvement ? 'bg-gold/20 shadow-gold/20' : 'bg-slate-800 shadow-black/50'}`}>
                                    {quizResult?.is_improvement ? <Trophy className="w-10 h-10 text-gold" /> : <Star className="w-10 h-10 text-slate-500" />}
                                </div>
                                <h2 className="text-3xl font-black text-white mb-1">
                                    {quizResult?.is_improvement ? '¡Nuevo Record!' : 'Reto Completado'}
                                </h2>
                                <p className="text-slate-400 mb-6">
                                    {quizResult?.is_improvement
                                        ? '¡Increíble! Has superado tu puntuación anterior.'
                                        : 'Bien hecho, has finalizado el quiz satisfactoriamente.'}
                                </p>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                        <span className="block text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1">PUNTUACIÓN</span>
                                        <span className="text-3xl font-black text-white">{quizResult?.score}%</span>
                                    </div>
                                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                        <span className="block text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1">PUNTOS</span>
                                        <div className="flex items-center justify-center gap-1">
                                            <Coins className="w-5 h-5 text-gold" />
                                            <span className="text-3xl font-black text-gold">+{quizResult?.earned || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {quizResult?.daily_bonus_applied && (
                                    <div className="bg-gold/10 border border-gold/20 rounded-xl p-3 mb-6 text-gold flex items-center justify-center gap-2">
                                        <Sparkles className="w-4 h-4 flex-shrink-0" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            +{quizResult.daily_bonus} PTS BONO POR RACHA ({quizResult.new_streak} DÍAS)
                                        </span>
                                    </div>
                                )}

                                {/* REVISIÓN DE RESPUESTAS */}
                                <div className="mt-8 text-left border-t border-white/10 pt-8">
                                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-accent" />
                                        Revisión de respuestas
                                    </h3>
                                    <div className="space-y-6">
                                        {questions.map((q: any, i: number) => {
                                            const selected = quizResult?.selected_options[i]
                                            const correct = q.correct ?? q.correctAnswerIndex
                                            const isCorrect = selected === correct

                                            return (
                                                <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                                    <div className="flex items-start gap-4">
                                                        {isCorrect ? (
                                                            <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                                                        ) : (
                                                            <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                                                        )}
                                                        <div>
                                                            <p className="text-white font-bold mb-2">{q.question}</p>
                                                            <div className="grid grid-cols-1 gap-2 mt-4">
                                                                {q.options?.map((opt: string, optIdx: number) => {
                                                                    const isCorrectOpt = optIdx === correct
                                                                    const isSelectedOpt = optIdx === selected
                                                                    
                                                                    let cls = "text-sm p-3 rounded-xl border "
                                                                    if (isCorrectOpt) cls += "bg-green-500/10 border-green-500/30 text-green-400"
                                                                    else if (isSelectedOpt) cls += "bg-red-500/10 border-red-500/30 text-red-400"
                                                                    else cls += "bg-white/5 border-transparent text-slate-500"

                                                                    return (
                                                                        <div key={optIdx} className={cls}>
                                                                            {opt}
                                                                            {isCorrectOpt && <span className="ml-2 text-[10px] font-black uppercase opacity-70">(Correcta)</span>}
                                                                            {isSelectedOpt && !isCorrectOpt && <span className="ml-2 text-[10px] font-black uppercase opacity-70">(Tu elección)</span>}
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                            {q.explanation && (
                                                                <div className="mt-4 p-4 bg-accent/5 border border-accent/10 rounded-xl">
                                                                    <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">Explicación</p>
                                                                    <p className="text-sm text-slate-300 leading-relaxed">{q.explanation}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="mt-12 sticky bottom-0 bg-surface-light py-4 border-t border-white/10">
                                    <button onClick={onClose} className="w-full bg-accent hover:bg-accent-light text-white font-black px-12 py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent/20 uppercase tracking-widest text-sm">
                                        VOLVER AL RAMO
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
