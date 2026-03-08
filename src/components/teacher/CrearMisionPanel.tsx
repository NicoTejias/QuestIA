import { useState } from 'react'
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Target, Loader2, CheckCircle, Flame, Sparkles, AlertTriangle, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { getFileIcon, formatFileSize } from '../../utils/documentParser'

export default function CrearMisionPanel({ courses }: { courses: any[] }) {
    const createMission = useMutation(api.missions.createMission)
    const generateQuiz = useAction(api.quizzes.generateQuiz)
    const [subTab, setSubTab] = useState<'manual' | 'quiz'>('quiz')
    const [formData, setFormData] = useState({ course_id: '', title: '', description: '', points: '' })
    const [creating, setCreating] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    // Quiz IA state
    const [quizCourse, setQuizCourse] = useState('')
    const documents = useQuery(
        api.documents.getDocumentsByCourse,
        quizCourse ? { course_id: quizCourse as any } : "skip"
    )
    const [selectedDoc, setSelectedDoc] = useState('')
    const [numQuestions, setNumQuestions] = useState(5)
    const [difficulty, setDifficulty] = useState('medio')
    const [quizType, setQuizType] = useState('multiple_choice')
    const [maxAttempts, setMaxAttempts] = useState(1)
    const [generating, setGenerating] = useState(false)
    const [quizPreview, setQuizPreview] = useState<any>(null)

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
            setSuccess(`✅ Misión "${formData.title}" creada.`)
            setFormData({ course_id: formData.course_id, title: '', description: '', points: '' })
            setTimeout(() => setSuccess(''), 4000)
        } catch (err: any) {
            toast.error(err.message || 'Error al crear la misión')
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
            setSuccess(`✅ Quiz "${result.title}" generado con ${result.numQuestions} preguntas.`)
            setTimeout(() => setSuccess(''), 5000)
        } catch (err: any) {
            setError(err.message || 'Error al generar el quiz')
        } finally {
            setGenerating(false)
        }
    }

    const difficultyOptions = [
        { value: 'facil', label: '🟢 Fácil', desc: 'Conceptos básicos' },
        { value: 'medio', label: '🟡 Medio', desc: 'Aplicación de conceptos' },
        { value: 'dificil', label: '🔴 Difícil', desc: 'Análisis y Síntesis' },
    ]

    return (
        <div>
            <p className="text-slate-400 mb-6">Crea misiones gamificadas o genera quizzes automáticos con IA a partir del material que subiste.</p>

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

            {/* Sub-tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setSubTab('quiz')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${subTab === 'quiz' ? 'bg-gradient-to-r from-accent to-primary text-white shadow-lg shadow-accent/20' : 'bg-surface-light text-slate-400 border border-white/10 hover:text-white'}`}
                    title="Crear quiz con IA"
                >
                    <Sparkles className="w-4 h-4" />
                    🤖 Quiz con IA
                </button>
                <button
                    onClick={() => setSubTab('manual')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${subTab === 'manual' ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-lg shadow-primary/20' : 'bg-surface-light text-slate-400 border border-white/10 hover:text-white'}`}
                    title="Crear misión manual"
                >
                    <Flame className="w-4 h-4" />
                    Misión Manual
                </button>
            </div>

            {/* Quiz IA tab */}
            {subTab === 'quiz' && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-accent-light" />
                            Genera Quizzes Automáticos con IA
                        </h3>
                        <p className="text-slate-400 text-sm">Selecciona un documento subido y la IA generará preguntas de opción múltiple basadas en el contenido.</p>
                    </div>

                    <div className="bg-surface-light border border-white/5 rounded-2xl p-6 space-y-5">
                        {/* Selector de ramo */}
                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-2 block">1. Selecciona el Ramo</label>
                            <select
                                value={quizCourse}
                                onChange={e => { setQuizCourse(e.target.value); setSelectedDoc('') }}
                                className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent"
                                aria-label="Selecciona un ramo para generar quiz"
                                title="Seleccionar ramo"
                            >
                                <option value="">Selecciona un ramo</option>
                                {courses.map((c: any) => (
                                    <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                                ))}
                            </select>
                        </div>

                        {/* Selector de documento */}
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
                                                title={`Seleccionar documento: ${doc.file_name}`}
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
                                        <p className="text-slate-500 text-sm">No hay documentos en este ramo. Sube material en la pestaña <strong className="text-slate-300">Material</strong> primero.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Selector de Tipo de Juego */}
                        {selectedDoc && (
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-2 block">3. Tipo de Juego</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <button onClick={() => setQuizType('multiple_choice')} className={`p-4 rounded-xl border transition-all text-left ${quizType === 'multiple_choice' ? 'bg-accent/20 border-accent text-white' : 'bg-surface border-white/10 text-slate-400 hover:text-white'}`} title="Seleccionar Quiz Clásico">
                                        <div className="font-semibold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" /> Quiz Clásico</div>
                                        <div className="text-xs opacity-70 mt-1">Opción múltiple con 4 alternativas</div>
                                    </button>
                                    <button onClick={() => setQuizType('flashcard')} className={`p-4 rounded-xl border transition-all text-left ${quizType === 'flashcard' ? 'bg-blue-500/20 border-blue-500 text-white' : 'bg-surface border-white/10 text-slate-400 hover:text-white'}`} title="Seleccionar Flashcards">
                                        <div className="font-semibold text-sm flex items-center gap-2"><BookOpen className="w-4 h-4" /> Flashcards</div>
                                        <div className="text-xs opacity-70 mt-1">Tarjetas de memoria (concepto/definición)</div>
                                    </button>
                                    <button onClick={() => setQuizType('match')} className={`p-4 rounded-xl border transition-all text-left ${quizType === 'match' ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-surface border-white/10 text-slate-400 hover:text-white'}`} title="Seleccionar Relacionar Parejas">
                                        <div className="font-semibold text-sm flex items-center gap-2"><Target className="w-4 h-4" /> Relacionar Parejas</div>
                                        <div className="text-xs opacity-70 mt-1">Unir conceptos con sus definiciones</div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Configuración del quiz */}
                        {selectedDoc && (
                            <>
                                <div>
                                    <label className="text-sm font-medium text-slate-300 mb-2 block">4. Cantidad de Preguntas/Pares</label>
                                    <div className="flex gap-3">
                                        {[5, 10, 15].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => setNumQuestions(n)}
                                                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${numQuestions === n ? 'bg-accent text-white' : 'bg-surface border border-white/10 text-slate-400 hover:text-white'}`}
                                                title={`Seleccionar ${n} preguntas`}
                                            >
                                                {n} preguntas
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
                                                title={`Seleccionar dificultad: ${opt.label}`}
                                            >
                                                <p className="font-semibold text-sm">{opt.label}</p>
                                                <p className="text-xs mt-0.5 opacity-70">{opt.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-300 mb-2 block">6. Máximo de Intentos</label>
                                    <div className="flex gap-3">
                                        {[1, 3, 5, 99].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => setMaxAttempts(n)}
                                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${maxAttempts === n ? 'bg-gold/20 border-gold text-gold shadow-lg shadow-gold/10' : 'bg-surface border-white/10 text-slate-400 hover:text-white'}`}
                                                title={n === 99 ? 'Intentos ilimitados' : `${n} intentos`}
                                            >
                                                {n === 99 ? '∞ Ilimitado' : `${n} ${n === 1 ? 'intento' : 'intentos'}`}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-widest px-1">
                                        {maxAttempts === 99
                                            ? 'Los alumnos podrán repetir el quiz infinitas veces.'
                                            : `Los alumnos solo podrán realizar este quiz ${maxAttempts} ${maxAttempts === 1 ? 'vez' : 'veces'}.`}
                                    </p>
                                </div>

                                <button
                                    onClick={handleGenerateQuiz}
                                    disabled={generating}
                                    className="w-full bg-gradient-to-r from-accent to-primary text-white font-bold px-6 py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
                                    title="Generar quiz con IA"
                                >
                                    {generating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Generando quiz con IA... (esto puede tardar ~15 segundos)
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            🚀 Generar Quiz con IA
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>

                    {/* Preview del quiz generado */}
                    {quizPreview && (
                        <div className="bg-surface-light border border-accent/20 rounded-2xl p-6 mt-6">
                            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                {quizPreview.title}
                            </h3>
                            <p className="text-slate-400 text-sm mb-6">{quizPreview.numQuestions} preguntas generadas · Guardado automáticamente</p>

                            <div className="space-y-6">
                                {quizPreview.questions[0]?.front ? (
                                    <div className="grid gap-3">
                                        {quizPreview.questions.map((q: any, i: number) => (
                                            <div key={i} className="bg-surface border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                                <div className="sm:w-1/3 w-full font-bold text-white flex items-center gap-2">
                                                    <span className="text-accent-light bg-accent/10 w-6 h-6 flex items-center justify-center rounded-full text-xs shrink-0">{i + 1}</span>
                                                    {q.front}
                                                </div>
                                                <div className="sm:w-2/3 w-full text-slate-300 text-sm pl-8 sm:pl-0 border-l-0 sm:border-l border-white/10 sm:px-4">
                                                    {q.back}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    quizPreview.questions.map((q: any, i: number) => (
                                        <div key={i} className="bg-surface border border-white/5 rounded-xl p-5">
                                            <p className="text-white font-semibold mb-3">
                                                <span className="text-accent-light mr-2">P{i + 1}.</span>
                                                {q.question}
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                                {q.options.map((opt: string, oi: number) => (
                                                    <div key={oi} className={`px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 ${oi === q.correct ? 'bg-green-500/15 border border-green-500/30 text-green-300' : 'bg-white/5 border border-white/5 text-slate-400'}`}>
                                                        <span className="font-bold text-xs w-5">{String.fromCharCode(65 + oi)}.</span>
                                                        {opt}
                                                    </div>
                                                ))}
                                            </div>
                                            {q.explanation && (
                                                <p className="text-sm text-slate-500 italic border-t border-white/5 pt-2 mt-2">💡 {q.explanation}</p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Manual mission tab */}
            {subTab === 'manual' && (
                <div className="max-w-2xl">
                    <div className="bg-surface-light border border-white/5 rounded-2xl p-6 space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-2 block">Ramo</label>
                            <select value={formData.course_id} onChange={e => setFormData({ ...formData, course_id: e.target.value })} className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" aria-label="Selecciona un ramo para crear misión" title="Seleccionar ramo">
                                <option value="">Selecciona un ramo</option>
                                {courses.map((c: any) => (
                                    <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-2 block">Título de la Misión</label>
                            <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="ej. Quiz de Leyes de Kirchhoff" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary" title="Título de la misión" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-2 block">Descripción</label>
                            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe la misión..." className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary h-24 resize-none" title="Descripción" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-2 block">Puntos</label>
                            <input type="number" value={formData.points} onChange={e => setFormData({ ...formData, points: e.target.value })} placeholder="100" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary" title="Puntos" />
                        </div>
                        <button onClick={handleCreate} disabled={creating || !formData.course_id || !formData.title || !formData.points} className="bg-primary hover:bg-primary-light text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" title="Crear misión manual">
                            {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Flame className="w-5 h-5" />}
                            {creating ? 'Creando...' : 'Crear Misión'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
