import { useState, useEffect, useRef, useCallback } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { X, AlertCircle, Star, Coins, Sparkles, Loader2, CheckCircle2, Eye, ChevronUp, ChevronDown, Clock, RotateCcw, Zap } from 'lucide-react'
import { toast } from "sonner"
import HonorCodeModal from '../HonorCodeModal'

interface QuizPlayerProps {
    quiz: any;
    onClose: () => void;
}

const GAME_TYPE_COLORS: Record<string, string> = {
    multiple_choice: "from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-400",
    match: "from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-400",
    true_false: "from-green-500/10 to-green-600/5 border-green-500/20 text-green-400",
    fill_blank: "from-indigo-500/10 to-indigo-600/5 border-indigo-500/20 text-indigo-400",
    order_steps: "from-orange-500/10 to-orange-600/5 border-orange-500/20 text-orange-400",
    trivia: "from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 text-yellow-400",
    word_search: "from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 text-cyan-400",
    quiz_sprint: "from-red-500/10 to-red-600/5 border-red-500/20 text-red-400",
    memory: "from-pink-500/10 to-pink-600/5 border-pink-500/20 text-pink-400",
};

const GAME_TYPE_ICONS: Record<string, string> = {
    multiple_choice: "🎯",
    match: "🔗",
    true_false: "✅",
    fill_blank: "✏️",
    order_steps: "🔢",
    trivia: "⚡",
    word_search: "🧩",
    quiz_sprint: "🏃",
    memory: "🧠",
};


