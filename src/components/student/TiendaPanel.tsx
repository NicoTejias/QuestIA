import { useState } from "react"
import { usePaginatedQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Gift, Loader2, Coins } from 'lucide-react'
import { toast } from "sonner"

interface TiendaPanelProps {
    courses: any[];
}

export default function TiendaPanel({ courses }: TiendaPanelProps) {
    const [selectedId, setSelectedId] = useState<string>(courses?.[0]?._id || '')
    const { results: rewards, status, loadMore } = usePaginatedQuery(
        api.rewards.getRewardsByCourse,
        selectedId ? { course_id: selectedId as any } : 'skip',
        { initialNumItems: 8 }
    )
    const redeemReward = useMutation(api.rewards.redeemReward)
    const [processing, setProcessing] = useState<string | null>(null)

    const handleRedeem = async (rewardId: string) => {
        if (!confirm('¿Estás seguro de canjear esta recompensa?')) return
        setProcessing(rewardId)
        try {
            await redeemReward({ reward_id: rewardId as any })
            toast.success('¡Canje exitoso! Verás esto reflejado pronto en el sistema.')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setProcessing(null)
        }
    }

    return (
        <div className="max-w-6xl mx-auto py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h2 className="text-3xl font-black text-white mb-2">Tienda de Canje</h2>
                    <p className="text-slate-400">Utiliza tus puntos para obtener beneficios académicos y cosméticos.</p>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        title="Seleccionar Ramo"
                        aria-label="Seleccionar Ramo"
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="bg-surface-light border border-white/10 rounded-2xl px-6 py-3 font-bold text-white outline-none focus:border-primary/50 transition-all"
                    >
                        {courses.length === 0 && <option value="">Sin Ramos</option>}
                        {courses.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {status === "LoadingFirstPage" ? (
                    <div className="col-span-full py-12 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>
                ) : rewards.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-surface-light border border-dashed border-white/10 rounded-3xl">
                        <Gift className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-white font-semibold mb-1">Sin Recompensas</h3>
                        <p className="text-slate-400 text-sm">Tu docente aún no ha agregado recompensas para este ramo.</p>
                    </div>
                ) : (
                    <>
                        {rewards.map((r: any) => (
                            <div key={r._id} className="group bg-surface-light border border-white/5 rounded-[2rem] p-8 hover:bg-white/5 hover:border-primary/50 transition-all overflow-hidden relative">
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-accent/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Gift className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{r.name}</h3>
                                <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-6">{r.stock} DISPONIBLES</p>

                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Coins className="w-5 h-5 text-gold" />
                                        <span className="text-2xl font-black text-white">{r.cost}</span>
                                    </div>
                                    <button
                                        onClick={() => handleRedeem(r._id)}
                                        disabled={processing === r._id}
                                        title={`Canjear ${r.name}`}
                                        className="bg-primary text-white font-black text-xs px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {processing === r._id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'CANJEAR'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
            {status === "CanLoadMore" && (
                <div className="mt-12 text-center">
                    <button
                        onClick={() => loadMore(8)}
                        className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl border border-white/10 transition-all uppercase tracking-widest text-xs"
                    >
                        Cargar más recompensas
                    </button>
                </div>
            )}
        </div>
    )
}
