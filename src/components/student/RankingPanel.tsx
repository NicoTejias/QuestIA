import { useState } from "react"
import { useQuery, usePaginatedQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Trophy, Loader2, Brain, Coins } from 'lucide-react'

interface RankingPanelProps {
    courses: any[];
}

export default function RankingPanel({ courses }: RankingPanelProps) {
    const [selectedId, setSelectedId] = useState<string>(courses?.[0]?._id || '')
    const [isGlobal, setIsGlobal] = useState(false)

    // Vista Local (Paginada)
    const { results: leaderboard, status: localStatus, loadMore } = usePaginatedQuery(
        api.missions.getLeaderboard,
        (selectedId && !isGlobal) ? { course_id: selectedId as any } : 'skip',
        { initialNumItems: 10 }
    )

    // Vista Global (Top 100)
    const globalLeaderboard = useQuery(api.courses.getGlobalRanking,
        (selectedId && isGlobal) ? { course_id: selectedId as any } : 'skip'
    )

    const currentLeaderboard = isGlobal ? (globalLeaderboard || []) : leaderboard
    const status = isGlobal ? (globalLeaderboard ? "Loaded" : "LoadingFirstPage") : localStatus

    return (
        <div className="max-w-4xl mx-auto py-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 text-center lg:text-left">
                <div className="flex items-center gap-6 justify-center lg:justify-start">
                    <Trophy className="w-16 h-16 text-gold" />
                    <div>
                        <h2 className="text-3xl font-black text-white mb-1">Salón de la Fama</h2>
                        <p className="text-slate-400">Compite con tus compañeros y alcanza la cima del ranking.</p>
                    </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                    <select
                        title="Seleccionar Ramo"
                        aria-label="Seleccionar Ramo"
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="bg-transparent border-none rounded-2xl px-4 py-2 font-bold text-white outline-none"
                    >
                        {courses.length === 0 && <option value="">Sin Ramos</option>}
                        {courses.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                    
                    <div className="flex bg-black/40 rounded-xl p-1 shrink-0">
                        <button 
                            onClick={() => setIsGlobal(false)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isGlobal ? 'bg-primary text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                            Mi Sección
                        </button>
                        <button 
                            onClick={() => setIsGlobal(true)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isGlobal ? 'bg-accent text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                            Ranking Global
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-surface-light rounded-3xl overflow-hidden border border-white/10">
                {status === "LoadingFirstPage" ? (
                    <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
                ) : currentLeaderboard.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 text-center">
                        <Trophy className="w-12 h-12 text-slate-600 mb-4" />
                        <h3 className="text-white font-semibold">Sin alumnos inscritos</h3>
                        <p className="text-slate-400 text-sm mt-1">Aún no hay puntos en este ramo.</p>
                    </div>
                ) : (
                    <>
                        {currentLeaderboard.map((student: any, i: number) => (
                            <div key={student._id || student.userId} className={`flex items-center justify-between p-6 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${i < 3 ? 'bg-white/[0.02]' : ''}`}>
                                <div className="flex items-center gap-6 overflow-hidden">
                                    <span className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg
                                        ${i === 0 ? 'bg-gold/20 text-gold shadow-lg shadow-gold/20' :
                                            i === 1 ? 'bg-slate-400/20 text-slate-300' :
                                                i === 2 ? 'bg-amber-700/20 text-amber-600' :
                                                    'bg-white/5 text-slate-500'}`}>
                                        #{i + 1}
                                    </span>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-white text-lg truncate">{student.name}</h4>
                                        <div className="flex flex-wrap items-center gap-3 mt-1">
                                            <div className="flex items-center gap-1.5">
                                                <Brain className="w-3 h-3 text-slate-500" />
                                                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{student.belbin || "Sin determinar"}</span>
                                            </div>
                                            {isGlobal && (
                                                <>
                                                    <span className="text-slate-700">•</span>
                                                    <span className="text-[10px] font-black text-primary-light uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded border border-primary/10">
                                                        {student.section}
                                                    </span>
                                                    <span className="text-slate-700">•</span>
                                                    <span className="text-[10px] font-medium text-slate-500 truncate" title={student.teacherName}>
                                                        {student.teacherName}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl border border-white/5 shrink-0 ml-4">
                                    <Coins className="w-5 h-5 text-gold" />
                                    <span className="font-black text-xl text-white">{(student.points || student.ranking_points || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                        {status === "CanLoadMore" && !isGlobal && (
                            <div className="p-4 border-t border-white/5 text-center">
                                <button
                                    onClick={() => loadMore(10)}
                                    className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                                >
                                    Cargar más...
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
