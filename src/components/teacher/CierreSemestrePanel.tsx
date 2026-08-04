import { useMemo, useState } from 'react'
import {
    Archive, CheckCircle2, Lock, Loader2, CalendarCheck, Users, Target,
    TrendingUp, Download, AlertTriangle, RotateCcw, ClipboardList, Award, Percent,
    CalendarPlus,
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { toast } from 'sonner'
import ConfirmModal from '../ConfirmModal'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { SemesterAPI, type SemesterReport } from '../../lib/semesterApi'
import { exportToExcel } from '../../utils/ExportData'
import { useSemester } from '../../context/SemesterContext'
import { esSemestreValido, formatSemestre, siguienteSemestre } from '../../lib/semesters'

interface Props {
    user: any
    /** Cambia de pestaña al abrir el semestre siguiente. */
    onTabChange?: (tab: string) => void
    /** Recarga los ramos del dashboard: cerrar cambia su estado. */
    onCoursesChanged?: () => void
}

const fmtFecha = (ts: number | null | undefined) =>
    ts ? new Date(ts).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

export default function CierreSemestrePanel({ user, onTabChange, onCoursesChanged }: Props) {
    const { semestreActivo, setSemestreActivo, semestresDisponibles } = useSemester()

    // El cierre opera sobre un semestre concreto. Si se está viendo "Todos" o
    // "Sin semestre", se toma el más reciente con ramos.
    const semestreObjetivo = esSemestreValido(semestreActivo)
        ? semestreActivo
        : semestresDisponibles[0] || null

    const { data: estado, isLoading, refetch } = useSupabaseQuery(
        () =>
            user && semestreObjetivo
                ? SemesterAPI.getSemesterStatus(user.clerk_id, user.role, semestreObjetivo)
                : Promise.resolve([]),
        [user?.clerk_id, semestreObjetivo]
    )

    const [seleccionados, setSeleccionados] = useState<string[] | null>(null)
    const [informe, setInforme] = useState<SemesterReport | null>(null)
    const [generando, setGenerando] = useState(false)
    const [cerrando, setCerrando] = useState(false)
    const [confirmarCierre, setConfirmarCierre] = useState(false)
    const [confirmarReapertura, setConfirmarReapertura] = useState(false)

    const ramos = estado || []

    // Los ramos con fecha de término ya pasada y todavía abiertos son los cerrables.
    const cerrables = useMemo(() => ramos.filter((c: any) => c.terminado && !c.cerrado), [ramos])
    const cerrados = useMemo(() => ramos.filter((c: any) => c.cerrado), [ramos])
    const enCurso = useMemo(() => ramos.filter((c: any) => !c.terminado && !c.cerrado), [ramos])

    // Por defecto se preselecciona todo lo cerrable; el docente puede desmarcar.
    const marcados = seleccionados ?? cerrables.map((c: any) => c.id)

    const toggle = (id: string) =>
        setSeleccionados(marcados.includes(id) ? marcados.filter(x => x !== id) : [...marcados, id])

    const verInforme = async (ids: string[]) => {
        if (ids.length === 0) {
            toast.error('Selecciona al menos un ramo.')
            return
        }
        setGenerando(true)
        try {
            const rep = await SemesterAPI.buildSemesterReport(user.clerk_id, user.role, ids)
            setInforme(rep)
        } catch (e: any) {
            toast.error(e.message || 'No se pudo generar el informe.')
        } finally {
            setGenerando(false)
        }
    }

    const handleCerrar = async () => {
        setCerrando(true)
        try {
            const res = await SemesterAPI.closeSemester(user.clerk_id, user.role, marcados)
            setInforme(res.report)
            setSeleccionados(null)
            setConfirmarCierre(false)
            toast.success(`Semestre cerrado en ${res.cerrados} ${res.cerrados === 1 ? 'ramo' : 'ramos'}.`)
            refetch()
            onCoursesChanged?.()
        } catch (e: any) {
            toast.error(e.message || 'No se pudo cerrar el semestre.')
        } finally {
            setCerrando(false)
        }
    }

    const handleReabrir = async () => {
        setCerrando(true)
        try {
            await SemesterAPI.reopenSemester(cerrados.map((c: any) => c.id))
            setConfirmarReapertura(false)
            setInforme(null)
            toast.success('Semestre reabierto.')
            refetch()
            onCoursesChanged?.()
        } catch (e: any) {
            toast.error(e.message || 'No se pudo reabrir.')
        } finally {
            setCerrando(false)
        }
    }

    const exportarInforme = async () => {
        if (!informe) return
        const filas = informe.porCurso.map(c => ({
            'Ramo': c.name,
            'Código': c.code,
            'Secciones': c.secciones,
            'En lista': c.enLista,
            'Inscritos': c.inscritos,
            'Activos': c.activos,
            'Adopción %': c.adopcionPct ?? '—',
            'Participación %': c.participacionPct ?? '—',
            'Quizzes creados': c.quizzes,
            'Entregas': c.entregas,
            'Entregas/alumno': c.entregasPorAlumno,
            'Promedio': c.promedioScore,
            'Aprobación %': c.aprobacionPct ?? '—',
            'Evaluaciones': c.evaluaciones,
            'Canjes': c.canjes,
            'Documentos': c.documentos,
            'Clases planificadas': c.clasesPlanificadas,
            'Clases realizadas': c.clasesRealizadas,
            'Suspendidas': c.clasesSuspendidas,
            'Puntos totales': c.puntosTotales,
            'Inicio': fmtFecha(c.fechaInicio),
            'Término': fmtFecha(c.fechaFin),
        }))
        await exportToExcel(filas, `Informe_Semestre_${new Date().toISOString().split('T')[0]}`, 'Cierre Semestre')
        toast.success('Informe exportado a Excel.')
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-iris-light" />
            </div>
        )
    }

    return (
        <div className="max-w-[1100px]">
            {/* Encabezado */}
            <div className="flex items-start gap-3 mb-6">
                <div className="w-[3px] self-stretch bg-iris rounded-sm" />
                <div>
                    <h1 className="text-2xl font-bold m-0 text-text-main">
                        Cierre de Semestre
                        {semestreObjetivo && (
                            <span className="ml-2.5 text-[12px] font-bold uppercase tracking-wider bg-iris/15 text-iris-soft px-2.5 py-1 rounded-full align-middle">
                                {formatSemestre(semestreObjetivo)}
                            </span>
                        )}
                    </h1>
                    <p className="text-quiet text-sm mt-1">
                        Cierra el período y genera el informe final con las métricas de tus ramos.
                    </p>
                </div>
            </div>

            {/* Sin semestre no hay nada que cerrar. */}
            {!semestreObjetivo && (
                <div className="qi-card p-8 text-center">
                    <p className="text-sm text-quiet">
                        Tus ramos todavía no tienen un semestre asignado. Asígnales uno al crearlos
                        o al programar su calendario para poder cerrar el período.
                    </p>
                </div>
            )}

            {/* Todo cerrado: el paso siguiente es abrir el semestre entrante. */}
            {semestreObjetivo && ramos.length > 0 && cerrables.length === 0 && enCurso.length === 0 && (
                <SiguienteSemestre
                    semestreCerrado={semestreObjetivo}
                    onAbrir={() => {
                        const proximo = siguienteSemestre(semestreObjetivo)
                        setSemestreActivo(proximo)
                        onTabChange?.('ramos')
                        toast.success(`Semestre ${proximo} activo. Crea los ramos del período.`)
                    }}
                />
            )}

            {/* Estado general */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <EstadoCard
                    icon={<CalendarCheck className="w-4 h-4" />}
                    valor={cerrables.length}
                    label="Listos para cerrar"
                    color="#22c55e"
                />
                <EstadoCard
                    icon={<Loader2 className="w-4 h-4" />}
                    valor={enCurso.length}
                    label="Semestre en curso"
                    color="#f5a524"
                />
                <EstadoCard
                    icon={<Archive className="w-4 h-4" />}
                    valor={cerrados.length}
                    label="Ya cerrados"
                    color="#8890f5"
                />
            </div>

            {/* Lista de ramos con su estado de término */}
            <div className="qi-card p-5 mb-5">
                <h2 className="qi-card-title flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-iris-light" />
                    Ramos del período
                </h2>

                {ramos.length === 0 ? (
                    <p className="text-sm text-quieter py-6 text-center">
                        Aún no tienes ramos con una programación de semestre cargada.
                    </p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {ramos.map((c: any) => {
                            const cerrable = c.terminado && !c.cerrado
                            return (
                                <div
                                    key={c.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                                        c.cerrado
                                            ? 'bg-iris/[0.06] border-iris/20'
                                            : cerrable
                                                ? 'bg-white/[0.03] border-white/10 hover:border-green-500/30'
                                                : 'bg-white/[0.02] border-white/5'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={marcados.includes(c.id)}
                                        onChange={() => toggle(c.id)}
                                        disabled={!cerrable}
                                        aria-label={`Incluir ${c.name} en el cierre`}
                                        className="w-4 h-4 accent-[#5457e5] disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[13.5px] font-bold text-text-main truncate">{c.name}</span>
                                            <span className="text-[10px] font-mono uppercase text-quieter">{c.code}</span>
                                            {c.students_enabled === false && (
                                                <span className="text-[9px] font-bold uppercase tracking-wider bg-white/5 text-quieter px-2 py-0.5 rounded-full border border-white/10">
                                                    Solo organización
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[11.5px] text-quieter mt-0.5">
                                            {c.fechaFin
                                                ? <>Término: {fmtFecha(c.fechaFin)}
                                                    {c.fuente === 'calculada' && ' (estimado)'}</>
                                                : 'Sin programación de semestre'}
                                        </div>
                                    </div>

                                    {c.cerrado ? (
                                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-iris-soft shrink-0">
                                            <Archive className="w-3.5 h-3.5" /> Cerrado
                                        </span>
                                    ) : cerrable ? (
                                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-green-400 shrink-0">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Terminado
                                        </span>
                                    ) : (
                                        <span
                                            className="flex items-center gap-1.5 text-[11px] font-bold text-quieter shrink-0"
                                            title={
                                                c.fechaFin
                                                    ? `Faltan ${c.diasRestantes} días para el término`
                                                    : 'Configura la programación del semestre en el calendario del ramo'
                                            }
                                        >
                                            <Lock className="w-3.5 h-3.5" />
                                            {c.diasRestantes !== null ? `${c.diasRestantes} días` : 'Sin fecha'}
                                        </span>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Acciones */}
                <div className="flex flex-wrap gap-2.5 mt-5 pt-4 border-t border-white/5">
                    <button
                        onClick={() => verInforme(marcados)}
                        disabled={generando || marcados.length === 0}
                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-text-main rounded-xl border border-white/10 transition-all flex items-center gap-2 font-bold text-[13px] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {generando ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                        Vista previa del informe
                    </button>

                    <button
                        onClick={() => setConfirmarCierre(true)}
                        disabled={cerrables.length === 0 || marcados.length === 0}
                        title={
                            cerrables.length === 0
                                ? 'Solo puedes cerrar cuando haya pasado la fecha de término del semestre'
                                : undefined
                        }
                        className="px-4 py-2.5 bg-iris hover:bg-iris-light text-white rounded-xl transition-all flex items-center gap-2 font-bold text-[13px] shadow-lg shadow-iris/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        <Archive className="w-4 h-4" />
                        Cerrar semestre
                        {marcados.length > 0 && cerrables.length > 0 && ` (${marcados.length})`}
                    </button>

                    {cerrados.length > 0 && (
                        <button
                            onClick={() => setConfirmarReapertura(true)}
                            className="px-4 py-2.5 bg-transparent hover:bg-white/5 text-quiet hover:text-text-main rounded-xl border border-white/10 transition-all flex items-center gap-2 font-bold text-[13px] ml-auto"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reabrir
                        </button>
                    )}
                </div>

                {cerrables.length === 0 && cerrados.length === 0 && ramos.length > 0 && (
                    <div className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-[12.5px] text-amber-200/80 leading-relaxed">
                            El botón de cierre se habilita cuando pasa la fecha de término del semestre
                            definida en la programación del ramo. Puedes revisar la vista previa del informe
                            en cualquier momento.
                        </p>
                    </div>
                )}
            </div>

            {/* Informe */}
            {informe && <InformeSemestre informe={informe} onExport={exportarInforme} />}

            <ConfirmModal
                isOpen={confirmarCierre}
                onClose={() => setConfirmarCierre(false)}
                onConfirm={handleCerrar}
                loading={cerrando}
                variant="warning"
                title="Cerrar el semestre"
                message={`Se generará y guardará el informe final de ${marcados.length} ${marcados.length === 1 ? 'ramo' : 'ramos'}. Los datos quedan archivados como snapshot y podrás reabrir el semestre si lo necesitas.`}
                confirmText="Cerrar semestre"
            />

            <ConfirmModal
                isOpen={confirmarReapertura}
                onClose={() => setConfirmarReapertura(false)}
                onConfirm={handleReabrir}
                loading={cerrando}
                variant="danger"
                title="Reabrir el semestre"
                message="Se eliminará la marca de cierre y el informe archivado de los ramos cerrados. Podrás volver a cerrarlos para regenerar el informe."
                confirmText="Reabrir"
            />
        </div>
    )
}

/* ── Apertura del semestre siguiente ────────────────────────── */
/**
 * Aparece cuando ya no queda nada por cerrar en el período: el paso natural
 * es abrir el semestre entrante y programar sus ramos.
 */
function SiguienteSemestre({
    semestreCerrado,
    onAbrir,
}: {
    semestreCerrado: string
    onAbrir: () => void
}) {
    const proximo = siguienteSemestre(semestreCerrado)

    return (
        <div className="qi-card p-6 mb-5 border-iris/25">
            <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-iris/15 flex items-center justify-center shrink-0">
                    <CalendarPlus className="w-5 h-5 text-iris-light" />
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="text-[15px] font-bold text-text-main">
                        {formatSemestre(semestreCerrado)} está cerrado
                    </h2>
                    <p className="text-quiet text-[13px] mt-1 leading-relaxed max-w-xl">
                        El período quedó archivado y puedes volver a consultarlo cuando quieras desde
                        el selector de semestre. Para partir el período siguiente, abre{' '}
                        <strong className="text-text-main">{formatSemestre(proximo)}</strong> y crea
                        ahí los ramos que vas a dictar.
                    </p>

                    <ol className="flex flex-col gap-2 mt-4 mb-5">
                        {[
                            'Crea los ramos del nuevo período en Mis Ramos.',
                            'Entra a cada ramo y abre Calendario y Planificación.',
                            'Sube el PDA y programa las semanas del semestre.',
                        ].map((paso, i) => (
                            <li key={paso} className="flex gap-2.5 items-start">
                                <span className="qi-step-num mt-0.5">{i + 1}</span>
                                <span className="text-[12.5px] text-quiet leading-relaxed">{paso}</span>
                            </li>
                        ))}
                    </ol>

                    <button
                        onClick={onAbrir}
                        className="px-4 py-2.5 bg-iris hover:bg-iris-light text-white rounded-xl transition-all inline-flex items-center gap-2 font-bold text-[13px] shadow-lg shadow-iris/20"
                    >
                        <CalendarPlus className="w-4 h-4" />
                        Abrir {formatSemestre(proximo)}
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ── Tarjeta de estado ──────────────────────────────────────── */
function EstadoCard({ icon, valor, label, color }: { icon: any; valor: number; label: string; color: string }) {
    return (
        <div className="qi-card p-4 flex items-center gap-3">
            <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: `${color}1a`, color }}
            >
                {icon}
            </div>
            <div className="min-w-0">
                <div className="text-[19px] font-extrabold text-text-main leading-tight">{valor}</div>
                <div className="text-[11.5px] text-quiet mt-0.5">{label}</div>
            </div>
        </div>
    )
}

/* ── Informe final ──────────────────────────────────────────── */
function InformeSemestre({ informe, onExport }: { informe: SemesterReport; onExport: () => void }) {
    const t = informe.totales

    const kpis = [
        { icon: <Users className="w-4 h-4" />, valor: t.inscritos, label: 'Alumnos inscritos', color: '#5457e5' },
        { icon: <Target className="w-4 h-4" />, valor: t.activos, label: 'Alumnos activos', color: '#22c55e' },
        { icon: <ClipboardList className="w-4 h-4" />, valor: t.entregas, label: 'Entregas de quizzes', color: '#f5a524' },
        { icon: <Award className="w-4 h-4" />, valor: `${t.promedioScore}%`, label: 'Puntaje promedio', color: '#8890f5' },
    ]

    const datosGrafico = informe.porCurso
        .filter(c => c.studentsEnabled)
        .map(c => ({
            name: c.code,
            Inscritos: c.inscritos,
            Activos: c.activos,
            Entregas: c.entregas,
        }))

    const belbinEntries = Object.entries(informe.belbin).sort((a, b) => b[1] - a[1])

    return (
        <div className="qi-card p-6 mb-5">
            {/* Cabecera del informe */}
            <div className="flex flex-wrap items-start justify-between gap-4 pb-5 mb-5 border-b border-white/5">
                <div>
                    <h2 className="text-xl font-black text-text-main flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-[10px] bg-iris/15 flex items-center justify-center">
                            <Archive className="w-[18px] h-[18px] text-iris-light" />
                        </div>
                        Informe de cierre
                        {informe.semestre && (
                            <span className="text-[11px] font-bold uppercase tracking-wider bg-iris/15 text-iris-soft px-2.5 py-1 rounded-full">
                                {informe.semestre}
                            </span>
                        )}
                    </h2>
                    <p className="text-quiet text-[12.5px] mt-1.5">
                        Período {fmtFecha(informe.periodo.inicio)} — {fmtFecha(informe.periodo.fin)}
                        {' · '}
                        {t.ramos} {t.ramos === 1 ? 'ramo' : 'ramos'}
                        {t.secciones > 0 && ` · ${t.secciones} ${t.secciones === 1 ? 'sección' : 'secciones'}`}
                    </p>
                </div>
                <button
                    onClick={onExport}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-text-main rounded-xl border border-white/10 transition-all flex items-center gap-2 font-bold text-[13px]"
                >
                    <Download className="w-4 h-4" />
                    Exportar Excel
                </button>
            </div>

            {/* KPIs principales */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {kpis.map(k => (
                    <div key={k.label} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                        <div
                            className="w-8 h-8 rounded-[9px] flex items-center justify-center mb-2.5"
                            style={{ background: `${k.color}1a`, color: k.color }}
                        >
                            {k.icon}
                        </div>
                        <div className="text-[22px] font-extrabold text-text-main leading-none">{k.valor}</div>
                        <div className="text-[11.5px] text-quiet mt-1.5">{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Tasas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <TasaBar
                    label="Adopción"
                    detalle={`${t.inscritos} de ${t.enLista} en lista`}
                    pct={t.adopcionPct}
                />
                <TasaBar
                    label="Participación"
                    detalle={`${t.activos} de ${t.inscritos} inscritos entregaron`}
                    pct={t.participacionPct}
                />
                <TasaBar
                    label="Aprobación"
                    detalle={`Entregas con 60% o más`}
                    pct={t.aprobacionPct}
                />
            </div>

            {/* Números del semestre */}
            <div className="mb-6">
                <h3 className="text-[13px] font-bold text-text-main mb-3 flex items-center gap-2">
                    <Percent className="w-3.5 h-3.5 text-iris-light" />
                    Números del semestre
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    <Mini label="Clases planificadas" valor={t.clasesPlanificadas} />
                    <Mini label="Clases realizadas" valor={t.clasesRealizadas} />
                    <Mini label="Clases suspendidas" valor={t.clasesSuspendidas} />
                    <Mini label="Feriados" valor={t.feriados} />
                    <Mini label="Quizzes creados" valor={t.quizzes} />
                    <Mini label="Evaluaciones" valor={t.evaluaciones} />
                    <Mini label="Entregas por alumno" valor={t.entregasPorAlumno} />
                    <Mini label="Material subido" valor={t.documentos} />
                    <Mini label="Entregas de misiones" valor={t.misionesEntregas} />
                    <Mini label="Recompensas canjeadas" valor={t.canjes} />
                    <Mini label="Puntos otorgados" valor={t.puntosTotales} />
                    {t.ramosSoloOrganizacion > 0 && (
                        <Mini label="Ramos sin alumnos" valor={t.ramosSoloOrganizacion} />
                    )}
                </div>
            </div>

            {/* Comparativa por ramo */}
            {datosGrafico.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-[13px] font-bold text-text-main mb-3">Participación por ramo</h3>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height={280} minWidth={0}>
                            <BarChart data={datosGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="name" stroke="#6b6d78" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#6b6d78" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#101118', borderColor: '#2a2c38', borderRadius: '10px', fontSize: '12px' }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                    cursor={{ fill: '#ffffff08' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                <Bar dataKey="Inscritos" fill="#4a4c56" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Activos" fill="#5457e5" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Entregas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Detalle por ramo */}
            <div className="mb-6">
                <h3 className="text-[13px] font-bold text-text-main mb-3">Detalle por ramo</h3>
                <div className="overflow-x-auto -mx-1 px-1">
                    <table className="w-full text-[12px] border-collapse min-w-[720px]">
                        <thead>
                            <tr className="text-quieter text-left">
                                <th className="font-semibold pb-2 pr-3">Ramo</th>
                                <th className="font-semibold pb-2 px-2 text-right">Inscritos</th>
                                <th className="font-semibold pb-2 px-2 text-right">Activos</th>
                                <th className="font-semibold pb-2 px-2 text-right">Particip.</th>
                                <th className="font-semibold pb-2 px-2 text-right">Entregas</th>
                                <th className="font-semibold pb-2 px-2 text-right">Promedio</th>
                                <th className="font-semibold pb-2 px-2 text-right">Aprob.</th>
                                <th className="font-semibold pb-2 pl-2 text-right">Clases</th>
                            </tr>
                        </thead>
                        <tbody>
                            {informe.porCurso.map(c => (
                                <tr key={c.id} className="border-t border-white/5">
                                    <td className="py-2.5 pr-3">
                                        <div className="font-bold text-text-main truncate max-w-[220px]">{c.name}</div>
                                        <div className="text-[10px] font-mono text-quieter">{c.code}</div>
                                    </td>
                                    {c.studentsEnabled ? (
                                        <>
                                            <td className="py-2.5 px-2 text-right text-text-main">{c.inscritos}</td>
                                            <td className="py-2.5 px-2 text-right text-text-main">{c.activos}</td>
                                            <td className="py-2.5 px-2 text-right text-text-main">
                                                {c.participacionPct !== null ? `${c.participacionPct}%` : '—'}
                                            </td>
                                            <td className="py-2.5 px-2 text-right text-text-main">{c.entregas}</td>
                                            <td className="py-2.5 px-2 text-right text-text-main">{c.promedioScore}%</td>
                                            <td className="py-2.5 px-2 text-right text-text-main">
                                                {c.aprobacionPct !== null ? `${c.aprobacionPct}%` : '—'}
                                            </td>
                                        </>
                                    ) : (
                                        <td colSpan={6} className="py-2.5 px-2 text-center text-quieter italic text-[11px]">
                                            Ramo en modo solo organización
                                        </td>
                                    )}
                                    <td className="py-2.5 pl-2 text-right text-quiet">
                                        {c.clasesRealizadas}/{c.clasesPlanificadas}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Perfil de equipo (Belbin) */}
            {belbinEntries.length > 0 && (
                <div>
                    <h3 className="text-[13px] font-bold text-text-main mb-3">Perfil de equipo (Belbin)</h3>
                    <div className="flex flex-wrap gap-2">
                        {belbinEntries.map(([rol, n]) => (
                            <span
                                key={rol}
                                className="text-[11.5px] font-semibold bg-white/[0.04] border border-white/8 text-quiet px-3 py-1.5 rounded-full"
                            >
                                {rol} <span className="text-iris-soft font-bold ml-1">{n}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <p className="text-[10.5px] text-quieter mt-6 pt-4 border-t border-white/5">
                Informe generado el {new Date(informe.generadoEn).toLocaleString('es-CL')}.
                Los ramos en modo solo organización no se consideran en las métricas de participación.
            </p>
        </div>
    )
}

function TasaBar({ label, detalle, pct }: { label: string; detalle: string; pct: number | null }) {
    return (
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            <div className="flex justify-between items-baseline mb-2">
                <span className="text-[12px] font-bold text-quiet">{label}</span>
                <span className="text-[17px] font-extrabold text-text-main">{pct !== null ? `${pct}%` : '—'}</span>
            </div>
            <div className="qi-progress-track">
                <div className="qi-progress-fill" style={{ width: `${pct ?? 0}%` }} />
            </div>
            <div className="text-[10.5px] text-quieter mt-1.5">{detalle}</div>
        </div>
    )
}

function Mini({ label, valor }: { label: string; valor: number | string }) {
    return (
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-[16px] font-extrabold text-text-main leading-none">{valor}</div>
            <div className="text-[10.5px] text-quieter mt-1.5 leading-tight">{label}</div>
        </div>
    )
}
