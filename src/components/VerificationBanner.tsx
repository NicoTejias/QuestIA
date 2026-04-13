import { useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { ProfilesAPI } from '../lib/api';
import { ShieldCheck, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function VerificationBanner() {
    const { user: profile, refetch } = useProfile()
    const [loading, setLoading] = useState(false);

    if (!profile || profile.is_verified) return null;

    const handleSimulation = async () => {
        if (!profile.clerk_id) return
        setLoading(true);
        try {
            await ProfilesAPI.verifyAccount(profile.clerk_id);
            toast.success("¡Cuenta marcada como verificada!");
            refetch()
        } catch (err) {
            toast.error("Error al verificar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-b border-amber-500/20 px-6 py-3 flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-top duration-500">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-500">
                    <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-center md:text-left">
                    <p className="text-sm font-bold text-amber-200">Verifica tu identidad docente/alumno</p>
                    <p className="text-[10px] text-amber-300/70 font-medium uppercase tracking-wider max-w-md">
                        Confirma tu correo para habilitar el canje de premios y asegurar tu progreso institucional.
                    </p>
                </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-3">
                <button 
                   onClick={handleSimulation}
                   disabled={loading}
                   className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-amber-400 text-[10px] font-bold rounded-lg transition-all border border-amber-500/20"
                >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Send className="w-3 h-3" />}
                    VERIFICAR AHORA
                </button>
            </div>
        </div>
    );
}