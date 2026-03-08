import { Home, Compass, ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative overflow-hidden">
            {/* Backdrop Elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(100,100,255,0.05)_0%,transparent_50%)]"></div>
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent/10 rounded-full blur-[120px] animate-pulse delay-700"></div>

            <div className="bg-surface-light border border-white/10 p-12 md:p-16 rounded-[3rem] max-w-xl w-full text-center shadow-2xl relative z-10 backdrop-blur-xl animate-in fade-in zoom-in duration-700">
                <div className="relative mb-12">
                    <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-[2.5rem] flex items-center justify-center mx-auto relative group">
                        <Compass className="w-16 h-16 text-primary group-hover:rotate-180 transition-transform duration-1000" />
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-black/60 border border-white/10 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-xl">
                            ?
                        </div>
                    </div>
                    <div className="mt-8">
                        <h1 className="text-8xl font-black text-white tracking-tighter mb-2 opacity-10">404</h1>
                        <h2 className="text-3xl font-black text-white absolute inset-x-0 bottom-0 mb-4 translate-y-4">COORDENADAS PERDIDAS</h2>
                    </div>
                </div>

                <p className="text-slate-400 text-lg mb-10 leading-relaxed max-w-sm mx-auto font-medium">
                    Parece que has llegado a un sector inexplorado del sistema. No te preocupes, el retorno es sencillo.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Retroceder
                    </button>
                    <Link
                        to="/"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white font-black px-10 py-4 rounded-2xl hover:bg-primary-light hover:-translate-y-1 transition-all shadow-xl shadow-primary/25 active:scale-95 leading-none"
                    >
                        <Home className="w-5 h-5" />
                        PÁGINA PRINCIPAL
                    </Link>
                </div>

                <div className="mt-12 pt-12 border-t border-white/5">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        ERROR_CODE: PATH_NOT_DEFINED
                    </p>
                </div>
            </div>
        </div>
    )
}
