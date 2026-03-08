import { AlertCircle, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-4">
            <div className="bg-surface-light border border-white/10 p-12 rounded-[2.5rem] max-w-md w-full text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-accent/10 rounded-full blur-[50px]"></div>

                <div className="w-24 h-24 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-12 h-12 text-red-400" />
                </div>

                <h1 className="text-6xl font-black text-white mb-2">404</h1>
                <h2 className="text-xl font-bold text-slate-300 mb-6">Página no encontrada</h2>
                <p className="text-slate-400 mb-8 leading-relaxed">Lo sentimos, la página que buscas no existe o ha sido movida a otro enlace.</p>

                <Link to="/" className="inline-flex items-center gap-2 bg-accent text-white font-bold px-8 py-4 rounded-xl hover:bg-accent-light hover:-translate-y-1 transition-all shadow-lg shadow-accent/20">
                    <Home className="w-5 h-5" />
                    Volver al Inicio
                </Link>
            </div>
        </div>
    )
}
