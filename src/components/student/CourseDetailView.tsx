import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Loader2, X, PlayCircle, Brain, Target, Star, Flame } from 'lucide-react'
import { toast } from "sonner"
import ChatPanel from "../ChatPanel"

interface CourseDetailViewProps {
    courseId: any;
    currentUserId: any; // ID del usuario actual para el chat
    onBack: () => void;
    onPlayQuiz: (q: any) => void;
}

export default function CourseDetailView({ courseId, currentUserId, onBack, onPlayQuiz }: CourseDetailViewProps) {
    const course = useQuery(api.courses.getCourseById, { courseId })
    const quizzes = useQuery(api.quizzes.getQuizzesByCourse, { course_id: courseId })
    const missions = useQuery(api.missions.getMissions, { course_id: courseId })
    const completeMission = useMutation(api.missions.completeMission)

    const [completing, setCompleting] = useState<string | null>(null)

    const handleCompleteMission = async (missionId: string) => {
        setCompleting(missionId)
        try {
            await completeMission({ mission_id: missionId as any })
            toast.success("¡Misión completada! Puntos obtenidos.")
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setCompleting(null)
        }
    }

    if (!course) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group mb-4"
            >
                <div className="p-1.5 bg-white/5 rounded-lg group-hover:bg-white/10">
                    <X className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">Volver a Ramos</span>
            </button>

            <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-white/10 rounded-2xl md:rounded-[2.5rem] p-6 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px]"></div>
                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 md:gap-8">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4">
                            <span className="px-3 py-1 bg-primary/20 text-primary-light text-[9px] md:text-[10px] font-black rounded-full border border-primary/20 tracking-tighter uppercase">{course.code}</span>
                            <span className="text-slate-500 font-medium hidden xs:inline">•</span>
                            <span className="text-slate-400 text-xs md:text-sm font-medium">Impartido por {course.teacher_name || 'Docente'}</span>
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black text-white mb-4 leading-tight">{course.name}</h2>
                        <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-2xl">{course.description || 'Sin descripción pormenorizada.'}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Columna Quizzes */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <PlayCircle className="w-6 h-6 text-accent" />
                            Quizzes Disponibles
                        </h3>
                        <span className="px-2.5 py-1 bg-accent/10 text-accent-light text-[10px] font-black rounded-lg">{quizzes?.length || 0} RETOS</span>
                    </div>

                    <div className="space-y-4">
                        {quizzes?.map((q: any) => (
                            <div key={q._id} className="group bg-surface-light border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-5 hover:bg-white/5 hover:border-accent/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4 md:gap-5">
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-accent/10 rounded-xl md:rounded-2xl flex items-center justify-center text-accent-light group-hover:bg-accent/20 transition-colors shrink-0">
                                        {q.quiz_type === 'flashcard' ? <Brain className="w-6 h-6 md:w-7 md:h-7" /> : <PlayCircle className="w-6 h-6 md:w-7 md:h-7" />}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-white group-hover:text-accent-light transition-colors text-sm md:text-base truncate">{q.title}</h4>
                                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1.5">
                                            <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                                <Target className="w-2.5 h-2.5" /> {q.num_questions} PREG.
                                            </span>
                                            <span className={`text-[9px] md:text-[10px] font-bold uppercase ${q.difficulty === 'dificil' ? 'text-red-400' : q.difficulty === 'medio' ? 'text-orange-400' : 'text-green-400'}`}>
                                                {q.difficulty}
                                            </span>
                                            <span className="text-[9px] md:text-[10px] font-bold text-gold flex items-center gap-1 bg-gold/10 px-1.5 py-0.5 rounded-md border border-gold/20">
                                                <Star className="w-2.5 h-2.5 fill-gold" />
                                                HASTA {(q.num_questions || 5) * (q.difficulty === 'dificil' ? 20 : q.difficulty === 'medio' ? 15 : 10)} PTS
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                                    <div className="flex flex-col items-start sm:items-end">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">Intentos</span>
                                            <span className={`text-[10px] md:text-xs font-black ${q.attempts_count >= q.max_attempts ? 'text-red-400' : 'text-accent-light'}`}>
                                                {q.attempts_count} / {q.max_attempts}
                                            </span>
                                        </div>
                                        {q.completed && (
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">Score</span>
                                                <span className="text-[10px] md:text-xs font-black text-white">{q.score}%</span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => q.can_take && onPlayQuiz(q)}
                                        disabled={!q.can_take}
                                        className={`font-black text-[9px] md:text-[10px] tracking-widest px-4 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl transition-all shadow-lg shrink-0
                                            ${!q.can_take
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20 cursor-default shadow-none'
                                                : q.completed
                                                    ? 'bg-white/10 text-white border border-white/10 hover:bg-white/20'
                                                    : 'bg-accent text-white hover:scale-105 active:scale-95 shadow-accent/20'}`}
                                    >
                                        {!q.can_take ? 'COMPLETADO' : q.completed ? 'REINTENTAR' : '¡JUGAR!'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Columna Misiones */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <Target className="w-6 h-6 text-primary" />
                            Misiones del Ramo
                        </h3>
                        <span className="px-2.5 py-1 bg-primary/10 text-primary-light text-[10px] font-black rounded-lg">{missions?.length || 0} ACTIVAS</span>
                    </div>

                    <div className="space-y-4">
                        {missions?.map((m: any) => (
                            <div key={m._id} className="group bg-surface-light border border-white/5 rounded-3xl p-5 hover:bg-white/5 hover:border-primary/40 transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary-light">
                                            <Flame className="w-6 h-6" />
                                        </div>
                                        <div className="flex flex-col">
                                            <h4 className="font-bold text-white group-hover:text-primary-light transition-colors">{m.title}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-[200px]">{m.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[9px] uppercase font-black tracking-widest text-slate-500">Recompensa</span>
                                        <div className="flex items-center gap-1 text-gold font-black bg-gold/10 px-2.5 py-1 rounded-lg border border-gold/20 shadow-sm">
                                            <Star className="w-3.5 h-3.5 fill-gold" />
                                            <span className="text-xs">+{m.points} PTS</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleCompleteMission(m._id)}
                                    disabled={completing === m._id || m.completed}
                                    className={`w-full font-bold text-xs py-2 rounded-xl border transition-all uppercase tracking-widest
                                        ${m.completed
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : 'bg-slate-800 text-slate-400 border-white/5 hover:bg-primary/20 hover:text-white hover:border-primary/20'}`}
                                >
                                    {completing === m._id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : m.completed ? 'COMPLETADA' : 'COMPLETAR MISIÓN'}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Chat Colaborativo */}
            <div className="mt-8">
                <ChatPanel courseId={courseId} currentUserId={currentUserId} />
            </div>
        </div>
    )
}
