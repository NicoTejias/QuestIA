import { useNavigate, Link } from "react-router-dom"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Trophy, Mail, Settings, Sparkles, User as UserIcon, Award } from 'lucide-react'

interface PerfilPanelProps {
    user: any;
    totalPoints: number;
    belbinRole: string;
}

export default function PerfilPanel({ user, totalPoints, belbinRole }: PerfilPanelProps) {
    const navigate = useNavigate()
    const myBadges = useQuery(api.badges.getMyBadges)
    return (
        <div className="max-w-4xl mx-auto py-10 space-y-8">
            <div className="bg-surface-light border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="w-32 h-32 bg-gradient-to-br from-primary to-accent rounded-[2.5rem] flex items-center justify-center overflow-hidden shadow-2xl shadow-primary/20">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                            <UserIcon className="w-16 h-16 text-primary" />
                        </div>
                    )}
                </div>
                <div className="text-center md:text-left flex-1">
                    <h2 className="text-3xl font-black text-white mb-1">{user.name}</h2>
                    <p className="text-primary-light font-bold uppercase tracking-widest text-sm mb-4">{belbinRole}</p>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                        <div className="bg-black/20 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-gold" />
                            <span className="text-white font-bold">{totalPoints.toLocaleString()} PTS Totales</span>
                        </div>
                        <div className="bg-black/20 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-500" />
                            <span className="text-slate-400 text-sm">{user.email}</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/perfil')}
                    className="bg-white/5 hover:bg-white/10 text-white font-bold px-6 py-3 rounded-xl border border-white/10 transition-all flex items-center gap-2"
                >
                    <Settings className="w-4 h-4" />
                    Configurar Perfil
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-3xl p-8">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                        Tu Perfil Belbin
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        Tu rol dominante es <strong>{belbinRole}</strong>. Esto significa que aportas valor al equipo mediante tu capacidad de {belbinRole === 'Cerebro' ? 'generar ideas creativas y resolver problemas complejos.' : 'impulsar la acción y superar obstáculos con determinación.'}
                    </p>
                    <Link to="/test-belbin" className="text-indigo-400 hover:text-indigo-300 font-bold text-sm">Repetir Test →</Link>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-3xl p-8">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-primary-light" />
                        Perfil de Jugador (Bartle)
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        {user.bartle_profile 
                            ? `Tu estilo de juego es ${user.bartle_profile.toUpperCase()}. Esto influye en cómo interactúas con las misiones y recompensas.`
                            : "Aún no has descubierto tu perfil de jugador. ¡Realiza el test para reservar tu lugar en el ranking!"}
                    </p>
                    <button 
                         onClick={() => navigate('/perfil')}
                         className="text-primary-light hover:text-primary font-bold text-sm"
                    >
                        Gestionar Perfil →
                    </button>
                </div>
            </div>

            {/* Mis Insignias */}
            <div className="bg-surface-light border border-white/5 rounded-3xl p-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Award className="w-5 h-5 text-gold" />
                    Mis Insignias
                    {myBadges && (
                        <span className="ml-auto text-xs bg-gold/10 text-gold px-2.5 py-1 rounded-full border border-gold/20">
                            {myBadges.length}
                        </span>
                    )}
                </h3>
                {myBadges === undefined ? (
                    <div className="flex justify-center py-6">
                        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : myBadges.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl">
                        <Award className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">Aún no tienes insignias</p>
                        <p className="text-slate-600 text-xs mt-1">Destácate en tus ramos para ganar reconocimientos</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {myBadges.map((ub: any) => (
                            <div
                                key={ub._id}
                                className="bg-gradient-to-br from-gold/10 to-transparent border border-gold/20 rounded-2xl p-4 flex flex-col items-center gap-2 text-center hover:border-gold/40 transition-all"
                                title={ub.badge?.description}
                            >
                                <span className="text-3xl">{ub.badge?.icon ?? '🏅'}</span>
                                <p className="text-white text-xs font-bold leading-tight">{ub.badge?.name}</p>
                                <p className="text-slate-500 text-[10px] truncate w-full">{ub.courseCode ?? ub.courseName}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
