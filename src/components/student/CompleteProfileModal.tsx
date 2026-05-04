import { useState } from "react"
import { GraduationCap, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { toast } from "sonner"
import { getFirstName } from "../../utils/dashboardUtils"
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery"
import { ProfilesAPI } from "../../lib/api"
import { useUser } from "@clerk/clerk-react"

interface CompleteProfileModalProps {
    user: any;
    onComplete: () => void;
}

export default function CompleteProfileModal({ user, onComplete }: CompleteProfileModalProps) {
    const { user: clerkUser } = useUser()
    const [rut, setRut] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const { data: whitelistData, isLoading: whitelistLoading } = useSupabaseQuery(
        () => ProfilesAPI.checkWhitelist(rut),
        [rut],
        { enabled: rut.length >= 7 }
    )

    const handleRutChange = (value: string) => {
        setRut(value)
        if (error) setError('')
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (rut.length < 7) {
            setError('Ingresa un RUT válido.')
            setLoading(false)
            return
        }

        if (whitelistLoading) {
            setError('Espera un momento mientras verificamos tu RUT...')
            setLoading(false)
            return
        }

        if (!whitelistData?.allowed) {
            setError('RUT No Autorizado: No apareces en la lista de alumnos autorizados. Asegúrate de ingresar tu RUT correctamente (con o sin puntos/guion) o consulta con tu docente.')
            setLoading(false)
            return
        }

        try {
            await ProfilesAPI.updateProfile(clerkUser?.id || '', { student_id: rut })
            toast.success('¡Perfil completado! Bienvenido.')
            onComplete()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] bg-surface flex items-center justify-center p-6 bg-cover bg-center" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(100, 100, 255, 0.05), transparent), radial-gradient(circle at 80% 70%, rgba(255, 100, 255, 0.05), transparent)' }}>
            <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-surface-light border border-white/10 rounded-[3rem] p-10 md:p-12 shadow-2xl relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -z-10" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/20 blur-3xl -z-10" />

                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/20">
                        <GraduationCap className="w-10 h-10 text-white" />
                    </div>

                    <h2 className="text-3xl font-black text-white">¡Hola, {getFirstName(user.name)}!</h2>
                    <p className="text-slate-400 mb-10 text-sm">
                        Para activar tu cuenta institucional, por favor ingresa tu **RUT o Matrícula**. Esto nos permitirá vincularte con tus ramos automáticamente.
                    </p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-8 flex items-center gap-3 text-left">
                            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                            <p className="text-red-400 text-xs font-bold leading-relaxed">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="text-left">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-2 block">RUT / Identificador de Alumno</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={rut}
                                    onChange={(e) => handleRutChange(e.target.value)}
                                    placeholder="Ej: 12.345.678-9"
                                    className={`w-full bg-white/5 border rounded-2xl px-6 py-4 text-white font-bold text-lg placeholder:text-slate-700 transition-all outline-none ${whitelistData?.allowed ? 'border-emerald-500/50 focus:border-emerald-500' : 'border-white/10 focus:border-primary'}`}
                                    required
                                />
                                {rut.length >= 7 && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        {whitelistLoading ? (
                                            <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                                        ) : whitelistData?.allowed ? (
                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-red-500" />
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-600 mt-2 ml-4">Ingresa tu RUT con o sin puntos y guion.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || rut.length < 7}
                            className="w-full bg-primary hover:bg-primary-light text-white font-black py-5 rounded-2xl shadow-xl shadow-primary/30 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Activar mi Cuenta'}
                        </button>
                    </form>

                    <p className="mt-8 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                        Plataforma Educativa Quest
                    </p>
                </div>
            </div>
        </div>
    )
}
