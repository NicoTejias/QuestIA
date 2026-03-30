import { Activity, Star, Flame } from 'lucide-react'

interface RetentionProgressWidgetProps {
    user: any;
    courses: any[];
}

export default function RetentionProgressWidget({ user, courses }: RetentionProgressWidgetProps) {
    // Calculamos un "Nivel de Compromiso" basado en racha y puntos
    const streak = user.daily_streak || 0;
    const totalPoints = courses.reduce((sum, c) => sum + (c.ranking_points || 0), 0);
    
    // Simulación de progreso semanal (esto idealmente vendría de una query a logs de actividad)
    // Por ahora usamos la racha como driver de "salud"
    const healthPercentage = Math.min(100, (streak * 20) + (totalPoints > 0 ? 30 : 0));


    return (
        <div className="bg-gradient-to-br from-surface-light to-surface border border-white/5 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Activity className="w-24 h-24 text-primary" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                            <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                            Mi Racha y Crecimiento
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">¡Sigue así! Tu constancia es el camino al éxito</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-green-500/20 text-green-400 border border-green-500/20 shadow-lg shadow-green-500/10">
                        ✅ Mantente Activo
                    </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Stats Card */}
                    <div className="space-y-4 col-span-1">
                        <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase">Racha Actual</span>
                                <Flame className={`w-4 h-4 ${streak > 0 ? 'text-orange-500' : 'text-slate-700'}`} />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-white">{streak}</span>
                                <span className="text-xs font-bold text-slate-500 uppercase">Días</span>
                            </div>
                        </div>

                        <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase">Salud de Carrera</span>
                                <Activity className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-white">{healthPercentage}%</span>
                                <span className="text-xs font-bold text-slate-500 uppercase">Estable</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Chart Simulation */}
                    <div className="col-span-1 md:col-span-2 bg-black/40 rounded-3xl p-6 border border-white/5 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold text-white uppercase italic">Consistencia Semanal</span>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                                    <div 
                                        key={day} 
                                        className={`w-1.5 h-6 rounded-full ${day <= streak ? 'bg-primary' : 'bg-white/5'}`}
                                    />
                                ))}
                            </div>
                        </div>
                        
                        <div className="relative h-4 bg-white/5 rounded-full overflow-hidden mb-4">
                            <div 
                                className={`absolute inset-y-0 left-0 transition-all duration-1000 rounded-full ${
                                    healthPercentage > 70 ? 'bg-gradient-to-r from-primary to-green-500' :
                                    healthPercentage > 40 ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${healthPercentage}%` }}
                            />
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                            {streak >= 5 
                                ? "¡Excelente nivel de constancia! Estás asegurando tu éxito académico con cada reto completado."
                                : streak >= 1
                                ? "¡Vas por buen camino! Sigue así para fortalecer tu aprendizaje y desbloquear nuevos logros."
                                : "¡Comienza tu aventura hoy! Completa un reto para activar tu racha y potenciar tu avance académico."
                            }
                        </p>

                    </div>
                </div>

                {/* Micro-incentive */}
                <div className="mt-6 flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Actualizado en tiempo real</span>
                    </div>
                    <div className="flex items-center gap-1 text-gold">
                        <Star className="w-3 h-3 fill-gold" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Gana 20 pts extras al llegar a racha 5</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
