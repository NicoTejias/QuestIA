import React from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../_generated/api";
import { ShoppingBag, Star, Coins, Info, Loader2, Snowflake, Flame, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const RewardStore = ({ courseId }) => {
    // 1. Obtener datos del usuario y recompensas desde Convex
    const user = useQuery(api.users.getProfile);
    const rewards = useQuery(api.rewards.getRewardsByCourse, { course_id: courseId });
    const enrollment = useQuery(api.courses.getEnrollmentStatus, { course_id: courseId });

    // 2. Mutaciones
    const redeem = useMutation(api.rewards.redeemReward);
    const buyIceCube = useMutation(api.users.buyIceCube);

    if (!rewards || !user || enrollment === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
        );
    }

    const handleRedeem = async (reward) => {
        try {
            await redeem({ reward_id: reward._id });
            toast.success(`¡Felicidades! Has canjeado: ${reward.name}`);
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        }
    };

    const handleBuyIceCube = async () => {
        try {
            await buyIceCube({ course_id: courseId });
            toast.success("¡Cubo de Hielo obtenido! Tu racha está protegida.");
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        }
    };

    const spendablePoints = enrollment?.spendable_points ?? 0;

    return (
        <div className="bg-surface text-slate-100 p-4 md:p-8 font-sans min-h-screen">
            {/* Header del Mercado */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 md:mb-12 gap-6">
                <div className="min-w-0">
                    <h1 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-primary-light to-accent-light bg-clip-text text-transparent leading-tight">
                        Mercado de Recompensas
                    </h1>
                    <p className="text-slate-400 mt-2 text-base md:text-lg max-w-md">
                        Invierte tus puntos en beneficios exclusivos y protección de racha.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3 md:gap-4 w-full md:w-auto">
                    {/* Visualización de Hielos */}
                    <div className="flex-1 md:flex-none bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-3 md:p-4 flex items-center gap-3 md:gap-4 shadow-xl shadow-cyan-500/5">
                        <div className="bg-cyan-500/20 p-2 md:p-3 rounded-full relative shrink-0">
                            <Snowflake className="text-cyan-400 w-6 h-6 md:w-8 md:h-8" />
                            {user.ice_cubes > 0 && (
                                <span className="absolute -top-1 -right-1 bg-cyan-400 text-black text-[9px] md:text-[10px] font-black px-1.5 rounded-full ring-2 ring-slate-950">
                                    {user.ice_cubes}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="hidden xs:block text-[8px] md:text-[10px] text-cyan-400 uppercase tracking-widest font-black">Protección</p>
                            <p className="text-lg md:text-2xl font-black text-white">Racha</p>
                        </div>
                    </div>

                    <div className="flex-1 md:flex-none bg-slate-900 border border-white/5 rounded-2xl p-3 md:p-4 flex items-center gap-3 md:gap-4 shadow-2xl">
                        <div className="bg-amber-500/20 p-2 md:p-3 rounded-full shrink-0">
                            <Coins className="text-amber-400 w-6 h-6 md:w-8 md:h-8" />
                        </div>
                        <div>
                            <p className="hidden xs:block text-[8px] md:text-[10px] text-slate-500 uppercase tracking-wider font-bold">Puntos</p>
                            <p className="text-lg md:text-3xl font-black text-white">{spendablePoints}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Recompensa Recomendada (SISTEMA) */}
            <section className="mb-16">
                <div className="flex items-center gap-3 mb-6">
                    <Star className="text-primary w-6 h-6 fill-primary" />
                    <h2 className="text-2xl font-bold text-white">Recomendado por el Sistema</h2>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-600/20 via-slate-900 to-cyan-600/20 border border-indigo-500/30 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 blur-[100px] pointer-events-none" />
                    
                    <div className="relative shrink-0">
                        <div className="w-24 h-24 md:w-40 md:h-40 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl rotate-3 group-hover:rotate-6 transition-transform duration-500">
                            <Snowflake className="w-12 h-12 md:w-20 md:h-20 text-white animate-pulse" />
                        </div>
                        <div className="absolute -bottom-2 md:-bottom-4 -right-2 md:-right-4 bg-orange-500 rounded-lg md:rounded-2xl p-1.5 md:p-3 shadow-xl flex items-center gap-1 md:gap-2">
                           <Flame className="w-3 h-3 md:w-6 md:h-6 text-white" />
                           <span className="text-white font-black text-[8px] md:text-sm">SAVE STREAK</span>
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left min-w-0">
                        <h3 className="text-xl md:text-3xl font-black text-white mb-2 italic tracking-tight italic">Cubo de Hielo (Racha)</h3>
                        <p className="text-slate-400 text-sm md:text-lg leading-relaxed max-w-xl">
                            ¿Faltaste un día? ¡No hay problema! Este ítem se consume automáticamente si no te conectas, manteniendo tu racha intacta.
                        </p>
                        
                        <div className="mt-6 md:mt-8 flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <div className="flex items-center gap-2 text-lg md:text-2xl font-black text-amber-400 bg-amber-400/10 px-4 md:px-6 py-1.5 md:py-2 rounded-full border border-amber-400/20">
                                <Coins className="w-4 h-4 md:w-6 md:h-6" />
                                200 <span className="text-xs md:text-base font-bold ml-1">PTS</span>
                            </div>
                            <button 
                                onClick={handleBuyIceCube}
                                disabled={spendablePoints < 200}
                                className={`w-full sm:w-auto px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-sm md:text-lg transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl
                                    ${spendablePoints >= 200 
                                        ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:shadow-indigo-500/40' 
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'}`}
                            >
                                <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
                                {spendablePoints >= 200 ? 'COMPRAR' : 'INSUFICIENTE'}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Grid de Recompensas del Ramo */}
            <section>
                <div className="flex items-center gap-3 mb-8">
                    <ShoppingBag className="text-slate-400 w-6 h-6" />
                    <h2 className="text-2xl font-bold text-white">Premios del Docente</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {rewards.length === 0 ? (
                        <div className="col-span-full bg-slate-900/50 border border-white/5 rounded-3xl p-12 text-center">
                            <p className="text-slate-500 font-medium italic">El docente aún no ha publicado premios específicos para este ramo.</p>
                        </div>
                    ) : (
                        rewards.map((item) => (
                            <div
                                key={item._id}
                                className="group bg-slate-900 border border-white/5 rounded-[2rem] overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 flex flex-col"
                            >
                                <div className="relative h-56 overflow-hidden bg-slate-800 flex items-center justify-center">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-slate-700">
                                            <ShoppingBag className="w-20 h-20 opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                                        <Coins className="w-4 h-4 text-amber-400" />
                                        <span className="text-amber-400 font-black">{item.cost}</span>
                                    </div>
                                </div>

                                <div className="p-8 flex-grow flex flex-col">
                                    <h3 className="text-xl font-black text-white mb-3 group-hover:text-primary-light transition-colors">
                                        {item.name}
                                    </h3>

                                    <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                                        {item.description}
                                    </p>

                                    <div className="mt-auto space-y-6">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-500">Stock del Ramo:</span>
                                            <span className={item.stock < 5 ? 'text-rose-400' : 'text-emerald-400'}>
                                                {item.stock} unidades
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => handleRedeem(item)}
                                            disabled={spendablePoints < item.cost || item.stock === 0}
                                            className={`w-full py-4 px-6 rounded-2xl font-black transition-all flex items-center justify-center gap-3
                                                ${spendablePoints >= item.cost && item.stock > 0
                                                    ? 'bg-white text-black hover:bg-primary-light hover:text-white shadow-xl active:scale-95'
                                                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                                }`}
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            {spendablePoints >= item.cost ? 'CANJEAR' : 'PUNTOS INSUFICIENTES'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
};

export default RewardStore;
