import { useState } from 'react'
import { useQuery, useMutation, usePaginatedQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import {
    ChevronRight, BookOpen, FileText, Gift,
    Trash2, Target, Flame, Sparkles, Loader2, RefreshCw,
    Users, Trophy, Edit3, X, Search, Star,
    FileSpreadsheet, ClipboardCheck, AlertTriangle, Plus, Gamepad2
} from 'lucide-react'
import { toast } from 'sonner'
import ConfirmModal from '../ConfirmModal'
import { EditMissionModal, EditRewardModal } from './EditModals'
// import AttendancePanel from './AttendancePanel'
import ImportarAlumnosModal from './ImportarAlumnosModal'
import EvaluadorIAPanel from './EvaluadorIAPanel'
import AgregarEvaluacionModal from './AgregarEvaluacionModal'
import EvaluacionesPorCurso from './EvaluacionesPorCurso'

export default function CourseDetail({ course, onBack }: { course: any, onBack: () => void }) {
    const [courseSubTab, setCourseSubTab] = useState<'evaluaciones' | 'evaluacion'>('evaluaciones')
    const [desafiosTab, setDesafiosTab] = useState<'manuales' | 'ia'>('manuales')
    const fixCourseEnrollments = useMutation(api.users.fixCourseEnrollments)
    const documents = useQuery(api.documents.getDocumentsByCourse, { course_id: course._id })
    const { results: rewards } = usePaginatedQuery(
        api.rewards.getRewardsByCourse,
        { course_id: course._id },
        { initialNumItems: 10 }
    )
    const missions = useQuery(api.missions.getMissions, { course_id: course._id })
    const quizzes = useQuery(api.quizzes.getQuizzesByCourse, { course_id: course._id })
    const { results: students } = usePaginatedQuery(
        api.courses.getCourseStudents,
        { course_id: course._id },
        { initialNumItems: 500 }
    )

    const [expandedMission, setExpandedMission] = useState<string | null>(null)
    const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null)
    const [studentSearch, setStudentSearch] = useState('')
    const [viewingQuizResults, setViewingQuizResults] = useState<string | null>(null)
    const [editingMission, setEditingMission] = useState<any>(null)
    const [editingReward, setEditingReward] = useState<any>(null)
    const [showAgregarEvaluacion, setShowAgregarEvaluacion] = useState(false)
    const [showImportarAlumnos, setShowImportarAlumnos] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState<{ type: 'reward' | 'mission' | 'quiz' | 'cleanup' | 'reset_points', id: any } | null>(null)

    const deleteReward = useMutation(api.rewards.deleteReward)
    const deleteMission = useMutation(api.missions.deleteMission)
    const deleteQuiz = useMutation(api.quizzes.deleteQuiz)
    const cleanUpWhitelist = useMutation(api.courses.cleanUpWhitelist)
    const resetCoursePoints = useMutation(api.courses.resetCoursePoints)

    const [processing, setProcessing] = useState(false)

    const handleConfirmAction = async () => {
        if (!confirmDelete) return
        setProcessing(true)
        try {
            if (confirmDelete.type === 'reward') {
                await deleteReward({ reward_id: confirmDelete.id })
                toast.success('Recompensa eliminada')
            } else if (confirmDelete.type === 'mission') {
                await deleteMission({ mission_id: confirmDelete.id })
                toast.success('Misión eliminada')
            } else if (confirmDelete.type === 'quiz') {
                await deleteQuiz({ quiz_id: confirmDelete.id })
                toast.success('Quiz eliminado')
            } else if (confirmDelete.type === 'cleanup') {
                const res = await cleanUpWhitelist({ course_id: course._id })
                toast.success(`Limpieza completada: ${res.deleted} registros corregidos y ${res.fixed} RUTs formateados.`)
            } else if (confirmDelete.type === 'reset_points') {
                const res = await resetCoursePoints({ course_id: course._id })
                toast.success(`Puntos reiniciados para ${res.studentsReset} alumnos. (${res.missionsReset} misiones y ${res.quizzesReset} quizzes borrados).`)
            }
        } catch (err: any) {
            toast.error(err.message || 'Error en la operación')
        } finally {
            setProcessing(false)
            setConfirmDelete(null)
        }
    }

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm transition-colors border border-white/5 bg-surface-light px-4 py-2 rounded-xl">
                <ChevronRight className="w-4 h-4 rotate-180" />
                Volver a Mis Ramos
            </button>
            <div className="bg-gradient-to-br from-accent/20 via-primary/10 to-surface-light border border-accent/20 rounded-3xl p-8 shadow-xl">
                <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-accent-light" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white">{course.name}</h2>
                        <span className="text-accent-light text-sm font-mono mt-1 block">{course.code}</span>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-2">
                    <p className="text-slate-400">{course.description || 'Sin descripción.'}</p>
                    <button 
                        onClick={() => {
                            localStorage.setItem('questia_simulate_student', 'true');
                            window.location.href = '/alumno';
                        }}
                        className="bg-accent text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-accent-light transition-all shadow-lg shadow-accent/25 hover:shadow-accent/40 active:scale-95 whitespace-nowrap"
                    >
                        <Gamepad2 className="w-5 h-5" />
                        Probar como Alumno
                    </button>
                </div>
            </div>

            {/* <AttendancePanel courseId={course._id} /> */}

            {documents && (() => {
                const hasPDA = documents.some((d: any) => d.master_doc_type === 'PDA')
                const hasPIA = documents.some((d: any) => d.master_doc_type === 'PIA')
                const hasPA = documents.some((d: any) => d.master_doc_type === 'PA')
                if (hasPDA && hasPIA && hasPA) return null
                return (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-amber-300 font-bold text-sm mb-1">Documentos Institucionales Faltantes</p>
                            <p className="text-amber-200/60 text-xs">Para generar quizzes de mayor calidad pedagógica, sube:</p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {!hasPDA && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full font-bold border border-amber-500/20">PDA</span>}
                                {!hasPIA && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full font-bold border border-amber-500/20">PIA</span>}
                                {!hasPA && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full font-bold border border-amber-500/20">PA</span>}
                            </div>
                        </div>
                    </div>
                )
            })()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-light border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-2"><FileText className="w-5 h-5 text-accent-light" /> Archivos</span>
                        <span className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full">{documents?.length || 0}</span>
                    </h3>
                    {documents === undefined ? <Loader2 className="w-5 h-5 animate-spin text-slate-500" /> : documents.length === 0 ? <p className="text-slate-500 text-sm">No se han subido archivos</p> : (
                        <ul className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {documents.map((d: any) => <li key={d._id} className="text-slate-300 text-sm flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg"><div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"></div><span className="truncate flex-1">{d.file_name}</span></li>)}
                        </ul>
                    )}
                </div>
                <div className="bg-surface-light border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-2"><Gift className="w-5 h-5 text-gold" /> Recompensas</span>
                        <span className="text-xs bg-gold/10 text-gold px-2.5 py-1 rounded-full">{rewards?.length || 0}</span>
                    </h3>
                    {rewards === undefined ? <Loader2 className="w-5 h-5 animate-spin text-slate-500" /> : rewards.length === 0 ? <p className="text-slate-500 text-sm">No hay recompensas</p> : (
                        <ul className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {rewards.map((r: any) => (
                                <li key={r._id} className="text-slate-300 text-sm flex items-center justify-between p-2 hover:bg-white/5 rounded-lg group">
                                    <span className="flex items-center gap-3 truncate">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gold shrink-0"></div>
                                        <span className="truncate">{r.name}</span>
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0 ml-2">
                                        <span className="text-gold font-mono text-xs bg-gold/10 px-2 py-0.5 rounded-md mr-1">{r.cost} pts</span>
                                        <button onClick={(e) => { e.stopPropagation(); setEditingReward(r) }} className="p-1.5 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-all" title="Editar"><Edit3 className="w-3.5 h-3.5" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'reward', id: r._id }) }} className="p-1.5 text-slate-500 hover:text-red-400 bg-white/5 hover:bg-red-400/10 rounded-md transition-all" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="bg-surface-light border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                            <Target className="w-5 h-5 text-primary-light" />
                            <h3 className="text-lg font-bold text-white">Desafíos del Ramo</h3>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setDesafiosTab('manuales')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${desafiosTab === 'manuales' ? 'bg-primary/20 text-primary-light border border-primary/30' : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'}`}>
                                <Flame className="w-4 h-4" /> Manuales ({missions?.length || 0})
                            </button>
                            <div className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${desafiosTab === 'ia' ? 'bg-accent/20 text-accent-light border border-accent/30' : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'}`} onClick={() => setDesafiosTab('ia')}>
                                <Sparkles className="w-4 h-4" /> Autogenerados ({quizzes?.length || 0})
                            </div>

                        </div>
                    </div>

                    <div className="p-6 flex-1 max-h-[800px] overflow-y-auto custom-scrollbar">
                        {desafiosTab === 'manuales' ? (
                            <div className="bg-surface border border-white/5 rounded-xl p-4 h-full">
                                {missions === undefined ? <Loader2 className="w-5 h-5 animate-spin text-slate-500" /> : missions.length === 0 ? <p className="text-slate-500 text-sm">No hay misiones manuales activas</p> : (
                                    <ul className="space-y-3">
                                        {missions.map((m: any) => (
                                            <li key={m._id} className="bg-white/5 border border-white/5 p-3 rounded-xl hover:bg-white/10 transition-all cursor-pointer" onClick={() => setExpandedMission(expandedMission === m._id ? null : m._id)}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col truncate pr-2">
                                                        <span className="font-bold text-white text-sm truncate">{m.title}</span>
                                                        <span className="text-[10px] font-black text-gold bg-gold/10 border border-gold/20 px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-widest mt-1 w-fit">
                                                            <Star className="w-3 h-3 fill-gold" /> {m.points} PTS
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button onClick={(e) => { e.stopPropagation(); setEditingMission(m) }} className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Editar"><Edit3 className="w-4 h-4" /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'mission', id: m._id }) }} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                                {expandedMission === m._id && (
                                                    <div className="mt-4 pt-3 border-t border-white/5 text-sm text-slate-400">
                                                        <p className="leading-relaxed">{m.description}</p>
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ) : (
                            <div className="bg-surface border border-white/5 rounded-xl p-4 h-full">
                                {quizzes === undefined ? <Loader2 className="w-5 h-5 animate-spin text-slate-500" /> : quizzes.length === 0 ? <p className="text-slate-500 text-sm italic">Los desafíos aparecerán automáticamente cuando subas material al curso.</p> : (

                                    <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {quizzes.map((q: any) => (
                                            <li key={q._id} className="bg-white/5 border border-white/5 p-3 rounded-xl hover:bg-white/10 transition-all cursor-pointer" onClick={() => setExpandedQuiz(expandedQuiz === q._id ? null : q._id)}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col truncate pr-2">
                                                        <span className="font-medium text-white text-sm truncate">{q.title}</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {q.game_type_label && <span className="text-[9px] font-black uppercase text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">{q.game_type_label}</span>}
                                                            {q.source_file_name && <span className="text-[9px] text-slate-500 truncate max-w-[150px]">📄 {q.source_file_name}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <span className="text-accent-light font-mono text-xs shrink-0 bg-accent/10 px-2 py-0.5 rounded-md mr-1">{q.num_questions} preg.</span>
                                                        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'quiz', id: q._id }) }} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </div>
                                                {expandedQuiz === q._id && (
                                                    <div className="mt-3 pt-3 border-t border-white/5 text-sm space-y-4">
                                                        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                                                            <div className="flex gap-4">
                                                                <span>Tipo: <strong className="text-white capitalize">{q.quiz_type || 'multiple_choice'}</strong></span>
                                                                <span>Dificultad: <strong className="text-white capitalize">{q.difficulty}</strong></span>
                                                            </div>
                                                            <span className="text-gold font-bold bg-gold/10 px-2 py-0.5 rounded border border-gold/20 flex items-center gap-1">
                                                                <Star className="w-3 h-3 fill-gold" /> HASTA {(q.num_questions || 5) * (q.difficulty === 'dificil' ? 20 : q.difficulty === 'medio' ? 15 : 10)} PTS
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2 mb-4">
                                                            <button onClick={(e) => { e.stopPropagation(); setViewingQuizResults(q._id) }} className="flex-1 bg-accent/20 text-accent-light hover:bg-accent/30 text-xs font-bold py-2 rounded-lg border border-accent/20 transition-all flex items-center justify-center gap-2" title="Ver resultados del quiz">
                                                                <Users className="w-4 h-4" /> VER RESULTADOS
                                                            </button>
                                                        </div>
                                                        {q.questions.map((question: any, idx: number) => (
                                                            <div key={idx} className="bg-surface-light border border-white/5 p-3 rounded-lg">
                                                                {question.front ? (
                                                                    <div className="flex flex-col gap-2">
                                                                        <p className="text-white font-medium"><span className="text-accent-light mr-1">{idx + 1}.</span> {question.front}</p>
                                                                        <p className="text-slate-400 text-xs pl-5 border-l border-white/10">{question.back}</p>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <p className="text-white font-medium mb-3"><span className="text-accent-light mr-1">{idx + 1}.</span>{question.question}</p>
                                                                        <div className="space-y-2 mb-2">
                                                                            {question.options?.map((opt: string, optIdx: number) => (
                                                                                <div key={optIdx} className={`px-3 py-2 rounded-lg text-xs flex ${optIdx === question.correct ? 'bg-green-500/15 text-green-300 border border-green-500/30 font-medium' : 'bg-surface border border-white/5 text-slate-400'}`}>
                                                                                    <span className="font-bold mr-2 opacity-70">{String.fromCharCode(65 + optIdx)}.</span> {opt}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        {question.explanation && <p className="text-xs text-slate-400 italic mt-3 border-t border-white/5 pt-2">💡 {question.explanation}</p>}
                                                                    </>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-surface-light border border-white/5 rounded-2xl p-6 flex flex-col max-h-[800px] overflow-y-auto custom-scrollbar">
                <div className="flex gap-2 mb-6">
                    {[
                        { id: 'evaluaciones', label: 'Fechas de Evaluaciones Oficiales', icon: <FileText className="w-4 h-4" /> },

                        { id: 'evaluacion', label: 'Evaluador IA', icon: <ClipboardCheck className="w-4 h-4" /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setCourseSubTab(tab.id as any)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${courseSubTab === tab.id ? 'bg-accent/10 text-accent-light border border-accent/20' : 'bg-surface border border-white/10 text-slate-400 hover:text-white'}`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {courseSubTab === 'evaluaciones' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white">Evaluaciones del Ramo</h3>
                            <button
                                onClick={() => setShowAgregarEvaluacion(true)}
                                className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 text-sm transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Agregar Evaluación
                            </button>
                        </div>
                        <EvaluacionesPorCurso courseId={course._id} />
                    </div>
                )}

                {courseSubTab === 'evaluacion' && (
                    <EvaluadorIAPanel courses={[course]} />
                )}
            </div>
            
            {/* Cierre del grid principal de 2 columnas */}
            </div>

            {/* Separador inferior: Lista de Alumnos Completa */}
            <div className="bg-surface-light border border-white/5 rounded-2xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-2xl font-black text-white flex items-center gap-3">
                            <Users className="w-6 h-6 text-blue-400" />
                            Alumnos Registrados
                            <span className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/10">{students?.length || 0}</span>
                        </h3>
                        <p className="text-slate-500 text-xs font-medium ml-9 uppercase tracking-widest opacity-80">Gestión de estudiantes y sincronización</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        <button 
                            onClick={() => setShowImportarAlumnos(true)}
                            className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-xl border border-green-500/20 transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-wider shadow-lg shadow-green-500/5 group"
                        >
                            <FileSpreadsheet className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            Importar Lista
                        </button>
                        
                        <div className="w-px h-8 bg-white/5 mx-2 hidden md:block"></div>

                        <button onClick={async () => { 
                            setProcessing(true); 
                            try { 
                                const res = await fixCourseEnrollments({ course_id: course._id }); 
                                toast.success(`Sincronización: ${res.enrolled} nuevos alumnos vinculados`); 
                            } catch (e: any) { 
                                toast.error("Error al sincronizar"); 
                            } finally { 
                                setProcessing(false); 
                            } 
                        }} disabled={processing} className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl border border-white/5 transition-all flex items-center gap-1.5 font-bold uppercase tracking-widest text-[9px]">
                            {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Sincronizar
                        </button>
                        <button onClick={() => setConfirmDelete({ type: 'cleanup', id: course._id })} className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl border border-white/5 transition-all uppercase tracking-widest text-[9px]">
                            <Sparkles className="w-3 h-3" /> Limpiar
                        </button>
                        <button onClick={() => setConfirmDelete({ type: 'reset_points', id: course._id })} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-all uppercase tracking-widest text-[9px]">
                            <Trash2 className="w-3 h-3" /> Reset
                        </button>
                    </div>
                </div>

                <div className="relative group mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input type="text" placeholder="Buscar alumno por nombre o RUT..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500/30 transition-all placeholder:text-slate-600" />
                </div>

                {students === undefined ? <Loader2 className="w-5 h-5 animate-spin text-slate-500" /> : students.length === 0 ? <p className="text-slate-500 text-sm">No hay alumnos cargados</p> : (
                    (() => {
                        const sectionsEntries = Object.entries(
                            students.filter((s: any) =>
                                (s.name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
                                (s.identifier || s.student_id || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
                                (s.section || '').toLowerCase().includes(studentSearch.toLowerCase())
                            ).reduce((acc: any, student: any) => {
                                const sec = student.section || 'Sin Sección';
                                if (!acc[sec]) acc[sec] = [];
                                acc[sec].push(student);
                                return acc;
                            }, {})
                        ).sort((a: any, b: any) => a[0].localeCompare(b[0]));

                        const gridClass = sectionsEntries.length === 1 ? 'grid-cols-1 xl:w-1/2' : 'grid-cols-1 xl:grid-cols-2';

                        return (
                            <div className={`grid ${gridClass} gap-6 items-start`}>
                                {sectionsEntries.map(([sectionName, sectionStudents]: [string, any]) => (
                                    <div key={sectionName} className="bg-surface border border-white/5 rounded-2xl p-6 hover:border-blue-500/20 transition-all flex flex-col max-h-[500px]">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 shrink-0">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
                                            {sectionName}
                                            <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full ml-auto">{sectionStudents.length}</span>
                                        </h3>
                                        <ul className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                            {sectionStudents.map((s: any) => (
                                                <li key={s._id} className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between group hover:bg-white/10 transition-all">
                                                    <div className="flex items-center gap-3 truncate">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${s.status === 'registered' ? 'bg-gradient-to-br from-accent to-accent-light text-white' : 'bg-slate-700/50 text-slate-400'}`}>
                                                            {s.name ? s.name[0].toUpperCase() : (s.identifier || s.student_id || '?')[0].toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col truncate">
                                                            <span className="text-white text-sm font-semibold truncate flex items-center gap-2">
                                                                {s.name || 'Sin registro'}
                                                                {s.daily_streak > 0 && <Flame className="w-3 h-3 fill-orange-500 text-orange-400" />}
                                                            </span>
                                                            <div className="flex gap-4 mt-1 items-center">
                                                                <span className="text-[10px] text-primary-light font-mono font-bold bg-primary/5 px-2 py-0.5 rounded">ID: {s.identifier || s.student_id || 'S/ID'}</span>
                                                                <span className="text-[10px] text-slate-400 flex items-center gap-1"><Trophy className="w-3 h-3 text-gold" />: {s.ranking_points || 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1.5 shrink-0 ml-4">
                                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${s.status === 'registered' ? 'text-green-400 bg-green-400/10 border border-green-400/20' : 'text-orange-400 bg-orange-400/10 border border-orange-400/20'}`}>
                                                            {s.status === 'registered' ? 'OK' : 'Sin registro'}
                                                        </span>
                                                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{s.belbin}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        );
                    })()
                )}
            </div>

            {viewingQuizResults && (
                <QuizResultsModal quizId={viewingQuizResults as any} onClose={() => setViewingQuizResults(null)} />
            )}

            <EditMissionModal isOpen={!!editingMission} onClose={() => setEditingMission(null)} data={editingMission} />
            <EditRewardModal isOpen={!!editingReward} onClose={() => setEditingReward(null)} data={editingReward} />
            <ConfirmModal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleConfirmAction}
                loading={processing}
                title={confirmDelete?.type === 'cleanup' ? 'Limpiar Lista' : confirmDelete?.type === 'reset_points' ? 'Reiniciar Puntuaciones' : 'Eliminar'}
                message={confirmDelete?.type === 'cleanup' ? '¿Limpiar la lista de alumnos? Se eliminarán duplicados y formatearán RUTs.' : confirmDelete?.type === 'reset_points' ? 'CRÍTICO: Se borrarán TODOS los puntos y registros. Los alumnos empezarán desde CERO.' : '¿Eliminar este registro permanentemente?'}
                confirmText={confirmDelete?.type === 'cleanup' ? 'Limpiar' : confirmDelete?.type === 'reset_points' ? 'Reiniciar' : 'Eliminar'}
                variant={confirmDelete?.type === 'cleanup' ? 'warning' : 'danger'}
            />

            {showAgregarEvaluacion && (
                <AgregarEvaluacionModal
                    courseId={course._id}
                    courseName={course.name}
                    sections={Array.from(new Set(students?.map((s: any) => s.section).filter(Boolean))) as string[]}
                    onClose={() => setShowAgregarEvaluacion(false)}
                />
            )}

            {showImportarAlumnos && (
                <ImportarAlumnosModal
                    course={course}
                    onClose={() => setShowImportarAlumnos(false)}
                />
            )}
        </div>
    )
}

function QuizResultsModal({ quizId, onClose }: { quizId: any, onClose: () => void }) {
    const submissions = useQuery(api.quizzes.getQuizSubmissions, { quiz_id: quizId })

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-surface-light border border-white/10 rounded-[2.5rem] max-w-2xl w-full p-8 md:p-10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-primary to-accent"></div>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-white">Resultados del Desafío</h3>
                        <p className="text-slate-400 text-sm mt-1">Alumnos que han completado este quiz.</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                </div>
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {submissions === undefined ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
                    ) : submissions.length === 0 ? (
                        <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
                            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">Nadie ha completado este quiz aún.</p>
                        </div>
                    ) : (
                        submissions.map((s: any) => (
                            <div key={s._id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-accent-light font-bold">{s.student_name[0].toUpperCase()}</div>
                                    <div className="truncate">
                                        <p className="text-white font-bold truncate">{s.student_name}</p>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{new Date(s.completed_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 ml-4">
                                    <div className={`text-xl font-black ${s.score >= 70 ? 'text-green-400' : s.score >= 40 ? 'text-orange-400' : 'text-red-400'}`}>{s.score}%</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">+{s.earned_points} pts</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="mt-8 pt-8 border-t border-white/10 flex justify-end">
                    <button onClick={onClose} className="bg-white/5 hover:bg-white/10 text-white font-bold px-8 py-3 rounded-xl transition-all">CERRAR</button>
                </div>
            </div>
        </div>
    )
}
