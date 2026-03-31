import { useState, useEffect, useRef, useCallback } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { X, AlertCircle, Star, Coins, Sparkles, Loader2, Eye, RotateCcw } from 'lucide-react'
import { toast } from "sonner"
import HonorCodeModal from '../../HonorCodeModal'
import { GAME_TYPE_COLORS, GAME_TYPE_ICONS, generateGrid } from './constants'
import MultipleChoice from './MultipleChoice'
import MatchGame from './MatchGame'
import TrueFalse from './TrueFalse'
import FillBlank from './FillBlank'
import OrderSteps from './OrderSteps'
import WordSearch from './WordSearch'
import Memory from './Memory'
import ResultsReview from './ResultsReview'

interface QuizPlayerProps {
    quiz: any
    onClose: () => void
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
    const [wsFirstCell, setWsFirstCell] = useState<{ r: number; c: number } | null>(null)
    const [wsFoundCells, setWsFoundCells] = useState<{ r: number; c: number }[]>([])
    const [wordGrid, setWordGrid] = useState<string[][]>([])

    // Memory state
    const [flippedCards, setFlippedCards] = useState<number[]>([])
    const [memoryMatched, setMemoryMatched] = useState<number[]>([])
    const memoryLockRef = useRef(false)
    const [shuffledCards, setShuffledCards] = useState<{ idx: number; label: string; type: 'term' | 'definition'; pairIndex: number }[]>([])

    // Game timer state (for word_search and memory)
    const [gameScore, setGameScore] = useState(100)
    const [gameTimeLeft, setGameTimeLeft] = useState(30)
    const gameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const [retryCount, setRetryCount] = useState(0)
    const [showHonorCode, setShowHonorCode] = useState(true)
    const [honorAccepted, setHonorAccepted] = useState(false)

