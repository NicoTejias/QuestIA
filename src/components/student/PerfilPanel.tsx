import { useNavigate, Link } from "react-router-dom"
import { Trophy, Mail, Settings, Sparkles, Coins } from 'lucide-react'

interface PerfilPanelProps {
    user: any;
    totalPoints: number;
    belbinRole: string;
}

export default function PerfilPanel({ user, totalPoints, belbinRole }: PerfilPanelProps) {
    const navigate = useNavigate()
    return (
        <div className="max-w-4xl mx-auto py-10 space-y-8">
            <div className="bg-surface-light border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="w-32 h-32 bg-gradient-to-br from-primary to-accent rounded-[2.5rem] flex items-center justify-center text-4xl shadow-2xl shadow-primary/20">
                    {belbinRole === 'Cerebro' ? '🧠' : belbinRole === 'Impulsor' ? '⚡' : '🎓'}
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

                <div className="bg-gradient-to-br from-gold/10 to-transparent border border-gold/20 rounded-3xl p-8">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Coins className="w-5 h-5 text-gold" />
                        Beneficios Diarios
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        Recuerda que cada día, al realizar tu primer quiz, recibirás un bono de <strong>20 puntos extra</strong> solo por participar. ¡Mantente activo!
                    </p>
                    <div className="text-[10px] text-gold font-black uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full inline-block">Bono Disponible hoy</div>
                </div>
            </div>
        </div>
    )
}
