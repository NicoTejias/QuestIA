import { useLocation } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { ShieldAlert, ArrowLeft, Sparkles } from "lucide-react";

export default function AuthErrorPage() {
    const location = useLocation();
    const { signOut } = useClerk();
    const params = new URLSearchParams(location.search);
    const error = params.get("error");

    // Ya no deslogueamos automáticamente para que el usuario pueda leer el error.
    // El deslogueo ocurrirá cuando el usuario decida reintentar.
    const handleRetry = async () => {
        try {
            await signOut();
            window.location.href = "/login";
        } catch (error) {
            console.error("Error signing out:", error);
            window.location.href = "/login";
        }
    };

    let title = "Acceso Denegado";
    let message = "Hubo un problema al intentar iniciar sesión.";
    let details = error || "Error desconocido";

    if (details.includes("Solo se permiten correos institucionales")) {
        title = "Correo No Admitido";
        message = "Para ingresar a QuestIA, es obligatorio utilizar tu cuenta institucional autorizada.";
        details = "Asegúrate de seleccionar el correo de tu institución.";
    }

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/10 blur-[150px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/10 blur-[150px] -z-10" />

            <div className="w-full max-w-xl bg-surface-light border border-white/5 rounded-[2.5rem] p-10 md:p-16 shadow-2xl relative text-center">
                <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <ShieldAlert className="w-10 h-10 text-red-400" />
                </div>

                <h1 className="text-3xl font-black text-white mb-4 tracking-tight">
                    {title}
                </h1>
                
                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                    {message}
                </p>

                <div className="bg-black/20 border border-white/5 rounded-2xl p-6 mb-10">
                    <p className="text-slate-500 text-xs uppercase font-black tracking-widest mb-2">Detalles del Error</p>
                    <p className="text-red-400 font-bold">{details}</p>
                </div>

                <div className="flex flex-col gap-4">
                    <button 
                        onClick={handleRetry}
                        className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-primary hover:bg-primary-light text-white font-black rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" /> REINTENTAR CON OTRO CORREO
                    </button>

                    <div className="pt-8 border-t border-white/5 flex items-center justify-center gap-3">
                        <Sparkles className="w-4 h-4 text-slate-600 opacity-40" />
                        <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest italic leading-none">
                            Plataforma QuestIA • Seguridad Estudiantil
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}
