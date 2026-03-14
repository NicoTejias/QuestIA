import { BookOpen, Trophy, Coins, ChevronRight } from 'lucide-react'
import { getGreeting } from '../../utils/dashboardUtils'

interface DashboardHomeProps {
    courses: any[];
    totalRanking: number;
    firstName: string;
    onSelectCourse: (id: string) => void;
}

export default function DashboardHome({
    courses,
    totalRanking,
    firstName,
    onSelectCourse
}: DashboardHomeProps) {
    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Hero Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-white/10 rounded-2xl md:rounded-[2rem] p-6 md:p-10">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary/20 rounded-full blur-[80px]"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 text-center md:text-left">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                            <div className="px-3 py-1 bg-primary/20 rounded-full text-[10px] md:text-xs font-black text-primary-light uppercase tracking-widest border border-primary/20">
                                {getGreeting()}
                            </div>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-[1.1] break-words">
                            ¡Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-accent-light">{firstName}</span>!
                        </h2>
                        <p className="text-slate-400 text-base md:text-lg max-w-md leading-relaxed mx-auto md:mx-0">
                            {courses.length === 0
                                ? 'Tu aventura está por comenzar. Espera a que tu docente te inscriba en un ramo.'
                                : `Hoy es un gran día para aprender. Tienes ${totalRanking.toLocaleString()} puntos acumulados.`
                            }
                        </p>
                    </div>
                    <div className="flex flex-col items-center p-5 md:p-6 bg-white/5 backdrop-blur-md rounded-2xl md:rounded-[2rem] border border-white/10 shadow-2xl shrink-0">
                        <div className="relative mb-3 md:mb-4">
                            <svg className="w-24 h-24 md:w-32 md:h-32 transform -rotate-90">
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5 md:hidden" />
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5 hidden md:block" />
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="251" strokeDashoffset={251 - (251 * 0.75)} className="text-primary transition-all duration-1000 md:hidden" />
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="364" strokeDashoffset={364 - (364 * 0.75)} className="text-primary transition-all duration-1000 hidden md:block" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <Trophy className="w-6 h-6 md:w-8 md:h-8 text-gold mb-1" />
                                <span className="text-xl md:text-2xl font-black text-white leading-none">#2</span>
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nivel 14</p>
                    </div>
                </div>
            </div>

            {/* Grid de Ramos */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-black text-white">Mis Ramos</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">ORDENAR POR</span>
                        <select className="bg-white/5 border border-white/10 rounded-lg text-xs font-bold px-3 py-1.5 text-slate-300 outline-none" title="Ordenar lista de ramos">
                            <option>RECIENTES</option>
                            <option>PUNTOS</option>
                        </select>
                    </div>
                </div>

                {courses.length === 0 ? (
                    <div className="bg-white/5 border border-dashed border-white/10 rounded-[2rem] p-16 text-center max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <BookOpen className="w-10 h-10 text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Sin ramos inscritos</h3>
                        <p className="text-slate-400 max-w-xs mx-auto">
                            Comunícate con tu docente si tu RUT debería estar en la lista de alumnos.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {courses.map((course: any) => (
                            <div
                                key={course._id}
                                onClick={() => onSelectCourse(course._id)}
                                className="group bg-surface-light border border-white/5 rounded-3xl p-6 hover:bg-white/5 hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                                    <BookOpen className="w-16 h-16 text-primary" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center text-primary-light shrink-0">
                                            <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
                                        </div>
                                        <div className="flex flex-col items-end min-w-0 ml-4">
                                            <span className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase mb-1">CÓDIGO</span>
                                            <span className="text-[10px] md:text-xs font-mono text-white/50 truncate max-w-[80px]">{course.code}</span>
                                        </div>
                                    </div>
                                    <h4 className="text-lg md:text-xl font-bold text-white mb-6 group-hover:text-primary-light transition-colors line-clamp-1">{course.name}</h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 font-black uppercase mb-1">RANKING</span>
                                            <div className="flex items-center gap-2">
                                                <Trophy className="w-4 h-4 text-gold" />
                                                <span className="text-lg font-black text-white">{(course.ranking_points || course.total_points || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col border-l border-white/5 pl-4">
                                            <span className="text-[10px] text-slate-500 font-black uppercase mb-1">CANJEABLE</span>
                                            <div className="flex items-center gap-2">
                                                <Coins className="w-4 h-4 text-accent" />
                                                <span className="text-lg font-black text-white">{(course.spendable_points || course.total_points || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center justify-between pt-6 border-t border-white/5">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-6 h-6 rounded-full border-2 border-surface-light bg-slate-700"></div>
                                            ))}
                                            <div className="w-6 h-6 rounded-full border-2 border-surface-light bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary-light">+12</div>
                                        </div>
                                        <span className="text-xs font-black text-primary-light flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            ACCEDER <ChevronRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
