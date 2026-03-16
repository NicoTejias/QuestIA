import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, X, Sparkles, ArrowRight } from 'lucide-react'
import BartleTest from './BartleTest'

interface BartlePopupProps {
    user: any;
    onComplete: () => void;
}

export default function BartlePopup({ user, onComplete }: BartlePopupProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [showTest, setShowTest] = useState(false)

    useEffect(() => {
        // Solo mostrar si no tiene perfil de Bartle
        if (user && !user.bartle_profile) {
            // Un pequeño delay para que no aparezca de golpe al cargar
            const timer = setTimeout(() => {
                setIsOpen(true)
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [user])

    if (!isOpen) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !showTest && setIsOpen(false)}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-2xl bg-surface-light border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                        {!showTest ? (
                            <div className="p-8 md:p-12 text-center relative">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -z-10" />
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 blur-[100px] -z-10" />

                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 mb-8">
                                    <Star className="w-4 h-4 text-primary-light fill-primary-light" />
                                    <span className="text-[10px] font-black text-primary-light uppercase tracking-[0.2em]">Misión de Perfil</span>
                                </div>

                                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                                    ¡Descubre tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-accent-light">Sello Quest</span>! 🚀
                                </h2>

                                <p className="text-slate-400 text-lg md:text-xl mb-10 leading-relaxed max-w-lg mx-auto">
                                    Responde 4 preguntas rápidas para que la IA personalice tus recompensas y misiones según tu forma de aprender.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <button
                                        onClick={() => setShowTest(true)}
                                        className="bg-gradient-to-r from-primary to-accent text-white font-black px-10 py-5 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 text-lg"
                                    >
                                        <Sparkles className="w-6 h-6" />
                                        INICIAR TEST
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold px-8 py-5 rounded-2xl border border-white/5 transition-all text-sm"
                                    >
                                        MÁS TARDE
                                    </button>
                                </div>

                                <p className="mt-8 text-[10px] text-slate-600 font-black uppercase tracking-widest">
                                    Solo toma 30 segundos • Personalización IA 100%
                                </p>
                            </div>
                        ) : (
                            <div className="max-h-[85vh] overflow-y-auto custom-scrollbar">
                                <BartleTest onComplete={() => {
                                    onComplete();
                                    setIsOpen(false);
                                }} />
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