    const quizType = quiz.quiz_type || "multiple_choice"
    const questions = quiz.questions || []

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
            if (quizType === "trivia" || quizType === "quiz_sprint") startTimer(q.time_limit || 15)
        } else {
            saveResult()
        }
    }

    const updateState = (idx: number, opts: any[]) => {
        updateAttemptProgress({ attempt_id: attemptId, current_question_index: idx, selected_options: opts })
            .catch(console.error)
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
                    if (quizType === "order_steps" && opts.length === 0) {
                        setStepOrder(questions.map((_: any, i: number) => i))
                    }
                    if (quizType === "memory") {
                        const initial: number[] = []
                        opts.forEach((o: any) => {
                            if (Array.isArray(o)) o.forEach((v: number) => { if (!initial.includes(v)) initial.push(v) })
                            else if (o !== null) { if (!initial.includes(o)) initial.push(o) }
                        })
                        setMemoryMatched(initial)
                    }
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

    useEffect(() => {
        const q = questions[currentIdx]
        if (quizType === "word_search" && q?.words) {
            setWordGrid(generateGrid(q.words, q.size || 14))
        }
    }, [quizType, currentIdx, honorAccepted]) // eslint-disable-line

    useEffect(() => {
        if ((quizType === 'word_search' || quizType === 'memory') && honorAccepted) {
            setGameScore(100)
            setGameTimeLeft(30)
            if (gameTimerRef.current) clearInterval(gameTimerRef.current)
            gameTimerRef.current = setInterval(() => {
                setGameTimeLeft(prev => {
                    if (prev <= 1) {
                        setGameScore(s => Math.max(0, s - 10))
                        return 30
                    }
                    return prev - 1
                })
            }, 1000)
            return () => { if (gameTimerRef.current) clearInterval(gameTimerRef.current) }
        }
    }, [quizType, honorAccepted]) // eslint-disable-line

    useEffect(() => {
        if (quizType === 'memory' && honorAccepted) {
            const q = questions[currentIdx]
            if (q?.pairs) {
                const cards = q.pairs.flatMap((p: any, i: number) => [
                    { idx: i * 2, label: p.term, type: 'term' as const, pairIndex: i },
                    { idx: i * 2 + 1, label: p.definition, type: 'definition' as const, pairIndex: i },
                ])
                for (let i = cards.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [cards[i], cards[j]] = [cards[j], cards[i]]
                }
                setShuffledCards(cards)
            }
        }
    }, [quizType, currentIdx, honorAccepted]) // eslint-disable-line

    if (!honorAccepted) {
        return (
            <HonorCodeModal
                isOpen={showHonorCode}
                onAccept={() => { setHonorAccepted(true); setShowHonorCode(false) }}
                onDecline={onClose}
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

    const saveResult = async (finalAnswers?: (number | null | number[] | string[] | null)[]) => {
        if (timerRef.current) clearInterval(timerRef.current)
        if (gameTimerRef.current) clearInterval(gameTimerRef.current)
        setSubmitting(true)
        setFinished(true)
        try {
            const penalty = (quizType === 'word_search' || quizType === 'memory') ? Math.max(0, 100 - gameScore) : 0
            const answers = finalAnswers ?? selectedOptions
            const res: any = await submitQuiz({ quiz_id: quiz._id, time_penalty: penalty, final_answers: answers as any })
            setQuizResult(res)
        } catch (err: any) {
            toast.error(err.message || "Error al guardar resultado")
            setFinished(false)
        } finally {
            setSubmitting(false)
        }
    }

    // ── Answer handlers ──────────────────────────────────────────────────────

    const handleAnswerMC = (optIdx: number) => {
        const newSelected = [...selectedOptions]
        newSelected[currentIdx] = optIdx
        setSelectedOptions(newSelected)
        updateState(currentIdx, newSelected)
        setTimeout(() => {
            if (currentIdx < questions.length - 1) {
                const nextIdx = currentIdx + 1
                setCurrentIdx(nextIdx)
                updateState(nextIdx, newSelected)
                if (quizType === "trivia" || quizType === "quiz_sprint") startTimer(questions[nextIdx].time_limit || 15)
            } else {
                saveResult(newSelected)
            }
        }, 300)
    }

    const handleMatchSelect = (idx: number, isRightSide: boolean) => {
        if (!isRightSide) {
            setSelectedA(idx)
        } else if (selectedA !== null) {
            if (selectedA === idx) {
                const newMatched = [...matchedPairs, idx]
                setMatchedPairs(newMatched)
                // Store the full matched pairs array in selectedOptions[0] for scoring
                const newSelected = [...selectedOptions]
                newSelected[0] = newMatched
                setSelectedOptions(newSelected)
                updateState(0, newSelected)
                if (newMatched.length === questions.length) setTimeout(() => saveResult(newSelected), 800)
            }
            setSelectedA(null)
        }
    }

    const handleStepMove = (fromIdx: number, direction: 'up' | 'down') => {
        const newOrder = [...stepOrder]
        const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1
        if (toIdx < 0 || toIdx >= newOrder.length) return
        ;[newOrder[fromIdx], newOrder[toIdx]] = [newOrder[toIdx], newOrder[fromIdx]]
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
            const nextOrder = questions[nextIdx].steps?.map((_: any, i: number) => i) || []
            setStepOrder(nextOrder)
            const newOpts = [...selectedOptions]
            newOpts[nextIdx] = nextOrder
            setSelectedOptions(newOpts)
            updateState(nextIdx, newOpts)
        } else {
            saveResult()
        }
    }

    const handleWsCellClick = (r: number, c: number) => {
        if (!wsFirstCell) { setWsFirstCell({ r, c }); return }
        const dr = Math.sign(r - wsFirstCell.r)
        const dc = Math.sign(c - wsFirstCell.c)
        const dist = Math.max(Math.abs(r - wsFirstCell.r), Math.abs(c - wsFirstCell.c))
        if (dist === 0 || (Math.abs(r - wsFirstCell.r) !== 0 && Math.abs(c - wsFirstCell.c) !== 0 && Math.abs(r - wsFirstCell.r) !== Math.abs(c - wsFirstCell.c))) {
            setWsFirstCell(null); return
        }
        let word = ''
        const cells: { r: number; c: number }[] = []
        for (let i = 0; i <= dist; i++) {
            const cr = wsFirstCell.r + dr * i
            const cc = wsFirstCell.c + dc * i
            if (cr < 0 || cr >= wordGrid.length || cc < 0 || cc >= wordGrid[0].length) { setWsFirstCell(null); return }
            word += wordGrid[cr][cc]
            cells.push({ r: cr, c: cc })
        }
        const wordRev = word.split('').reverse().join('')
        const targetWords = (currentQ.words || []).map((w: string) => w.toUpperCase())
        const matched = targetWords.find((w: string) => w === word || w === wordRev)
        if (matched && !foundWords.includes(matched)) {
            const newFound = [...foundWords, matched]
            setFoundWords(newFound)
            setWsFoundCells([...wsFoundCells, ...cells])
            const newSelected = [...selectedOptions]
            newSelected[currentIdx] = newFound
            setSelectedOptions(newSelected)
            updateState(currentIdx, newSelected)
            if (newFound.length === targetWords.length) {
                setTimeout(() => {
                    if (questions.length === 1) { saveResult(newSelected) }
                    else {
                        setFoundWords([]); setWsFirstCell(null); setWsFoundCells([])
                        if (currentIdx < questions.length - 1) {
                            const nextIdx = currentIdx + 1
                            setCurrentIdx(nextIdx)
                            updateState(nextIdx, newSelected)
                        } else { saveResult(newSelected) }
                    }
                }, 600)
            }
        }
        setWsFirstCell(null)
    }

    const handleWordSearchSelect = (word: string) => {
        if (foundWords.includes(word)) return
        const newFound = [...foundWords, word]
        setFoundWords(newFound)
        const newSelected = [...selectedOptions]
        newSelected[currentIdx] = newFound
        setSelectedOptions(newSelected)
        updateState(currentIdx, newSelected)
        if (newFound.length === (currentQ.words || []).length) {
            setTimeout(() => {
                if (questions.length === 1) { saveResult(newSelected) }
                else {
                    setFoundWords([]); setWsFirstCell(null); setWsFoundCells([])
                    if (currentIdx < questions.length - 1) {
                        const nextIdx = currentIdx + 1
                        setCurrentIdx(nextIdx)
                        updateState(nextIdx, newSelected)
                    } else { saveResult(newSelected) }
                }
            }, 600)
        }
    }

    const handleWordSearchSkip = () => {
        if (currentIdx < questions.length - 1) {
            const nextIdx = currentIdx + 1
            setCurrentIdx(nextIdx)
            setFoundWords([]); setWsFirstCell(null); setWsFoundCells([])
            updateState(nextIdx, selectedOptions)
        } else { saveResult() }
    }

    const handleMemoryFlip = (cardIdx: number) => {
        // If locked due to a mismatch, clear mismatch and start new selection with this click
        if (memoryLockRef.current) {
            if (memoryMatched.includes(cardIdx)) return
            setFlippedCards([cardIdx])
            memoryLockRef.current = false
            return
        }
        if (memoryMatched.includes(cardIdx) || flippedCards.includes(cardIdx)) return
        const newFlipped = [...flippedCards, cardIdx]
        setFlippedCards(newFlipped)
        if (newFlipped.length === 2) {
            const [a, b] = newFlipped
            const cardA = shuffledCards.find(c => c.idx === a)
            const cardB = shuffledCards.find(c => c.idx === b)
            const isMatch = cardA && cardB && cardA.pairIndex === cardB.pairIndex
            setTimeout(() => {
                if (isMatch) {
                    const newMatched = [...memoryMatched, a, b]
                    setMemoryMatched(newMatched)
                    const newSelected = [...selectedOptions]
                    newSelected[currentIdx] = newMatched
                    setSelectedOptions(newSelected)
                    updateState(currentIdx, newSelected)
                    setFlippedCards([])
                    memoryLockRef.current = false
                    if (newMatched.length === questions[currentIdx]?.pairs?.length * 2) {
                        if (questions.length === 1) { setTimeout(() => saveResult(newSelected), 1500) }
                        else {
                            setTimeout(() => {
                                setFlippedCards([]); setMemoryMatched([])
                                if (currentIdx < questions.length - 1) setCurrentIdx(c => c + 1)
                                else saveResult(newSelected)
                            }, 1000)
                        }
                    }
                } else {
                    // Mismatch: keep cards visible, wait for next click to clear
                    memoryLockRef.current = true
                }
            }, 500)
        }
    }

    // ── Render question by type ──────────────────────────────────────────────

    const renderQuestion = () => {
        const currentValue = selectedOptions[currentIdx] as number | null | undefined
        switch (quizType) {
            case 'multiple_choice':
            case 'quiz_sprint':
            case 'trivia':
                return <MultipleChoice currentQ={currentQ} selectedValue={currentValue} quizType={quizType} timeLeft={timeLeft} onAnswer={handleAnswerMC} />
            case 'match':
                return <MatchGame questions={questions} selectedA={selectedA} matchedPairs={matchedPairs} onSelect={handleMatchSelect} />
            case 'true_false':
                return <TrueFalse currentQ={currentQ} selectedValue={currentValue} onAnswer={(v) => handleAnswerMC(v ? 1 : 0)} />
            case 'fill_blank':
                return <FillBlank currentQ={currentQ} selectedValue={currentValue} onAnswer={handleAnswerMC} />
            case 'order_steps':
                return <OrderSteps currentQ={currentQ} stepOrder={stepOrder} onMove={handleStepMove} onConfirm={handleStepConfirm} />
            case 'word_search':
                return <WordSearch currentQ={currentQ} wordGrid={wordGrid} foundWords={foundWords} wsFirstCell={wsFirstCell} wsFoundCells={wsFoundCells} gameTimeLeft={gameTimeLeft} gameScore={gameScore} onCellClick={handleWsCellClick} onWordSelect={handleWordSearchSelect} onSkip={handleWordSearchSkip} />
            case 'memory':
                return <Memory currentQ={currentQ} shuffledCards={shuffledCards} flippedCards={flippedCards} memoryMatched={memoryMatched} gameTimeLeft={gameTimeLeft} gameScore={gameScore} onFlip={handleMemoryFlip} />
            default:
                return <MultipleChoice currentQ={currentQ} selectedValue={currentValue} quizType={quizType} timeLeft={timeLeft} onAnswer={handleAnswerMC} />
        }
    }

    const colorClass = GAME_TYPE_COLORS[quizType] || GAME_TYPE_COLORS.multiple_choice
    const progressWidth = `${((currentIdx + 1) / questions.length) * 100}%`

    return (
        <div className="fixed inset-0 z-50 bg-surface md:bg-black/80 md:backdrop-blur-md flex items-stretch md:items-center justify-center md:p-4 overflow-hidden">
            <div className={`bg-surface-light md:border md:border-white/10 md:rounded-[2.5rem] ${finished ? 'md:max-w-4xl' : 'md:max-w-3xl'} w-full md:max-h-[90vh] flex flex-col relative md:shadow-2xl transition-all duration-500`}>

                {!finished && (
                    <div className="sticky top-0 z-10 bg-surface-light/95 backdrop-blur-sm px-4 md:px-8 pt-safe md:pt-8 pb-3 md:pb-4 border-b border-white/5 shrink-0">
                        <div className="flex items-center justify-between mb-3">
                            <span className={`px-3 py-1 bg-gradient-to-r ${colorClass} text-[10px] font-black rounded-full uppercase tracking-widest leading-none flex items-center gap-1.5`}>
                                <span>{GAME_TYPE_ICONS[quizType]}</span>
                                {quizType === 'word_search' ? 'Sopa de Letras' : quizType === 'quiz_sprint' ? 'Quiz Sprint' : quizType === 'fill_blank' ? 'Completar' : quizType === 'true_false' ? 'Verdadero/Falso' : quizType === 'order_steps' ? 'Ordenar Pasos' : quizType}
                            </span>
                            <span className="text-slate-500 font-bold text-sm tracking-widest">{currentIdx + 1} / {questions.length}</span>
                            <button onClick={onClose} title="Cerrar Quiz" className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-accent transition-all duration-500 rounded-full" style={{ width: progressWidth }} />
                        </div>
                    </div>
                )}

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
                                    <div className="mt-6 md:mt-8 text-left border-t border-white/10 pt-6 md:pt-8 pb-32">
                                        <h3 className="text-base md:text-lg font-bold text-white mb-4 flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5 text-accent" />
                                            {quizResult?.is_simulation ? 'Revisión de Preguntas' : 'Revisión de respuestas'}
                                        </h3>
                                        <ResultsReview questions={questions} quizType={quizType} selectedOptions={quizResult?.selected_options ?? []} />
                                    </div>
                                    <div className="mt-8 md:mt-12 sticky bottom-0 bg-surface-light py-4 border-t border-white/10 pb-safe md:px-8 z-20">
                                        <button
                                            onClick={onClose}
                                            className="w-full bg-accent hover:bg-accent-light text-white font-black px-8 md:px-12 py-4 md:py-5 rounded-xl md:rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent/20 uppercase tracking-widest text-xs md:text-sm"
                                        >
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
