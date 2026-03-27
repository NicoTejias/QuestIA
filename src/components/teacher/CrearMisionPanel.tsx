import { useState } from 'react'
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Loader2, CheckCircle, Flame, Sparkles, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { getFileIcon, formatFileSize } from '../../utils/documentParser'

const GAME_TYPES = [
    { id: 'multiple_choice', label: 'Quiz Clásico', icon: '🎯', desc: 'Opción múltiple con 4 alternativas', color: 'accent' },
    { id: 'match', label: 'Relacionar', icon: '🔗', desc: 'Unir conceptos con sus definiciones', color: 'purple' },
    { id: 'true_false', label: 'Verdadero/Falso', icon: '✅', desc: 'Afirmaciones para clasificar', color: 'green' },
    { id: 'fill_blank', label: 'Completar', icon: '✏️', desc: 'Completar oraciones con palabras', color: 'blue' },
    { id: 'word_search', label: 'Sopa de Letras', icon: '🧩', desc: 'Encontrar palabras ocultas', color: 'cyan' },
    { id: 'memory', label: 'Memory', icon: '🧠', desc: 'Emparejar términos y definiciones', color: 'pink' },
]

export default function CrearMisionPanel({ courses }: { courses: any[] }) {
    const createMission = useMutation(api.missions.createMission)
    const generateQuiz = useAction(api.quizzes.generateQuiz)
    const [subTab, setSubTab] = useState<'manual' | 'quiz'>('quiz')
    const [formData, setFormData] = useState({ course_id: '', title: '', description: '', points: '' })
    const [creating, setCreating] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    const [quizCourse, setQuizCourse] = useState('')
    const documents = useQuery(
        api.documents.getDocumentsByCourse,
        quizCourse ? { course_id: quizCourse as any } : "skip"
    )
    const masterDocs = useQuery(
        api.documents.getMasterDocuments,
        quizCourse ? { course_id: quizCourse as any } : "skip"
    )
    const [selectedDoc, setSelectedDoc] = useState('')
    const [numQuestions, setNumQuestions] = useState(5)
    const [difficulty, setDifficulty] = useState('medio')
    const [quizType, setQuizType] = useState('multiple_choice')
    const [maxAttempts, setMaxAttempts] = useState(1)
    const [generating, setGenerating] = useState(false)
    const [quizPreview, setQuizPreview] = useState<any>(null)

    const hasMasterDocs = masterDocs && masterDocs.length > 0

    const handleCreate = async () => {
        if (!formData.course_id || !formData.title || !formData.points) return
        setCreating(true)
        try {
            await createMission({
                course_id: formData.course_id as any,
                title: formData.title,
                description: formData.description,
                points: parseInt(formData.points),
            })
            setSuccess(`✅ Desafío "${formData.title}" creado.`)
            setFormData({ course_id: formData.course_id, title: '', description: '', points: '' })
            setTimeout(() => setSuccess(''), 4000)
        } catch (err: any) {
            toast.error(err.message || 'Error al crear el desafío')
        } finally {
            setCreating(false)
        }
    }

    const handleGenerateQuiz = async () => {
        if (!selectedDoc) return
        setGenerating(true)
        setError('')
        setQuizPreview(null)
        try {
            const result = await generateQuiz({
                document_id: selectedDoc as any,
                num_questions: numQuestions,
                difficulty,
                quiz_type: quizType,
                max_attempts: maxAttempts
            })
            setQuizPreview(result)
            setSuccess(`✅ "${result.title}" generado con ${result.numQuestions} preguntas.`)
            setTimeout(() => setSuccess(''), 5000)
        } catch (err: any) {
            setError(err.message || 'Error al generar el quiz')
        } finally {
            setGenerating(false)
        }
    }

    const difficultyOptions = [
        { value: 'facil', label: 'Fácil', desc: 'Conceptos básicos', color: 'text-green-400' },
        { value: 'medio', label: 'Medio', desc: 'Aplicación de conceptos', color: 'text-yellow-400' },
        { value: 'dificil', label: 'Difícil', desc: 'Análisis y Síntesis', color: 'text-red-400' },
    ]

    return (
        <div>
            <p className="text-slate-400 mb-6">Crea desafíos gamificados o genera juegos automáticos con IA a partir del material que subiste.</p>

            {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-green-400 text-sm font-medium">{success}</p>
                </div>
            )}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <p className="text-red-400 text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setSubTab('quiz')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${subTab === 'quiz' ? 'bg-gradient-to-r from-accent to-primary text-white shadow-lg shadow-accent/20' : 'bg-surface-light text-slate-400 border border-white/10 hover:text-white'}`}
                >
                    <Sparkles className="w-4 h-4" />
                    🤖 Desafío con IA
                </button>
                <button
                    onClick={() => setSubTab('manual')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${subTab === 'manual' ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-lg shadow-primary/20' : 'bg-surface-light text-slate-400 border border-white/10 hover:text-white'}`}
                >
                    <Flame className="w-4 h-4" />
                    Desafío Manual
                </button>
            </div>

            {subTab === 'quiz' && (
                <div className="space-y-6">
                    {!hasMasterDocs && quizCourse && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-amber-300 font-bold text-sm mb-1">💡 Los quizzes serán más precisos si subes los documentos institucionales</p>
                                <p className="text-amber-200/60 text-xs">Sube PDA, PIA y PA en la sección de Material para alinear las preguntas con los Resultados de Aprendizaje.</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-surface-light border border-white/5 rounded-2xl p-6 space-y-5">
                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-2 block">1. Selecciona el Ramo</label>
                            <select
                                value={quizCourse}
                                onChange={e => { setQuizCourse(e.target.value); setSelectedDoc('') }}
                                className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent"
                            >
                                <option value="">Selecciona un ramo</option>
                                {courses.map((c: any) => (
                                    <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                                ))}
                            </select>
                        </div>

                        {quizCourse && (
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-2 block">2. Selecciona el Documento</label>
                                {documents && documents.length > 0 ? (
                                    <div className="grid gap-2">
                                        {documents.map((doc: any) => (
                                            <button
                                                key={doc._id}
                                                onClick={() => setSelectedDoc(doc._id)}
                                                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${selectedDoc === doc._id
                                                    ? 'bg-accent/10 border-accent/40 text-white'
                                                    : 'bg-surface border-white/10 text-slate-300 hover:bg-white/5'
                                                    }`}
                                            >
                                                <span className="text-2xl">{getFileIcon(doc.file_type)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{doc.file_name}</p>
                                                    <p className="text-xs text-slate-500">{formatFileSize(doc.file_size)} · {doc.content_text?.length?.toLocaleString()} chars</p>
                                                </div>
                                                {selectedDoc === doc._id && <CheckCircle className="w-5 h-5 text-accent-light shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-surface border border-dashed border-white/10 rounded-xl p-6 text-center">
                                        <p className="text-slate-500 text-sm">No hay documentos en este ramo. Sube material en <strong className="text-slate-300">Material</strong> primero.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedDoc && (
                            <>
                                <div>
                                    <label className="text-sm font-medium text-slate-300 mb-2 block">3. Tipo de Juego</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {GAME_TYPES.map(g => (
                                            <button
                                                key={g.id}
                                                onClick={() => setQuizType(g.id)}
                                                className={`p-3 rounded-xl border transition-all text-left ${quizType === g.id
                                                    ? g.id === 'multiple_choice' ? 'bg-accent/20 border-accent text-white' :
                                                      g.id === 'match' ? 'bg-purple-500/20 border-purple-500 text-white' :
                                                      g.id === 'true_false' ? 'bg-green-500/20 border-green-500 text-white' :
                                                      g.id === 'fill_blank' ? 'bg-blue-500/20 border-blue-500 text-white' :
                                                      g.id === 'order_steps' ? 'bg-orange-500/20 border-orange-500 text-white' :
                                                      g.id === 'trivia' ? 'bg-yellow-500/20 border-yellow-500 text-white' :
                                                      g.id === 'word_search' ? 'bg-cyan-500/20 border-cyan-500 text-white' :
                                                      g.id === 'quiz_sprint' ? 'bg-red-500/20 border-red-500 text-white' :
                                                      'bg-pink-500/20 border-pink-500 text-white'
                                                    : 'bg-surface border-white/10 text-slate-400 hover:text-white'}`}
                                            >
                                                <div className="font-semibold text-sm flex items-center gap-2 mb-1">
                                                    <span>{g.icon}</span> {g.label}
                                                </div>
                                                <div className="text-xs opacity-70">{g.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-300 mb-2 block">4. Cantidad de Preguntas</label>
                                    <div className="flex gap-3">
                                        {[5, 10, 15].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => setNumQuestions(n)}
                                                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${numQuestions === n ? 'bg-accent text-white' : 'bg-surface border border-white/10 text-slate-400 hover:text-white'}`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-300 mb-2 block">5. Dificultad</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {difficultyOptions.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setDifficulty(opt.value)}
                                                className={`p-3 rounded-xl text-center transition-all ${difficulty === opt.value ? 'bg-accent/20 border-2 border-accent text-white' : 'bg-surface border border-white/10 text-slate-400 hover:text-white'}`}
                                            >
                                                <p className={`font-semibold text-sm ${difficulty === opt.value ? opt.color : ''}`}>{opt.label}</p>
                                                <p className="text-xs mt-0.5 opacity-70">{opt.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-300 mb-2 block">6. Intentos Permitidos</label>
                                    <div className="flex gap-3">
                                        {[1, 2, 3, 5].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => setMaxAttempts(n)}
                                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${maxAttempts === n ? 'bg-gold/20 border-gold text-gold shadow-lg shadow-gold/10' : 'bg-surface border-white/10 text-slate-400 hover:text-white'}`}
                                            >
                                                {n === 1 ? '1 intento' : `${n} intentos`}
                                            </button>
                                        ))}
                                    </div>
                                    {maxAttempts > 1 && (
                                        <p className="text-[10px] text-gold/70 mt-2 px-1">
                                            Los puntos se promedian entre los {maxAttempts} intentos para el ranking.
                                        </p>
                                    )}
                                </div>

                                <div className="bg-black/20 border border-gold/20 rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Recompensa por respuesta correcta</p>
                                        <p className="text-white font-bold text-lg">
                                            {difficulty === 'dificil' ? 20 : difficulty === 'medio' ? 15 : 10} pts
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Puntaje Total</p>
                                        <p className="text-gold font-black text-2xl">
                                            {numQuestions * (difficulty === 'dificil' ? 20 : difficulty === 'medio' ? 15 : 10)} PTS
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleGenerateQuiz}
                                    disabled={generating}
                                    className="w-full bg-gradient-to-r from-accent to-primary text-white font-bold px-6 py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
                                >
                                    {generating ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Generando con IA... (~15s)</>
                                    ) : (
                                        <><Sparkles className="w-5 h-5" /> 🚀 Generar Desafío con IA</>
                                    )}
                                </button>
                            </>
                        )}
                    </div>

                    {quizPreview && (
                        <div className="bg-surface-light border border-accent/20 rounded-2xl p-6">
                            <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                {quizPreview.title}
                            </h3>
                            <p className="text-slate-400 text-sm mb-6">{quizPreview.numQuestions} preguntas · Tipo: {quizPreview.quiz_type}</p>
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                {quizPreview.questions.map((q: any, i: number) => (
                                    <div key={i} className="bg-surface border border-white/5 rounded-xl p-4">
                                        {q.question ? (
                                            <>
                                                <p className="text-white font-semibold mb-3"><span className="text-accent-light mr-2">P{i + 1}.</span>{q.question}</p>
                                                <div className="space-y-2 mb-2">
                                                    {q.options?.map((opt: string, oi: number) => (
                                                        <div key={oi} className={`px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 ${oi === q.correct ? 'bg-green-500/15 border border-green-500/30 text-green-300' : 'bg-white/5 border border-white/5 text-slate-400'}`}>
                                                            <span className="font-bold text-xs w-5">{String.fromCharCode(65 + oi)}.</span> {opt}
                                                        </div>
                                                    ))}
                                                </div>
                                                {q.explanation && <p className="text-xs text-slate-500 italic border-t border-white/5 pt-2 mt-2">💡 {q.explanation}</p>}
                                                {q.fun_fact && <p className="text-xs text-cyan-400 italic border-t border-white/5 pt-2 mt-2">⚡ {q.fun_fact}</p>}
                                                {q.time_limit && <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mt-2">⏱ {q.time_limit}s por pregunta</p>}
                                            </>
                                        ) : q.front ? (
                                            <div className="flex flex-col gap-2">
                                                <p className="font-bold text-white"><span className="text-accent-light mr-2">P{i + 1}.</span>{q.front}</p>
                                                <p className="text-slate-300 text-sm pl-6 border-l-2 border-white/10">{q.back}</p>
                                            </div>
                                        ) : q.words ? (
                                            <div>
                                                <p className="text-white font-semibold mb-3"><span className="text-accent-light mr-2">P{i + 1}.</span>Sopa de Letras ({q.size || 14}x{q.size || 14})</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {q.words.map((w: string, wi: number) => (
                                                        <span key={wi} className="bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs px-2 py-1 rounded font-mono">{w}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : q.pairs ? (
                                            <div>
                                                <p className="text-white font-semibold mb-3"><span className="text-accent-light mr-2">P{i + 1}.</span>Memory ({q.pairs.length} pares)</p>
                                                <div className="space-y-2">
                                                    {q.pairs.map((p: any, pi: number) => (
                                                        <div key={pi} className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-2 text-xs">
                                                            <span className="text-pink-300 font-bold">{p.term}</span>
                                                            <span className="text-slate-400 ml-2">→ {p.definition.substring(0, 60)}...</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : q.steps ? (
                                            <div>
                                                <p className="text-white font-semibold mb-3"><span className="text-accent-light mr-2">P{i + 1}.</span>{q.description}</p>
                                                <div className="space-y-1">
                                                    {q.steps.map((s: string, si: number) => (
                                                        <div key={si} className="bg-orange-500/10 border border-orange-500/20 text-slate-300 text-xs px-3 py-1.5 rounded flex items-center gap-2">
                                                            <span className="bg-orange-500/20 text-orange-300 font-bold w-5 h-5 rounded flex items-center justify-center text-[10px]">{si + 1}</span>
                                                            {s}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {subTab === 'manual' && (
                <div className="max-w-2xl">
                    <div className="bg-surface-light border border-white/5 rounded-2xl p-6 space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-2 block">Ramo</label>
                            <select value={formData.course_id} onChange={e => setFormData({ ...formData, course_id: e.target.value })} className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary">
                                <option value="">Selecciona un ramo</option>
                                {courses.map((c: any) => (
                                    <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-2 block">Título del Desafío</label>
                            <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="ej. Quiz de Leyes de Kirchhoff" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-2 block">Descripción</label>
                            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe el desafío..." className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary h-24 resize-none" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-2 block">Puntos</label>
                            <input type="number" value={formData.points} onChange={e => setFormData({ ...formData, points: e.target.value })} placeholder="100" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary" />
                        </div>
                        <button onClick={handleCreate} disabled={creating || !formData.course_id || !formData.title || !formData.points} className="bg-primary hover:bg-primary-light text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Flame className="w-5 h-5" />}
                            {creating ? 'Creando...' : 'Crear Desafío'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