// Pure utility function — placed outside the component to avoid Rules of Hooks issues
function generateGrid(words: string[], size: number): string[][] {
    const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(""))
    const directions = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]]

    for (const word of words) {
        let placed = false
        for (let attempt = 0; attempt < 100 && !placed; attempt++) {
            const dir = directions[Math.floor(Math.random() * directions.length)]
            const maxR = size - (dir[0] >= 0 ? word.length : 1)
            const maxC = size - (dir[1] >= 0 ? word.length : 1)
            const minR = dir[0] < 0 ? word.length - 1 : 0
            const minC = dir[1] < 0 ? word.length - 1 : 0
            if (maxR < minR || maxC < minC) continue

            const startR = Math.floor(Math.random() * (maxR - minR + 1)) + minR
            const startC = Math.floor(Math.random() * (maxC - minC + 1)) + minC

            let canPlace = true
            const cells: { r: number, c: number }[] = []
            for (let i = 0; i < word.length; i++) {
                const r = startR + dir[0] * i
                const c = startC + dir[1] * i
                if (grid[r][c] !== "" && grid[r][c] !== word[i]) { canPlace = false; break }
                cells.push({ r, c })
            }
            if (canPlace) {
                for (let i = 0; i < word.length; i++) {
                    grid[cells[i].r][cells[i].c] = word[i].toUpperCase()
                }
                placed = true
            }
        }
    }

    // Fill empty cells with random letters
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c] === "") grid[r][c] = letters[Math.floor(Math.random() * letters.length)]
        }
    }
    return grid
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

    const [selectedOptions, setSelectedOptions] = useState<(number | null | number[] | string[] | null)[]>([])

    // Match state
    const [selectedA, setSelectedA] = useState<number | null>(null)
    const [matchedPairs, setMatchedPairs] = useState<number[]>([])

    // Order steps state
    const [stepOrder, setStepOrder] = useState<number[]>([])

    // Timer state
    const [timeLeft, setTimeLeft] = useState<number>(0)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Word search state
    const [foundWords, setFoundWords] = useState<string[]>([])

    // Memory state
    const [flippedCards, setFlippedCards] = useState<number[]>([])
    const [memoryMatched, setMemoryMatched] = useState<number[]>([])
    const memoryLockRef = useRef(false)

    const quizType = quiz.quiz_type || "multiple_choice"
    const questions = quiz.questions || []
    const [retryCount, setRetryCount] = useState(0)
    const [showHonorCode, setShowHonorCode] = useState(true)
    const [honorAccepted, setHonorAccepted] = useState(false)

    // Word search grid state — must be declared HERE (before any early return) to follow Rules of Hooks
    const [wordGrid, setWordGrid] = useState<string[][]>([])

    // --- Timer logic for trivia & quiz_sprint ---
    const startTimer = useCallback((seconds: number) => {
        if (timerRef.current) clearInterval(timerRef.current)
        setTimeLeft(seconds)
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current)
                    handleAutoAdvance()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }, []) // eslint-disable-line

    const handleAutoAdvance = () => {
        if (currentIdx < questions.length - 1) {
            const nextIdx = currentIdx + 1
            setCurrentIdx(nextIdx)
            updateState(nextIdx, selectedOptions)
            const q = questions[nextIdx]
            if (quizType === "trivia" || quizType === "quiz_sprint") {
                startTimer(q.time_limit || 15)
            }
        } else {
            saveResult()
        }
    }

    const updateState = (idx: number, opts: any[]) => {
        updateAttemptProgress({ attempt_id: attemptId, current_question_index: idx, selected_options: opts })
            .catch(console.error)
    }

    const handleHonorAccept = () => {
        setHonorAccepted(true)
        setShowHonorCode(false)
    }

    const handleHonorDecline = () => {
        onClose()
    }

    useEffect(() => {
        if (!honorAccepted) return
        
        async function initAttempt() {
            setLoadingAttempt(true)
            try {
                const attempt: any = await getOrCreateAttempt({ quiz_id: quiz._id })
                if (attempt) {
                    setAttemptId(attempt._id)
                    setCurrentIdx(attempt.current_question_index ?? 0)
                    const opts = attempt.selected_options ?? []
                    setSelectedOptions(opts)

                    // Initialize order_steps state
                    if (quizType === "order_steps" && opts.length === 0) {
                        setStepOrder(questions.map((_: any, i: number) => i))
                    }

                    // Initialize memory state
                    if (quizType === "memory") {
                        const initial: number[] = []
                        opts.forEach((o: any) => {
                            if (Array.isArray(o)) o.forEach((v: number) => { if (!initial.includes(v)) initial.push(v) })
                            else if (o !== null) { if (!initial.includes(o)) initial.push(o) }
                        })
                        setMemoryMatched(initial)
                    }

                    // Start timer for trivia/quiz_sprint
                    if (quizType === "trivia" || quizType === "quiz_sprint") {
                        const firstQ = questions[attempt.current_question_index ?? 0]
                        startTimer(firstQ?.time_limit || 15)
                    }
                }
            } catch (err: any) {
                toast.error(`No se pudo cargar el progreso: ${err.message || 'Error'}`)
            } finally {
                setLoadingAttempt(false)
            }
        }
        initAttempt()
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [quiz._id, retryCount, honorAccepted]) // eslint-disable-line


    // Word search grid effect — declared here (before any early return) to follow Rules of Hooks
    useEffect(() => {
        const q = questions[currentIdx]
        if (quizType === "word_search" && q?.words) {
            const size = q.size || 14
            setWordGrid(generateGrid(q.words, size))
        }
    }, [quizType, currentIdx, honorAccepted]) // eslint-disable-line

    if (!honorAccepted) {

        return (
            <HonorCodeModal
                isOpen={showHonorCode}
                onAccept={handleHonorAccept}
                onDecline={handleHonorDecline}
                title="Código de Honor"
                context="quiz"
            />
        )
    }

    if (loadingAttempt) {
        return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-accent animate-spin" />
            </div>
        )
    }

    if (!attemptId && !loadingAttempt) {
        return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-surface border border-white/10 p-8 rounded-[2rem] max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Error al iniciar</h2>
                    <p className="text-slate-400 mb-6">No pudimos sincronizar tu progreso con el servidor.</p>
                    <div className="flex gap-3">
                        <button onClick={() => setRetryCount(c => c + 1)} className="flex-1 bg-accent text-white font-bold py-3 rounded-xl">Reintentar</button>
                        <button onClick={onClose} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl">Cerrar</button>
                    </div>
                </div>
            </div>
        )
    }

    if (questions.length === 0) {
        return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-surface border border-white/10 p-8 rounded-[2rem] max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Quiz Vacío</h2>
                    <p className="text-slate-400 mb-6">Este quiz no tiene preguntas.</p>
                    <button onClick={onClose} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl">Cerrar</button>
                </div>
            </div>
        )
    }

    const currentQ = questions[currentIdx]

    const saveResult = async () => {
        if (timerRef.current) clearInterval(timerRef.current)
        setSubmitting(true)
        setFinished(true)
        try {
            const res: any = await submitQuiz({ quiz_id: quiz._id })
            setQuizResult(res)
        } catch (err: any) {
            toast.error(err.message || "Error al guardar resultado")
            setFinished(false)
        } finally {
            setSubmitting(false)
        }
    }

    // ========================
    // ANSWER HANDLERS PER TYPE
    // ========================

    const handleAnswerMC = async (optIdx: number) => {
        const newSelected = [...selectedOptions]
        newSelected[currentIdx] = optIdx
        setSelectedOptions(newSelected)
        updateState(currentIdx, newSelected)

        setTimeout(() => {
            if (currentIdx < questions.length - 1) {
                const nextIdx = currentIdx + 1
                setCurrentIdx(nextIdx)
                updateState(nextIdx, newSelected)
                if (quizType === "trivia" || quizType === "quiz_sprint") {
                    const q = questions[nextIdx]
                    startTimer(q.time_limit || 15)
                }
            } else {
                saveResult()
            }
        }, 300)
    }

    const handleTrueFalse = async (value: boolean) => {
        await handleAnswerMC(value ? 1 : 0)
    }

    const handleMatchSelect = (idx: number, isRightSide: boolean) => {
        if (!isRightSide) {
            setSelectedA(idx)
        } else if (selectedA !== null) {
            const newSelected = [...selectedOptions]
            // Store match as array [conceptIdx, defIdx]
            newSelected[currentIdx] = [selectedA, idx]
            setSelectedOptions(newSelected)
            updateState(currentIdx, newSelected)

            if (selectedA === idx) {
                const newMatched = [...matchedPairs, idx]
                setMatchedPairs(newMatched)
                if (newMatched.length === questions.length) {
                    setTimeout(() => saveResult(), 800)
                }
            }
            setSelectedA(null)
        }
    }

    const handleStepMove = (fromIdx: number, direction: 'up' | 'down') => {
        const newOrder = [...stepOrder]
        const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1
        if (toIdx < 0 || toIdx >= newOrder.length) return
        const temp = newOrder[fromIdx]
        newOrder[fromIdx] = newOrder[toIdx]
        newOrder[toIdx] = temp
        setStepOrder(newOrder)

        const newSelected = [...selectedOptions]
        newSelected[currentIdx] = newOrder
        setSelectedOptions(newSelected)
        updateState(currentIdx, newSelected)
    }

    const handleStepConfirm = () => {
        if (currentIdx < questions.length - 1) {
            const nextIdx = currentIdx + 1
            setCurrentIdx(nextIdx)
            const nextQ = questions[nextIdx]
            const nextOrder = nextQ.steps?.map((_: any, i: number) => i) || []
            setStepOrder(nextOrder)
            const newOpts = [...selectedOptions]
            newOpts[nextIdx] = nextOrder
            setSelectedOptions(newOpts)
            updateState(nextIdx, newOpts)
        } else {
            saveResult()
        }
    }

    const handleWordSearchSelect = (word: string) => {
        if (foundWords.includes(word)) return
        const newFound = [...foundWords, word]
        setFoundWords(newFound)

        const newSelected = [...selectedOptions]
        newSelected[currentIdx] = newFound
        setSelectedOptions(newSelected)
        updateState(currentIdx, newSelected)

        if (newFound.length === currentQ.words?.length) {
            if (questions.length === 1) {
                saveResult()
            } else {
                setFoundWords([])
                if (currentIdx < questions.length - 1) {
                    const nextIdx = currentIdx + 1
                    setCurrentIdx(nextIdx)
                    updateState(nextIdx, selectedOptions)
                } else {
                    saveResult()
                }
            }
        }
    }

    const handleWordSearchSkip = () => {
        if (currentIdx < questions.length - 1) {
            const nextIdx = currentIdx + 1
            setCurrentIdx(nextIdx)
            setFoundWords([])
            updateState(nextIdx, selectedOptions)
        } else {
            saveResult()
        }
    }

    const handleMemoryFlip = (cardIdx: number) => {
        if (memoryLockRef.current) return
        if (memoryMatched.includes(cardIdx)) return
        if (flippedCards.includes(cardIdx)) return

        const newFlipped = [...flippedCards, cardIdx]
        setFlippedCards(newFlipped)

        if (newFlipped.length === 2) {
            memoryLockRef.current = true
            const [a, b] = newFlipped

            // Check if it's a matching pair
            const isMatch = (a % 2 === 0 && b === a + 1) || (a % 2 === 1 && b === a - 1)

            setTimeout(() => {
                if (isMatch) {
                    const newMatched = [...memoryMatched, a, b]
                    setMemoryMatched(newMatched)

                    const newSelected = [...selectedOptions]
                    newSelected[currentIdx] = newMatched
                    setSelectedOptions(newSelected)
                    updateState(currentIdx, newSelected)

                    if (newMatched.length === questions[currentIdx]?.pairs?.length * 2) {
                        if (questions.length === 1) {
                            saveResult()
                        } else {
                            setFlippedCards([])
                            setMemoryMatched([])
                            setTimeout(() => {
                                if (currentIdx < questions.length - 1) {
                                    setCurrentIdx(c => c + 1)
                                } else {
                                    saveResult()
                                }
                            }, 500)
                        }
                    }
                }
                setFlippedCards([])
                memoryLockRef.current = false
            }, 800)
        }
    }



    // ========================
    // RENDER QUESTION BY TYPE
    // ========================
    const renderQuestion = () => {
        switch (quizType) {
            case "multiple_choice":
            case "quiz_sprint": {
                return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        {(quizType === "quiz_sprint") && (
                            <div className="flex items-center justify-center gap-2 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                                <Clock className={`w-5 h-5 ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-red-400"}`} />
                                <span className={`text-2xl font-black ${timeLeft <= 5 ? "text-red-400" : "text-red-400"}`}>{timeLeft}s</span>
                                {timeLeft <= 5 && <Zap className="w-4 h-4 text-red-400 animate-pulse" />}
                            </div>
                        )}
                        <h3 className="text-lg md:text-2xl font-black text-white mb-6 md:mb-8 leading-relaxed">{currentQ.question}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {currentQ.options?.map((opt: string, i: number) => {
                                const isSelected = selectedOptions[currentIdx] === i
                                const btnCls = isSelected ? "bg-accent/20 border-accent text-white" : "bg-white/5 border-white/10 text-slate-300 hover:border-accent/40"
                                return (
                                    <button key={i} onClick={() => handleAnswerMC(i)} className={`p-4 md:p-6 rounded-xl md:rounded-2xl border text-left font-semibold transition-all ${btnCls} active:scale-[0.98]`}>
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-black/20 flex items-center justify-center text-xs font-black shrink-0">{['A', 'B', 'C', 'D'][i]}</span>
                                            <span className="text-sm md:text-base">{opt}</span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )
            }

            case "match": {
                return (
                    <div className="animate-in fade-in duration-300">
                        <h3 className="text-center text-lg md:text-xl font-bold text-slate-300 mb-6 md:mb-8">Empareja los conceptos</h3>
                        <div className="grid grid-cols-2 gap-3 md:gap-8">
                            <div className="space-y-2 md:space-y-4">
                                {questions.map((q: any, i: number) => (
                                    <button key={`left-${i}`} disabled={matchedPairs.includes(i)}
                                        onClick={() => handleMatchSelect(i, false)}
                                        className={`w-full p-3 md:p-4 rounded-xl border text-left text-sm md:text-base font-bold transition-all ${matchedPairs.includes(i) ? 'bg-green-500/10 border-green-500/20 text-green-500/50 cursor-default' : selectedA === i ? 'bg-accent/20 border-accent text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}>
                                        {q.front || q.term || `Concepto ${i + 1}`}
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-2 md:space-y-4">
                                {[...questions].sort(() => Math.random() - 0.5).map((q: any, i: number) => {
                                    const realIdx = questions.indexOf(q)
                                    return (
                                        <button key={`right-${i}`} disabled={matchedPairs.includes(realIdx)}
                                            onClick={() => handleMatchSelect(realIdx, true)}
                                            className={`w-full p-3 md:p-4 rounded-xl border text-left text-sm md:text-base font-bold transition-all ${matchedPairs.includes(realIdx) ? 'bg-green-500/10 border-green-500/20 text-green-500/50 cursor-default' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}>
                                            {q.back || q.definition || `Definición ${realIdx + 1}`}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )
            }

            case "true_false": {
                return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg md:text-2xl font-black text-white mb-6 md:mb-8 leading-relaxed">{currentQ.statement || currentQ.question}</h3>
                        {currentQ.falsify && (
                            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 mb-6">
                                <p className="text-amber-300/80 text-xs font-medium">💡 Si es falso, la respuesta correcta sería: <strong className="text-amber-200">{currentQ.falsify}</strong></p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                            <button onClick={() => handleTrueFalse(true)}
                                className={`p-6 md:p-8 rounded-2xl border-2 font-black text-lg md:text-xl transition-all active:scale-[0.97] ${selectedOptions[currentIdx] === 1 ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-green-500/5 border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/50'}`}>
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-3xl">✅</span>
                                    <span>VERDADERO</span>
                                </div>
                            </button>
                            <button onClick={() => handleTrueFalse(false)}
                                className={`p-6 md:p-8 rounded-2xl border-2 font-black text-lg md:text-xl transition-all active:scale-[0.97] ${selectedOptions[currentIdx] === 0 ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-red-500/5 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50'}`}>
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-3xl">❌</span>
                                    <span>FALSO</span>
                                </div>
                            </button>
                        </div>
                    </div>
                )
            }

            case "fill_blank": {
                const sentence = currentQ.question || currentQ.statement || ""
                const parts = sentence.split("__")
                return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg md:text-2xl font-black text-white mb-4 leading-relaxed">
                            {parts.length > 1 ? (
                                <>
                                    {parts[0]}
                                    <span className="border-b-2 border-accent text-accent-light mx-1 px-2">{selectedOptions[currentIdx] !== null ? (currentQ.options?.[selectedOptions[currentIdx] as number] || "___") : "___"}</span>
                                    {parts.slice(1).join("")}
                                </>
                            ) : (
                                currentQ.question || currentQ.statement
                            )}
                        </h3>
                        {currentQ.answer && (
                            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 mb-6">
                                <p className="text-amber-300/80 text-xs font-medium">💡 Completa la oración seleccionando la respuesta correcta.</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 gap-3">
                            {currentQ.options?.map((opt: string, i: number) => {
                                const isSelected = selectedOptions[currentIdx] === i
                                return (
                                    <button key={i} onClick={() => handleAnswerMC(i)}
                                        className={`p-4 md:p-5 rounded-xl border text-left font-semibold transition-all ${isSelected ? 'bg-accent/20 border-accent text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:border-accent/40'} active:scale-[0.98]`}>
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center text-xs font-black shrink-0">{['A', 'B', 'C', 'D'][i]}</span>
                                            <span className="text-sm md:text-base">{opt}</span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )
            }

            case "order_steps": {
                const steps = stepOrder.length > 0 ? stepOrder.map(i => currentQ.steps?.[i] || "") : (currentQ.steps || [])
                return (
                    <div className="animate-in fade-in duration-300">
                        <h3 className="text-lg md:text-xl font-bold text-white mb-2 text-center">{currentQ.description || "Ordena los pasos correctamente"}</h3>
                        <p className="text-slate-500 text-sm text-center mb-6">Toca las flechas para mover cada paso ↑↓</p>
                        <div className="space-y-2">
                            {steps.map((step: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-3 md:p-4">
                                    <span className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-black text-accent-light shrink-0">{i + 1}</span>
                                    <span className="flex-1 text-white text-sm md:text-base font-medium pl-2">{step}</span>
                                    <div className="flex flex-col gap-0.5 shrink-0">
                                        <button onClick={() => handleStepMove(i, 'up')} disabled={i === 0}
                                            className="p-1 bg-white/5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-all disabled:opacity-20">
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleStepMove(i, 'down')} disabled={i === steps.length - 1}
                                            className="p-1 bg-white/5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-all disabled:opacity-20">
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleStepConfirm}
                            className="w-full mt-6 bg-accent/20 border border-accent/40 text-accent-light hover:bg-accent/30 font-bold py-4 rounded-xl transition-all active:scale-[0.98]">
                            Confirmar Orden
                        </button>
                    </div>
                )
            }

            case "trivia": {
                return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-center gap-2 mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                            <Zap className={`w-5 h-5 ${timeLeft <= 5 ? "text-yellow-400 animate-pulse" : "text-yellow-400"}`} />
                            <span className={`text-2xl font-black ${timeLeft <= 5 ? "text-yellow-400" : "text-yellow-400"}`}>{timeLeft}s</span>
                            {timeLeft <= 5 && <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />}
                        </div>
                        <h3 className="text-lg md:text-2xl font-black text-white mb-2 leading-relaxed">{currentQ.question}</h3>
                        {currentQ.fun_fact && (
                            <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-xl p-3 mb-6">
                                <p className="text-cyan-300/80 text-xs">⚡ {currentQ.fun_fact}</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {currentQ.options?.map((opt: string, i: number) => {
                                const isSelected = selectedOptions[currentIdx] === i
                                const btnCls = isSelected ? "bg-accent/20 border-accent text-white" : "bg-white/5 border-white/10 text-slate-300 hover:border-accent/40"
                                return (
                                    <button key={i} onClick={() => handleAnswerMC(i)} className={`p-4 md:p-6 rounded-xl md:rounded-2xl border text-left font-semibold transition-all ${btnCls} active:scale-[0.98]`}>
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-black/20 flex items-center justify-center text-xs font-black shrink-0">{['A', 'B', 'C', 'D'][i]}</span>
                                            <span className="text-sm md:text-base">{opt}</span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )
            }

            case "word_search": {
                const words = currentQ.words || []
                return (
                    <div className="animate-in fade-in duration-300">
                        <h3 className="text-lg md:text-xl font-bold text-white mb-2 text-center">Encuentra las {words.length} palabras ocultas</h3>
                        <p className="text-slate-500 text-xs text-center mb-4">Toca cada palabra en la lista para marcarla</p>
                        <div className="flex flex-wrap gap-2 justify-center mb-4">
                            {words.map((word: string, i: number) => (
                                <button key={i} onClick={() => handleWordSearchSelect(word)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${foundWords.includes(word) ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 line-through' : 'bg-cyan-500/5 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10'}`}>
                                    {word}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-center mb-4">
                            <div className="inline-grid gap-[2px] bg-surface p-2 rounded-xl border border-white/5">
                                {wordGrid.map((row, r) => (
                                    <div key={r} className="flex gap-[2px]">
                                        {row.map((cell, c) => (
                                            <div key={c}
                                                className="w-5 h-5 md:w-6 md:h-6 bg-white/5 border border-white/5 rounded-sm flex items-center justify-center text-[8px] md:text-[9px] font-mono font-black text-slate-400">
                                                {cell}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="text-center text-slate-500 text-xs mb-3">
                            {foundWords.length} / {words.length} palabras encontradas
                        </div>
                        <button onClick={handleWordSearchSkip}
                            className="w-full bg-white/5 border border-white/10 text-slate-400 hover:text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98]">
                            {foundWords.length < words.length ? "Pasar (dejar sin encontrar)" : "Terminar"}
                        </button>
                    </div>
                )
            }

            case "memory": {
                const pairs = currentQ.pairs || []
                const allCards = pairs.flatMap((p: any, i: number) => [
                    { idx: i * 2, label: p.term, type: "term" as const },
                    { idx: i * 2 + 1, label: p.definition, type: "definition" as const },
                ]).sort(() => Math.random() - 0.5)

                return (
                    <div className="animate-in fade-in duration-300">
                        <h3 className="text-lg md:text-xl font-bold text-white mb-2 text-center">Encuentra las {pairs.length} parejas</h3>
                        <p className="text-slate-500 text-xs text-center mb-4">Toca dos cartas para buscar una pareja (término ↔ definición)</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                            {allCards.map((card: { idx: number; label: string; type: "term" | "definition" }) => {
                                const isFlipped = flippedCards.includes(card.idx) || memoryMatched.includes(card.idx)
                                const isMatched = memoryMatched.includes(card.idx)
                                return (
                                    <button key={card.idx}
                                        onClick={() => handleMemoryFlip(card.idx)}
                                        disabled={memoryMatched.includes(card.idx)}
                                        className={`p-2 md:p-3 rounded-xl border text-left transition-all min-h-[60px] md:min-h-[80px] flex items-center justify-center ${isMatched ? 'bg-pink-500/20 border-pink-500/40 cursor-default' : isFlipped ? 'bg-pink-500/10 border-pink-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                                        {isMatched ? (
                                            <span className="text-pink-400 text-xs md:text-sm font-bold text-center">✅</span>
                                        ) : isFlipped ? (
                                            <span className={`text-xs md:text-sm font-bold text-center leading-tight ${card.type === "term" ? "text-pink-300" : "text-slate-300"}`}>
                                                {card.type === "term" ? card.label : card.label.substring(0, 60) + (card.label.length > 60 ? "..." : "")}
                                            </span>
                                        ) : (
                                            <span className="text-slate-600 text-xl md:text-2xl">?</span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                        <div className="text-center text-slate-500 text-xs mt-3">{memoryMatched.length / 2} / {pairs.length} parejas</div>
                    </div>
                )
            }

            default:
                return renderQuestion_mcq()
        }
    }

    // Shared MCQ renderer for fallbacks
    function renderQuestion_mcq() {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg md:text-2xl font-black text-white mb-6 md:mb-8 leading-relaxed">{currentQ.question}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {currentQ.options?.map((opt: string, i: number) => {
                        const isSelected = selectedOptions[currentIdx] === i
                        const btnCls = isSelected ? "bg-accent/20 border-accent text-white" : "bg-white/5 border-white/10 text-slate-300 hover:border-accent/40"
                        return (
                            <button key={i} onClick={() => handleAnswerMC(i)} className={`p-4 md:p-6 rounded-xl md:rounded-2xl border text-left font-semibold transition-all ${btnCls} active:scale-[0.98]`}>
                                <div className="flex items-center gap-3 md:gap-4">
                                    <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-black/20 flex items-center justify-center text-xs font-black shrink-0">{['A', 'B', 'C', 'D'][i]}</span>
                                    <span className="text-sm md:text-base">{opt}</span>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    // ========================
    // RESULTS REVIEW BY TYPE
    // ========================
    const renderReview = () => {
        return (
            <div className="space-y-4 md:space-y-6">
                {questions.map((q: any, i: number) => {
                    const selected = quizResult?.selected_options?.[i]
                    return (
                        <div key={i} className="bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/5">
                            <div className="flex items-start gap-3 md:gap-4 mb-3">
                                <span className="text-accent-light font-black text-sm shrink-0">{i + 1}.</span>
                                <div className="flex-1">
                                    {quizType === "true_false" && q.statement && <p className="text-white font-bold text-sm md:text-base mb-2">{q.statement}</p>}
                                    {quizType === "order_steps" && q.description && <p className="text-white font-bold text-sm md:text-base mb-2">{q.description}</p>}
                                    {quizType === "memory" && <p className="text-white font-bold text-sm md:text-base mb-2">Pareja {Math.floor(i / 2) + 1}</p>}
                                    {quizType === "word_search" && <p className="text-white font-bold text-sm md:text-base mb-2">Palabras: {q.words?.join(", ")}</p>}
                                    {quizType === "trivia" && q.question && <p className="text-white font-bold text-sm md:text-base mb-2">{q.question}</p>}
                                    {(quizType === "multiple_choice" || quizType === "fill_blank" || quizType === "quiz_sprint") && q.question && <p className="text-white font-bold text-sm md:text-base mb-2">{q.question}</p>}
                                    {quizType === "match" && q.front && (
                                        <div className="space-y-2">
                                            <div className="bg-white/5 p-2 rounded-lg"><span className="text-accent-light text-xs">Concepto: </span><span className="text-white text-sm">{q.front}</span></div>
                                            <div className="bg-white/5 p-2 rounded-lg"><span className="text-accent-light text-xs">Definición: </span><span className="text-slate-300 text-sm">{q.back}</span></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {(quizType === "multiple_choice" || quizType === "trivia" || quizType === "quiz_sprint" || quizType === "fill_blank") && q.options && (
                                <div className="grid grid-cols-1 gap-2">
                                    {q.options.map((opt: string, optIdx: number) => {
                                        const isCorrectOpt = optIdx === q.correct
                                        const isSelectedOpt = optIdx === selected
                                        let cls = "text-xs md:text-sm p-2.5 md:p-3 rounded-lg border "
                                        if (isCorrectOpt) cls += "bg-green-500/10 border-green-500/30 text-green-400"
                                        else if (isSelectedOpt) cls += "bg-red-500/10 border-red-500/30 text-red-400"
                                        else cls += "bg-white/5 border-transparent text-slate-500"
                                        return (
                                            <div key={optIdx} className={cls}>
                                                {opt}{isCorrectOpt && <span className="ml-2 text-[10px] font-black uppercase opacity-70">(Correcta)</span>}
                                                {isSelectedOpt && !isCorrectOpt && <span className="ml-2 text-[10px] font-black uppercase opacity-70">(Tu elección)</span>}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {quizType === "true_false" && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div className={`p-3 rounded-lg border text-center font-bold text-sm ${selected === 1 ? (q.correct === true ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400") : q.correct === true ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-white/5 border-transparent text-slate-500"}`}>
                                        ✅ Verdadero {selected === 1 && "(Tu respuesta)"}
                                    </div>
                                    <div className={`p-3 rounded-lg border text-center font-bold text-sm ${selected === 0 ? (!q.correct ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400") : !q.correct ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-white/5 border-transparent text-slate-500"}`}>
                                        ❌ Falso {selected === 0 && "(Tu respuesta)"}
                                    </div>
                                </div>
                            )}

                            {quizType === "order_steps" && q.steps && (
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Orden esperado:</p>
                                    {q.steps.map((s: string, si: number) => {
                                        const orderedStep = Array.isArray(selected) ? si : -1
                                        const isCorrectPos = Array.isArray(selected) && selected[orderedStep] === si
                                        return (
                                            <div key={si} className={`p-2 rounded-lg border text-sm flex items-center gap-2 ${isCorrectPos ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/5"}`}>
                                                <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-[10px] font-black shrink-0">{si + 1}</span>
                                                <span className={isCorrectPos ? "text-green-300" : "text-slate-400"}>{s}</span>
                                                {isCorrectPos && <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto shrink-0" />}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {quizType === "memory" && q.pairs && (
                                <div className="space-y-2">
                                    {q.pairs.map((p: any, pi: number) => (
                                        <div key={pi} className="bg-white/5 p-2 rounded-lg text-sm">
                                            <span className="text-pink-300 font-bold">{p.term}</span>
                                            <span className="text-slate-500 mx-2">↔</span>
                                            <span className="text-slate-300">{p.definition}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {quizType === "word_search" && q.words && (
                                <div className="flex flex-wrap gap-1">
                                    {(Array.isArray(selected) ? selected : []).map((w: string, wi: number) => (
                                        <span key={wi} className="bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs px-2 py-1 rounded-full">{w}</span>
                                    ))}
                                </div>
                            )}

                            {q.explanation && (
                                <div className="mt-3 md:mt-4 p-3 md:p-4 bg-accent/5 border border-accent/10 rounded-xl">
                                    <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">Explicación</p>
                                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed">{q.explanation}</p>
                                </div>
                            )}
                            {q.fun_fact && (
                                <div className="mt-2 p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl">
                                    <p className="text-cyan-300/80 text-xs">⚡ {q.fun_fact}</p>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        )
    }

    const colorClass = GAME_TYPE_COLORS[quizType] || GAME_TYPE_COLORS.multiple_choice

    const progressWidth = `${((currentIdx + 1) / questions.length) * 100}%`

    return (
        <div className="fixed inset-0 z-50 bg-surface md:bg-black/80 md:backdrop-blur-md flex items-stretch md:items-center justify-center md:p-4 overflow-hidden">
            <div className={`bg-surface-light md:border md:border-white/10 md:rounded-[2.5rem] ${finished ? 'md:max-w-4xl' : 'md:max-w-3xl'} w-full md:max-h-[90vh] flex flex-col relative md:shadow-2xl transition-all duration-500`}>

                {/* Header */}
                {!finished && (
                    <div className="sticky top-0 z-10 bg-surface-light/95 backdrop-blur-sm px-4 md:px-8 pt-safe md:pt-8 pb-3 md:pb-4 border-b border-white/5 shrink-0">
                        <div className="flex items-center justify-between mb-3">
                            <span className={`px-3 py-1 bg-gradient-to-r ${colorClass} text-[10px] font-black rounded-full uppercase tracking-widest leading-none flex items-center gap-1.5`}>
                                <span>{GAME_TYPE_ICONS[quizType]}</span>
                                {quizType === "word_search" ? "Sopa de Letras" :
                                 quizType === "quiz_sprint" ? "Quiz Sprint" :
                                 quizType === "fill_blank" ? "Completar" :
                                 quizType === "true_false" ? "Verdadero/Falso" :
                                 quizType === "order_steps" ? "Ordenar Pasos" : quizType}
                            </span>
                            <span className="text-slate-500 font-bold text-sm tracking-widest">{currentIdx + 1} / {questions.length}</span>
                            <button onClick={onClose} title="Cerrar Quiz" className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-accent transition-all duration-500 rounded-full" style={({ width: progressWidth } as React.CSSProperties)}></div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 md:px-8 py-4 md:py-8 pb-safe">
                    {!finished ? renderQuestion() : (
                        <div className="text-center py-2 md:py-4 animate-in zoom-in-95 duration-500">
                            {submitting ? (
                                <div className="py-12 md:py-20 flex flex-col items-center">
                                    <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-accent mb-4" />
                                    <p className="text-white font-bold animate-pulse">Procesando resultados...</p>
                                </div>
                            ) : (
                                <>
                                    {quizResult?.is_simulation && (
                                        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Eye className="w-5 h-5 text-amber-400" />
                                                <span className="text-amber-400 font-black text-sm">MODO VISTA PREVIA DOCENTE</span>
                                            </div>
                                            <p className="text-amber-300/80 text-xs">Estás previsualizando cómo verán los alumnos este quiz.</p>
                                        </div>
                                    )}

                                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl ${quizResult?.is_simulation ? 'bg-amber-500/20 shadow-amber-500/20' : 'bg-slate-800 shadow-black/50'}`}>
                                        {quizResult?.is_simulation ? <Eye className="w-8 h-8 md:w-10 md:h-10 text-amber-400" /> : <Star className="w-8 h-8 md:w-10 md:h-10 text-slate-500" />}
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-black text-white mb-1">
                                        {quizResult?.is_simulation ? 'Vista Previa Completada' : 'Reto Completado'}
                                    </h2>

                                    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                            <span className="block text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1">PUNTUACIÓN</span>
                                            <span className="text-2xl md:text-3xl font-black text-white">{quizResult?.score}%</span>
                                            <div className="text-[10px] text-slate-500 mt-1">
                                                {quizResult?.score >= 80 ? '✅Excelente' : quizResult?.score >= 60 ? '⚠️Bueno' : quizResult?.score >= 40 ? '❌Regular' : '❌Revisar'}
                                            </div>
                                        </div>
                                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                            <span className="block text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1">
                                                {quizResult?.is_simulation ? 'PUNTOS ESTIMADOS' : 'PUNTOS GANADOS'}
                                            </span>
                                            <div className="flex items-center justify-center gap-1">
                                                <Coins className="w-4 h-4 md:w-5 md:h-5 text-gold" />
                                                <span className="text-2xl md:text-3xl font-black text-gold">+{quizResult?.earned || 0}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {quizResult?.remaining_attempts > 0 && !quizResult?.is_simulation && (
                                        <div className="bg-gold/10 border border-gold/20 rounded-xl p-3 mb-6 text-gold flex items-center justify-center gap-2">
                                            <RotateCcw className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                Te quedan {quizResult.remaining_attempts} intento(s) adicional(es)
                                            </span>
                                        </div>
                                    )}

                                    {quizResult?.daily_bonus_applied && (
                                        <div className="bg-gold/10 border border-gold/20 rounded-xl p-3 mb-6 text-gold flex items-center justify-center gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                +{quizResult.daily_bonus} PTS BONO POR RACHA ({quizResult.new_streak} DÍAS)
                                            </span>
                                        </div>
                                    )}

                                    <div className="mt-6 md:mt-8 text-left border-t border-white/10 pt-6 md:pt-8">
                                        <h3 className="text-base md:text-lg font-bold text-white mb-4 flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5 text-accent" />
                                            {quizResult?.is_simulation ? 'Revisión de Preguntas' : 'Revisión de respuestas'}
                                        </h3>
                                        {renderReview()}
                                    </div>

                                    <div className="mt-8 md:mt-12 sticky bottom-0 bg-surface-light py-4 border-t border-white/10 pb-safe">
                                        <button onClick={onClose}
                                            className="w-full bg-accent hover:bg-accent-light text-white font-black px-8 md:px-12 py-4 md:py-5 rounded-xl md:rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent/20 uppercase tracking-widest text-xs md:text-sm">
                                            VOLVER AL RAMO
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
