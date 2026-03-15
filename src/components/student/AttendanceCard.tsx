import { useState } from 'react'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Smartphone, ShieldCheck, Loader2, MapPin } from 'lucide-react'
import { toast } from 'sonner'

export default function AttendanceCard({ courseId }: { courseId: any }) {
    const activeSession = useQuery(api.attendance.getActiveSession, { course_id: courseId })
    const checkIn = useMutation(api.attendance.checkIn)
    
    const [code, setCode] = useState('')
    const [marking, setMarking] = useState(false)
    const [success, setSuccess] = useState(false)

    if (!activeSession) return null;

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length < 6 || marking) return;
        
        setMarking(true);
        
        const mark = (lat?: number, lng?: number) => {
            checkIn({ course_id: courseId, code, lat, lng })
                .then(() => {
                    setSuccess(true);
                    toast.success("¡Asistencia registrada con éxito! +2 puntos");
                })
                .catch(err => {
                    toast.error(err.message);
                })
                .finally(() => setMarking(false));
        };

        if (activeSession.lat && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => mark(pos.coords.latitude, pos.coords.longitude),
                (err) => {
                    console.error(err);
                    toast.error("Error de GPS: Debes permitir la ubicación para validar que estás en el aula.");
                    setMarking(false);
                },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        } else {
            mark();
        }
    };

    if (success) {
        return (
            <div className="bg-green-500/10 border border-green-500/30 rounded-3xl p-8 text-center animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                    <ShieldCheck className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">¡Presente en Aula!</h3>
                <p className="text-green-300 text-[10px] font-black uppercase tracking-[0.2em] mt-2 bg-green-500/20 py-1.5 rounded-full inline-block px-6">
                    +2 PUNTOS DE EXPERIENCIA
                </p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-indigo-900/40 to-surface-light border border-indigo-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
            <div className="absolute top-0 right-0 p-6 opacity-5">
                <Smartphone className="w-24 h-24 text-white" />
            </div>
            
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center shrink-0">
                    <Smartphone className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Registro de Asistencia</h3>
                    <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> Solo válido presencialmente
                    </p>
                </div>
            </div>

            <form onSubmit={handleCheckIn} className="space-y-6 relative z-10">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center">
                        Ingresa el código mostrado por el docente
                    </label>
                    <input 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-center text-4xl font-black text-white tracking-[0.3em] placeholder:text-slate-700 placeholder:tracking-normal focus:border-indigo-500/50 outline-none transition-all shadow-inner"
                    />
                </div>
                
                <button 
                    type="submit"
                    disabled={code.length < 6 || marking}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 md:py-5 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                >
                    {marking ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                    MARCAR ASISTENCIA
                </button>
            </form>
        </div>
    );
}
