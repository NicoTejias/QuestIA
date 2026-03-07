import React from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { ShoppingBag, Star, Coins, Info, Loader2 } from 'lucide-react';

const RewardStore = ({ courseId }) => {
    // 1. Obtener datos del usuario y recompensas desde Convex
    const user = useQuery(api.users.me);
    const rewards = useQuery(api.rewards.getRewardsByCourse, { course_id: courseId });
    const enrollment = useQuery(api.courses.getEnrollmentStatus, { course_id: courseId });

    // 2. Mutación para canjear
    const redeem = useMutation(api.rewards.redeemReward);

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
            alert(`¡Felicidades! Has canjeado: ${reward.name}`);
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    return (
        <div className="bg-slate-950 text-slate-100 p-8 font-sans min-h-screen">
            {/* Header del Mercado */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                        Mercado de Recompensas
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">
                        Gasta tus puntos obtenidos en misiones por beneficios para la clase.
                    </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-2xl shadow-indigo-500/10">
                    <div className="bg-amber-500/20 p-3 rounded-full">
                        <Coins className="text-amber-400 w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Tus Puntos</p>
                        <p className="text-3xl font-black text-white">{enrollment?.total_points || 0}</p>
                    </div>
                </div>
            </header>

            {/* Grid de Recompensas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {rewards.map((item) => (
                    <div
                        key={item._id}
                        className="group bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/20 flex flex-col"
                    >
                        <div className="relative h-48 overflow-hidden bg-slate-800">
                            {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                    <ShoppingBag className="w-12 h-12" />
                                </div>
                            )}
                        </div>

                        <div className="p-6 flex-grow flex flex-col">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                                    {item.name}
                                </h3>
                                <div className="flex items-center text-amber-400 font-bold shrink-0">
                                    <Coins className="w-4 h-4 mr-1" />
                                    {item.cost}
                                </div>
                            </div>

                            <p className="text-slate-400 text-sm mb-6">
                                {item.description}
                            </p>

                            <div className="mt-auto space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Stock:</span>
                                    <span className={item.stock < 5 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                                        {item.stock} disponibles
                                    </span>
                                </div>

                                <button
                                    onClick={() => handleRedeem(item)}
                                    disabled={enrollment.total_points < item.cost || item.stock === 0}
                                    className={`w-full py-3 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                    ${enrollment.total_points >= item.cost && item.stock > 0
                                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95'
                                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                        }`}
                                >
                                    <ShoppingBag className="w-5 h-5" />
                                    {enrollment.total_points >= item.cost ? 'Canjear Ahora' : 'Puntos Insuficientes'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RewardStore;
