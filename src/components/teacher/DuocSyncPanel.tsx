import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle2, Server, BookOpen, Users, Wifi, Settings2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { CoursesAPI } from '../../lib/api'
import { DUOC_OFFICIAL_COURSES_2026_2 } from '../../data/duocCoursesData'

interface Props {
    user: any;
    onCoursesSynced?: () => void;
}

export default function DuocSyncPanel({ user, onCoursesSynced }: Props) {
    const [serverIp, setServerIp] = useState(() => localStorage.getItem('questia_duoc_server_ip') || 'http://192.168.0.202:9222')
    const [serverOnline, setServerOnline] = useState<boolean | null>(null)
    const [checking, setChecking] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [lastSyncResult, setLastSyncResult] = useState<any>(null)
    const [showSettings, setShowSettings] = useState(false)
    const [tempIp, setTempIp] = useState(serverIp)

    // Verificar conectividad con Ubuntu Server
    const checkServerStatus = async () => {
        setChecking(true)
        try {
            // Intentar consultar endpoint o fallback a fetch liviano
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 2500)
            await fetch(`${serverIp.replace(/\/$/, '')}/json/version`, {
                signal: controller.signal,
                mode: 'no-cors' // Permite detectar conectividad sin bloqueo por CORS
            })
            clearTimeout(timeoutId)
            // Si no arrojó excepción de red, el servidor está arriba en la LAN
            setServerOnline(true)
        } catch {
            // Intento con probe alternativo o bridge
            setServerOnline(false)
        } finally {
            setChecking(false)
        }
    }

    useEffect(() => {
        checkServerStatus()
    }, [serverIp])

    const handleSync = async () => {
        if (!user?.clerk_id) {
            toast.error('Sesión de docente no detectada')
            return
        }

        setSyncing(true)
        try {
            const res = await CoursesAPI.syncDuocData(user.clerk_id)
            setLastSyncResult(res)
            toast.success(`¡Sincronización exitosa! ${res.syncedCourses} asignaturas y ${res.totalStudents} alumnos sincronizados.`)
            onCoursesSynced?.()
        } catch (err: any) {
            console.error('Error sincronizando Duoc:', err)
            toast.error(err.message || 'Error durante la sincronización de Vivo Duoc')
        } finally {
            setSyncing(false)
        }
    }

    const saveSettings = () => {
        setServerIp(tempIp)
        localStorage.setItem('questia_duoc_server_ip', tempIp)
        setShowSettings(false)
        toast.success('Dirección de Ubuntu Server actualizada')
    }

    const totalStudentsInFeed = DUOC_OFFICIAL_COURSES_2026_2.reduce((acc, c) => acc + c.students.length, 0)

    return (
        <div className="bg-ink-soft border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
            {/* Ambient Background Gradient */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-iris/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

            {/* Header */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <span className="text-xl">🎓</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg md:text-xl font-bold text-white">Sincronización Vivo Duoc & AVA</h2>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-iris/20 text-iris-soft border border-iris/30">
                                2026-2
                            </span>
                        </div>
                        <p className="text-xs text-quiet mt-0.5">
                            Gestión automatizada de asignaturas, secciones, nóminas y evaluaciones desde tu Ubuntu Server
                        </p>
                    </div>
                </div>

                {/* Server Status Pill */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-quiet hover:text-white transition-all border border-white/5"
                        title="Configurar conexión Ubuntu Server"
                    >
                        <Settings2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={checkServerStatus}
                        disabled={checking}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-slate-300 transition-all"
                        title="Verificar estado de conexión"
                    >
                        <span className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`}></span>
                        <span className="font-semibold">{serverOnline ? 'Ubuntu Server Online' : 'Ubuntu Server Standby'}</span>
                        <RefreshCw className={`w-3 h-3 text-quiet ${checking ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Server Settings Modal / Bar */}
            {showSettings && (
                <div className="relative z-10 mt-4 p-4 rounded-xl bg-black/40 border border-iris/20 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Server className="w-3.5 h-3.5 text-iris-light" />
                            Dirección CDP de Chromium en Ubuntu Server
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={tempIp}
                            onChange={(e) => setTempIp(e.target.value)}
                            placeholder="http://192.168.0.202:9222"
                            className="flex-1 bg-surface border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-iris"
                        />
                        <button
                            onClick={saveSettings}
                            className="px-4 py-2 bg-iris hover:bg-iris-light text-white text-xs font-bold rounded-lg transition-all"
                        >
                            Guardar
                        </button>
                    </div>
                    <p className="text-[11px] text-quieter mt-2">
                        Apunta al puerto CDP 9222 configurado en tu máquina Ubuntu (ej. 192.168.0.202:9222).
                    </p>
                </div>
            )}

            {/* Quick Metrics & Actions */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <div className="text-base font-extrabold text-white leading-tight">
                            {DUOC_OFFICIAL_COURSES_2026_2.length} Asignaturas
                        </div>
                        <div className="text-[11px] text-quiet">Cátedras y talleres activos</div>
                    </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                        <div className="text-base font-extrabold text-white leading-tight">
                            {totalStudentsInFeed} Estudiantes
                        </div>
                        <div className="text-[11px] text-quiet">RUTs validados en listas</div>
                    </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                        <div className="text-base font-extrabold text-white leading-tight">
                            AVA Blackboard
                        </div>
                        <div className="text-[11px] text-quiet">Sesión vinculada institucional</div>
                    </div>
                </div>
            </div>

            {/* Course List Preview */}
            <div className="relative z-10 space-y-2 mb-5">
                <div className="text-xs font-bold text-quiet uppercase tracking-wider mb-2">
                    Ramos detectados para sincronización:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {DUOC_OFFICIAL_COURSES_2026_2.map((c) => (
                        <div key={c.code} className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between">
                            <div className="min-w-0 flex-1 pr-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-iris/20 text-iris-light border border-iris/30">
                                        {c.code}
                                    </span>
                                    <span className="text-xs font-bold text-white truncate">{c.name}</span>
                                </div>
                                <div className="text-[11px] text-quieter mt-1 flex items-center gap-2">
                                    <span>Secciones: {c.sections.join(', ')}</span>
                                    <span>•</span>
                                    <span>{c.students.length} alumnos</span>
                                </div>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-green-400/80 shrink-0" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Sync Button CTA */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/5">
                <div className="text-xs text-quiet flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-iris-light" />
                    <span>
                        {lastSyncResult
                            ? `Última sincronización exitosa: ${lastSyncResult.syncedCourses} ramos y ${lastSyncResult.totalStudents} alumnos validados.`
                            : 'Conexión persistente configurada con tu entorno docente Duoc UC'}
                    </span>
                </div>
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-iris hover:bg-iris-light active:scale-95 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-iris/30 transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Sincronizando con Vivo Duoc...' : 'Sincronizar Asignaturas y Alumnos Ahora'}
                </button>
            </div>
        </div>
    )
}
