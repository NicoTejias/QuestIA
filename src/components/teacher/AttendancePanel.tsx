import { useState, useEffect } from 'react'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { 
    MapPin, 
    Clock, 
    Users, 
    CheckCircle, 
    X, 
    Loader2, 
    Play, 
    ShieldCheck,
    Smartphone
} from 'lucide-react'
import { toast } from 'sonner'

export default function AttendancePanel({ courseId }: { courseId: any }) {
    const activeSession = useQuery(api.attendance.getActiveSession, { course_id: courseId })
    const createSession = useMutation(api.attendance.createSession)
    
    const [starting, setStarting] = useState(false)
    const [viewingLogs, setViewingLogs] = useState(false)
    const [timeLeft, setTimeLeft] = useState<string>('')

    // Timer para la sesión activa
    useEffect(() => {
        if (!activeSession) return;
        
        const interval = setInterval(() => {
            const now = Date.now();
            const diff = activeSession.expires_at - now;
            
            if (diff <= 0) {
                setTimeLeft('EXPIRADO');
                clearInterval(interval);
            } else {
                const mins = Math.floor(diff / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
            }
        }, 1000);
        
        return () => clearInterval(interval);
    }, [activeSession]);

    const handleStartAttendance = async () => {
        setStarting(true);
        
        // Obtener ubicación actual del docente para centrar el "Aula"
        if (!navigator.geolocation) {
            toast.error("Tu navegador no soporta geolocalización. La asistencia no tendrá validación GPS.");
            try {
                await createSession({ course_id: courseId, duration_minutes: 10 });
                toast.success("Sesión iniciada (Sin GPS)");
            } catch (err: any) {
                toast.error(err.message);
            } finally {
                setStarting(false);
            }
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    await createSession({ 
                        course_id: courseId, 
                        lat: pos.coords.latitude, 
                        lng: pos.coords.longitude,
                        radius: 80, // 80 metros es razonable para un campus
                        duration_minutes: 10
                    });
                    toast.success("Sesión de asistencia iniciada con validación GPS.");
                } catch (err: any) {
                    toast.error(err.message);
                } finally {
                    setStarting(false);
                }
            },
            async (err) => {
                console.error(err);
                toast.warning("No se pudo obtener tu ubicación exacta. Se iniciará sin GPS.");
                try {
                    await createSession({ course_id: courseId, duration_minutes: 10 });
                    toast.success("Sesión iniciada.");
                } catch (err: any) {
                    toast.error(err.message);
                } finally {
                    setStarting(false);
                }
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    };

    if (activeSession) {
        return (
            <div className="bg-gradient-to-br from-indigo-900/40 to-surface-light border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Smartphone className="w-32 h-32 text-indigo-400" />
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center animate-pulse">
                            <ShieldCheck className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Asistencia en Curso</h3>
                            <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Cierra en: <span className="text-white bg-indigo-500/30 px-2 py-0.5 rounded">{timeLeft}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center">
                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Código de Aula</span>
                        <div className="text-5xl font-black text-white tracking-[0.2em] bg-black/40 px-8 py-4 rounded-3xl border border-white/10 shadow-inner">
                            {activeSession.code}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        <button 
                            onClick={() => setViewingLogs(true)}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-2xl transition-all flex items-center justify-center gap-2 border border-white/5"
                        >
                            <Users className="w-5 h-5" /> VER PRESENTES
                        </button>
                        {activeSession.lat && (
                            <div className="flex items-center justify-center gap-1.5 text-[10px] text-green-400 font-bold uppercase tracking-widest bg-green-400/10 py-1 rounded-full border border-green-400/20">
                                <MapPin className="w-3 h-3" /> GPS ACTIVO ({activeSession.radius}m)
                            </div>
                        )}
                    </div>
                </div>

                {viewingLogs && (
                    <AttendanceLogsModal 
                        sessionId={activeSession._id} 
                        onClose={() => setViewingLogs(false)} 
                    />
                )}
            </div>
        );
    }

    return (
        <div className="bg-surface-light border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-indigo-500/20 transition-all">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500/10 transition-all">
                    <Smartphone className="w-8 h-8 text-slate-400 group-hover:text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-white">Asistencia Inteligente</h3>
                    <p className="text-slate-400 text-sm mt-1 max-w-sm">
                        Inicia una sesión para que tus alumnos marquen presencia en el aula usando código y geolocalización.
                    </p>
                </div>
            </div>

            <button 
                onClick={handleStartAttendance}
                disabled={starting}
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-black px-10 py-5 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
                {starting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 fill-current" />}
                INICIAR LISTA
            </button>
        </div>
    );
}

function AttendanceLogsModal({ sessionId, onClose }: { sessionId: any, onClose: () => void }) {
    const logs = useQuery(api.attendance.getSessionLogs, { session_id: sessionId })

    return (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-surface-light border border-white/10 rounded-[2.5rem] max-w-2xl w-full p-8 md:p-10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-primary to-accent"></div>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-white">Alumnos en Aula</h3>
                        <p className="text-slate-400 text-sm">Registro de asistencia verificado por dispositivo.</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {!logs ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 opacity-30">
                            <Users className="w-16 h-16 mx-auto mb-4" />
                            <p className="font-bold">Nadie ha marcado aún.</p>
                        </div>
                    ) : (
                        logs.map((log: any) => (
                            <div key={log._id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 font-black">
                                        {log.student_name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">{log.student_name}</p>
                                        <p className="text-[10px] text-slate-500 font-mono">ID: {log.student_id}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1.5 text-green-400 text-xs font-black uppercase mb-1">
                                        <CheckCircle className="w-3.5 h-3.5" /> PRESENTE
                                    </div>
                                    <span className="text-[10px] text-slate-600 font-mono">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                        {log.distance !== undefined && ` (${Math.round(log.distance)}m)`}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                    <button onClick={onClose} className="bg-white/5 hover:bg-white/10 text-white font-bold px-10 py-3 rounded-2xl transition-all">
                        CERRAR
                    </button>
                </div>
            </div>
        </div>
    );
}
