import { useState } from 'react'
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { 
    ClipboardCheck, 
    Plus, 
    Trash2, 
    FileText, 
    Loader2, 
    Sparkles, 
    ChevronRight, 
    Upload, 
    AlertCircle, 
    CheckCircle, 
    Info, 
    User,
    ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'

export default function EvaluadorIAPanel({ courses }: { courses: any[] }) {
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
    const [selectedRubricId, setSelectedRubricId] = useState<string | null>(null)
    const [showCreateRubric, setShowCreateRubric] = useState(false)

    const rubrics = useQuery(api.evaluator.getRubrics, selectedCourseId ? { course_id: selectedCourseId as any } : "skip")

    if (!selectedCourseId) {
        return (
            <div className="space-y-6">
                <header>
                    <h2 className="text-3xl font-black text-white">Evaluador IA</h2>
                    <p className="text-slate-400">Selecciona un ramo para comenzar a evaluar trabajos con inteligencia artificial.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map((c) => (
                        <button
                            key={c._id}
                            onClick={() => setSelectedCourseId(c._id)}
                            className="bg-surface-light border border-white/5 p-6 rounded-3xl hover:border-primary/40 transition-all text-left group"
                        >
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <ClipboardCheck className="w-6 h-6 text-primary-light" />
                            </div>
                            <h3 className="text-lg font-bold text-white group-hover:text-primary-light transition-colors">{c.name}</h3>
                            <p className="text-xs text-slate-500 font-mono mt-1">{c.code}</p>
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    const currentCourse = courses.find(c => c._id === selectedCourseId);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => { setSelectedCourseId(null); setSelectedRubricId(null); }}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-primary/20 text-primary-light text-[10px] font-black rounded border border-primary/20 uppercase">
                                {currentCourse?.code}
                            </span>
                            <h2 className="text-2xl font-black text-white">Evaluador IA — {currentCourse?.name}</h2>
                        </div>
                        <p className="text-slate-400 text-sm">Gestiona tus pautas y evalúa trabajos en segundos.</p>
                    </div>
                </div>
                {!showCreateRubric && !selectedRubricId && (
                    <button
                        onClick={() => setShowCreateRubric(true)}
                        className="bg-primary hover:bg-primary-light text-white font-black px-6 py-3 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center gap-2 text-sm"
                    >
                        <Plus className="w-5 h-5" /> NUEVA PAUTA
                    </button>
                )}
            </header>

            {showCreateRubric ? (
                <CreateRubricForm 
                    courseId={selectedCourseId} 
                    onCancel={() => setShowCreateRubric(false)} 
                    onSuccess={(id) => { setShowCreateRubric(false); setSelectedRubricId(id); }}
                />
            ) : selectedRubricId ? (
                <RubricDetailView 
                    rubricId={selectedRubricId} 
                    onBack={() => setSelectedRubricId(null)} 
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rubrics?.map((r: any) => (
                        <div key={r._id} className="bg-surface-light border border-white/5 rounded-3xl p-6 hover:border-accent/40 transition-all flex flex-col group h-full">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black text-slate-600 bg-white/5 px-2 py-1 rounded">
                                    {new Date(r.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-accent-light transition-colors">{r.title}</h3>
                            <p className="text-sm text-slate-500 line-clamp-3 mb-6 flex-1 italic">
                                "{r.content_text.substring(0, 150)}..."
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedRubricId(r._id)}
                                    className="flex-1 bg-white/5 hover:bg-accent/20 text-white font-bold py-3 rounded-xl border border-white/5 hover:border-accent/40 transition-all flex items-center justify-center gap-2 text-xs"
                                >
                                    EVALUAR TRABAJOS <ChevronRight className="w-4 h-4" />
                                </button>
                                <DeleteRubricButton rubricId={r._id} />
                            </div>
                        </div>
                    ))}

                    {rubrics?.length === 0 && (
                        <div className="col-span-full py-20 bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] text-center opacity-30">
                            <Plus className="w-16 h-16 mx-auto mb-4" />
                            <p className="font-bold">Aún no has creado ninguna pauta de evaluación.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function CreateRubricForm({ courseId, onCancel, onSuccess }: { courseId: string, onCancel: () => void, onSuccess: (id: string) => void }) {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [saving, setSaving] = useState(false)
    const create = useMutation(api.evaluator.createRubric)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !content.trim() || saving) return

        setSaving(true)
        try {
            const id = await create({ 
                course_id: courseId as any, 
                title: title.trim(), 
                content_text: content.trim() 
            })
            toast.success("Pauta creada correctamente")
            onSuccess(id)
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-surface-light border border-white/10 rounded-[2.5rem] p-8 md:p-12 space-y-8 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <FileText className="w-48 h-48 text-white" />
            </div>

            <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary-light">
                    <Plus className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-white">Configura tu Pauta</h3>
                    <p className="text-slate-400 text-sm">Define los criterios que la IA usará para corregir.</p>
                </div>
            </div>

            <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Título de la Evaluación</label>
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej: Ensayo sobre Ética Profesional (Control 1)"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 focus:border-primary/50 outline-none transition-all font-bold"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contenido de la Rúbrica</label>
                        <span className="text-[9px] text-primary-light bg-primary/10 px-2 py-0.5 rounded font-black flex items-center gap-1">
                            <Info className="w-3 h-3" /> PEGA TU DOCUMENTO AQUÍ
                        </span>
                    </div>
                    <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Pega aquí los criterios, descripción de niveles, puntajes o cualquier indicación de cómo quieres que la IA evalúe..."
                        className="w-full h-80 bg-black/40 border border-white/10 rounded-2xl p-6 text-slate-300 placeholder:text-slate-700 focus:border-primary/50 outline-none transition-all resize-none text-sm leading-relaxed"
                    />
                </div>
            </div>

            <div className="flex gap-4 pt-4 relative z-10">
                <button 
                    type="button" 
                    onClick={onCancel}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all border border-white/5"
                >
                    CANCELAR
                </button>
                <button 
                    type="submit"
                    disabled={saving || !title.trim() || !content.trim()}
                    className="flex-1 bg-primary hover:bg-primary-light text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    GUARDAR PAUTA
                </button>
            </div>
        </form>
    )
}

function RubricDetailView({ rubricId, onBack }: { rubricId: string, onBack: () => void }) {
    const rubric = useQuery(api.evaluator.getRubricInternal, { id: rubricId as any })
    const results = useQuery(api.evaluator.getGradingResults, { rubric_id: rubricId as any })
    const evaluate = useAction(api.evaluator.evaluateSubmission)

    const [studentName, setStudentName] = useState('')
    const [submissionText, setSubmissionText] = useState('')
    const [fileName, setFileName] = useState('')
    const [isEvaluating, setIsEvaluating] = useState(false)
    const [activeTab, setActiveTab] = useState<'evaluar' | 'historial'>('evaluar')

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            setSubmissionText(text);
            // Intentar extraer nombre del estudiante del nombre del archivo si está vacío
            if (!studentName) {
                const guessedName = file.name.split('.')[0].replace(/_/g, ' ');
                setStudentName(guessedName);
            }
        };
        reader.readAsText(file);
    };

    const handleEvaluation = async () => {
        if (!studentName.trim() || !submissionText.trim() || isEvaluating) return;

        setIsEvaluating(true);
        const toastId = toast.loading("La IA está evaluando el trabajo...");
        try {
            await evaluate({
                rubric_id: rubricId as any,
                student_name: studentName.trim(),
                file_name: fileName || "Texto pegado",
                submission_text: submissionText.trim()
            });
            toast.success("¡Evaluación completada!", { id: toastId });
            setStudentName('');
            setSubmissionText('');
            setFileName('');
            setActiveTab('historial');
        } catch (e: any) {
            toast.error("Error al evaluar: " + e.message, { id: toastId });
        } finally {
            setIsEvaluating(false);
        }
    };

    if (!rubric) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6">
                <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Volver a Pautas
                </button>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setActiveTab('evaluar')}
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'evaluar' ? 'bg-primary text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        EVALUAR NUEVO
                    </button>
                    <button 
                        onClick={() => setActiveTab('historial')}
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'historial' ? 'bg-primary text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        HISTORIAL ({results?.length || 0})
                    </button>
                </div>
            </div>

            {activeTab === 'evaluar' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Formulario de Evaluación */}
                    <div className="bg-surface-light border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-xl relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-white">Nueva Evaluación</h4>
                                <p className="text-xs text-slate-500">Sube el trabajo del alumno para calificar.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre del Alumno</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input 
                                        type="text" 
                                        value={studentName}
                                        onChange={(e) => setStudentName(e.target.value)}
                                        placeholder="Ej: Juan Pérez"
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white placeholder:text-slate-700 focus:border-primary/50 outline-none transition-all font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Trabajo / Entrega</label>
                                <div className="border-2 border-dashed border-white/5 rounded-2xl p-8 text-center hover:border-primary/40 transition-all group bg-black/20">
                                    <input 
                                        type="file" 
                                        id="submission-file" 
                                        className="hidden" 
                                        accept=".txt,.md,.pdf" 
                                        onChange={handleFileUpload}
                                    />
                                    <label htmlFor="submission-file" className="cursor-pointer block">
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                                            <Upload className="w-8 h-8 text-slate-400 group-hover:text-primary-light" />
                                        </div>
                                        <p className="text-sm font-bold text-white mb-1">
                                            {fileName ? fileName : "Carga el archivo .txt o .pdf"}
                                        </p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">O pega el texto debajo</p>
                                    </label>
                                </div>
                            </div>

                            <textarea 
                                value={submissionText}
                                onChange={(e) => setSubmissionText(e.target.value)}
                                placeholder="Pega el contenido del trabajo aquí directamente..."
                                className="w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-4 text-slate-400 placeholder:text-slate-700 focus:border-primary/50 outline-none transition-all resize-none text-xs leading-relaxed"
                            />
                        </div>

                        <button
                            onClick={handleEvaluation}
                            disabled={!studentName.trim() || !submissionText.trim() || isEvaluating}
                            className="w-full bg-primary hover:bg-primary-light text-white font-black py-5 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {isEvaluating ? <Loader2 className="w-6 h-6 animate-spin" /> : <ClipboardCheck className="w-6 h-6" />}
                            INICIAR EVALUACIÓN CON IA
                        </button>
                    </div>

                    {/* Vista Previa de la Pauta */}
                    <div className="bg-surface-light border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
                                <Info className="w-5 h-5" />
                            </div>
                            <h4 className="text-xl font-black text-white">Resumen de Pauta</h4>
                        </div>
                        <div className="bg-black/40 border border-white/5 p-6 rounded-2xl h-[450px] overflow-y-auto custom-scrollbar">
                            <h5 className="font-black text-accent-light text-sm uppercase mb-4 tracking-widest">{rubric.title}</h5>
                            <div className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap font-medium opacity-80">
                                {rubric.content_text}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {!results ? (
                        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
                    ) : results.length === 0 ? (
                        <div className="py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl text-center opacity-30">
                            <AlertCircle className="w-16 h-16 mx-auto mb-4" />
                            <p className="font-bold">No hay evaluaciones previas con esta pauta.</p>
                        </div>
                    ) : (
                        results.map((res: any) => (
                            <div key={res._id} className="bg-surface-light border border-white/5 rounded-[2rem] p-6 lg:p-8 hover:bg-white/5 transition-all group border-l-4 border-l-primary/40">
                                <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                                            {res.score.toFixed(1)}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-white">{res.student_name}</h4>
                                            <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {res.file_name}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-400" /> Corregido por IA</span>
                                                <span>•</span>
                                                <span>{new Date(res.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button 
                                            onClick={() => {
                                                const blob = new Blob([`RESULTADO EVALUACIÓN IA\n\nAlumno: ${res.student_name}\nNota Sugerida: ${res.score}\nArchivo: ${res.file_name}\nFecha: ${new Date(res.created_at).toLocaleString()}\n\nFEEDBACK:\n${res.feedback}`], { type: 'text/plain' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `Resultado_${res.student_name}_IA.txt`;
                                                a.click();
                                            }}
                                            className="flex-1 md:flex-none bg-white/5 hover:bg-white/10 text-white font-black px-6 py-3 rounded-xl border border-white/10 transition-all text-xs"
                                        >
                                            DESCARGAR INFORME
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-8 bg-black/40 border border-white/5 rounded-2xl p-6 lg:p-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Sparkles className="w-5 h-5 text-accent-light" />
                                        <h5 className="text-xs font-black text-accent-light uppercase tracking-widest">Análisis Detallado de la IA</h5>
                                    </div>
                                    <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                        {res.feedback}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

function DeleteRubricButton({ rubricId }: { rubricId: string }) {
    const del = useMutation(api.evaluator.deleteRubric)
    const [deleting, setDeleting] = useState(false)

    const handleDelete = async () => {
        if (!window.confirm("¿Seguro que quieres borrar esta pauta y todo su historial de evaluaciones?")) return
        setDeleting(true)
        try {
            await del({ rubric_id: rubricId as any })
            toast.success("Pauta eliminada")
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-3 bg-white/5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-xl border border-white/5 hover:border-red-400/20 transition-all"
            title="Borrar Pauta"
        >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
    )
}
