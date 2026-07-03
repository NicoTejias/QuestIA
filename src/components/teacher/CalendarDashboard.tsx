import { useState, useEffect } from 'react'
import { Calendar, List, CheckSquare, Edit, AlertTriangle, ChevronLeft, ChevronRight, X, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { CalendarAPI } from '../../lib/api'

interface CalendarDashboardProps {
  course: any
  onResetConfig: () => void // Permite reconfigurar el horario/PDA
}

const getLocalDateString = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export default function CalendarDashboard({ course, onResetConfig }: CalendarDashboardProps) {
  const [clases, setClases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'timeline' | 'calendar'>('timeline')
  const [selectedSemana, setSelectedSemana] = useState(1)
  const [selectedClase, setSelectedClase] = useState<any | null>(null)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)

  // Para la vista de calendario
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const loadClases = async () => {
    try {
      setLoading(true)
      const data = await CalendarAPI.getClasesByCourse(course.id)
      setClases(data)
    } catch (err: any) {
      console.error(err)
      toast.error('Error al cargar las clases')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClases()
  }, [course.id])

  // Secciones presentes en el calendario (derivadas de las clases).
  const secciones = Array.from(
    new Set(clases.map(c => c.section).filter((s): s is string => !!s))
  ).sort()

  // Seleccionar la primera sección por defecto cuando cargan las clases.
  useEffect(() => {
    if (secciones.length > 0 && (selectedSection === null || !secciones.includes(selectedSection))) {
      setSelectedSection(secciones[0])
    }
    // Solo debe re-evaluarse cuando cambian las clases cargadas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clases])

  // Clases de la sección activa (o todas, si no hay secciones asignadas — datos legacy).
  const clasesSection = secciones.length > 0
    ? clases.filter(c => c.section === selectedSection)
    : clases

  // Obtener el número total de semanas en el calendario (de la sección activa)
  const maxSemanas = clasesSection.reduce((acc, c) => Math.max(acc, c.semana), 1)

  // Filtrar clases de la semana seleccionada en Timeline
  const clasesSemana = clasesSection.filter(c => c.semana === selectedSemana)

  // Clases de la semana ordenadas por fecha y luego por sesión, para mostrarlas en tarjetas
  // una al lado de la otra (horizontal) o apiladas (vertical). El tipo se distingue por badge.
  const clasesSemanaOrdenadas = [...clasesSemana].sort(
    (a, b) => (a.fecha - b.fecha) || (a.sesion - b.sesion)
  )

  // Sesiones reales (excluye feriados) para numerar "Sesión X de N" dentro de la semana.
  const totalSesionesSemana = clasesSemana.filter(c => !c.es_feriado).length

  // Lógica para renderizar la cuadrícula del calendario
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const days: Date[] = []
    
    // Rellenar días del mes anterior para empezar en Lunes (getDay(): 0=Domingo, 1=Lunes...)
    let startDayOfWeek = firstDay.getDay()
    if (startDayOfWeek === 0) startDayOfWeek = 7 // Ajustar Domingo a 7
    for (let i = startDayOfWeek - 1; i > 0; i--) {
      days.push(new Date(year, month, 1 - i))
    }
    
    // Días del mes actual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }

  const handleUpdateClase = async (claseId: string, updates: any) => {
    try {
      await CalendarAPI.updateClase(claseId, updates)
      toast.success('Clase actualizada con éxito')
      setSelectedClase(null)
      loadClases()
    } catch (err: any) {
      toast.error('Error al actualizar la clase')
    }
  }

  // Actualiza una clase (estado/RAGC/etc.) sin cerrar modal; refresca la fila en memoria.
  const patchClase = async (claseId: string, updates: any, okMsg?: string) => {
    try {
      await CalendarAPI.updateClase(claseId, updates)
      setClases(prev => prev.map(c => (c.id === claseId ? { ...c, ...updates } : c)))
      setSelectedClase((prev: any) => (prev && prev.id === claseId ? { ...prev, ...updates } : prev))
      if (okMsg) toast.success(okMsg)
    } catch {
      toast.error('No se pudo actualizar la clase')
    }
  }

  // ¿Ya se puede confirmar la clase? Se habilita a partir de su hora de inicio.
  const puedeConfirmar = (c: any): boolean => {
    const now = new Date()
    const claseDate = new Date(c.fecha)
    const hoy = now.toDateString() === claseDate.toDateString()
    if (claseDate < now && !hoy) return true // días pasados: siempre confirmable
    if (!hoy) return false // días futuros: aún no
    if (!c.hora_inicio) return true // hoy sin hora conocida: permitir
    const [h, m] = String(c.hora_inicio).split(':').map(Number)
    const inicio = new Date(claseDate); inicio.setHours(h || 0, m || 0, 0, 0)
    return now >= inicio
  }

  // Horas restantes para registrar RAGC (24h desde el fin de la clase). null si no aplica.
  const horasRestantesRAGC = (c: any): number | null => {
    if (c.estado !== 'realizada' || c.asistencia_ragc) return null
    const claseDate = new Date(c.fecha)
    const [h, m] = String(c.hora_fin || c.hora_inicio || '23:59').split(':').map(Number)
    const fin = new Date(claseDate); fin.setHours(h || 23, m || 59, 0, 0)
    const limite = fin.getTime() + 24 * 60 * 60 * 1000
    const restanteMs = limite - Date.now()
    return restanteMs > 0 ? Math.ceil(restanteMs / (60 * 60 * 1000)) : 0
  }

  const formatFecha = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  // ── Recordatorios in-app (calculados sobre TODAS las secciones) ──
  const ahora = Date.now()
  const hoyStr = new Date().toDateString()

  // 1. Clases de hoy cuya hora de inicio ya pasó y siguen sin confirmar.
  const porConfirmarHoy = clases.filter(c => {
    if (c.es_feriado || c.estado !== 'programada') return false
    if (new Date(c.fecha).toDateString() !== hoyStr) return false
    return puedeConfirmar(c)
  })

  // 2. Clases realizadas con RAGC pendiente dentro del plazo de 24h.
  const ragcPendiente = clases
    .map(c => ({ c, h: horasRestantesRAGC(c) }))
    .filter(x => x.h !== null) as { c: any; h: number }[]

  // 3. Viernes: materiales por pedir y evaluaciones próximas (para solicitar copias/materiales con 48h).
  const esViernes = new Date().getDay() === 5
  const en7dias = ahora + 7 * 24 * 60 * 60 * 1000
  const evaluacionesProximas = clases.filter(c =>
    c.tiene_evaluacion && !c.es_feriado && c.fecha >= ahora && c.fecha <= en7dias
  )
  const materialesPorPedir = clases.filter(c =>
    !c.es_feriado && c.materiales_requeridos && !c.materiales_pedidos && c.fecha >= ahora && c.fecha <= en7dias
  )
  const hayRecordatorios = porConfirmarHoy.length > 0 || ragcPendiente.length > 0 ||
    (esViernes && (evaluacionesProximas.length > 0 || materialesPorPedir.length > 0))

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Planificación Curricular{secciones.length > 0 ? ` - Sección ${selectedSection || ''}` : ''}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Semanas planificadas: {course.schedule_config?.semanas_semestre || maxSemanas}
            {secciones.length > 1 && <> · <span className="text-indigo-400 font-semibold">{secciones.length} secciones</span></>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-0.5 flex">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'calendar'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Calendario
            </button>
          </div>
          <button
            onClick={onResetConfig}
            className="text-xs text-red-400 hover:text-red-300 font-semibold border border-red-500/20 hover:border-red-500/50 bg-red-500/10 px-3 py-2 rounded-lg transition-all"
          >
            Regenerar
          </button>
        </div>
      </div>

      {/* Panel de recordatorios in-app */}
      {hayRecordatorios && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            🔔 Recordatorios
          </h3>

          {porConfirmarHoy.length > 0 && (
            <div className="text-xs text-slate-300 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2.5">
              <span className="font-semibold text-emerald-300">{porConfirmarHoy.length}</span> clase(s) de hoy por confirmar.
              ¿Ya las dictaste? Confírmalas y recuerda <span className="font-semibold">pasar la lista en RAGC</span>.
            </div>
          )}

          {ragcPendiente.length > 0 && (
            <div className="text-xs text-slate-300 bg-amber-500/5 border border-amber-500/20 rounded-lg p-2.5">
              <span className="font-semibold text-amber-300">Asistencia RAGC pendiente</span> en {ragcPendiente.length} clase(s).
              {' '}Más urgente: <span className="font-semibold">{Math.min(...ragcPendiente.map(x => x.h))}h restantes</span> (tienes 24h tras la clase o se descuenta la hora).
            </div>
          )}

          {esViernes && evaluacionesProximas.length > 0 && (
            <div className="text-xs text-slate-300 bg-rose-500/5 border border-rose-500/20 rounded-lg p-2.5">
              📄 <span className="font-semibold text-rose-300">{evaluacionesProximas.length} evaluación(es)</span> en los próximos 7 días.
              Recuerda solicitar la impresión de pruebas con al menos <span className="font-semibold">48h de anticipación</span>.
            </div>
          )}

          {esViernes && materialesPorPedir.length > 0 && (
            <div className="text-xs text-slate-300 bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-2.5">
              🧰 <span className="font-semibold text-indigo-300">{materialesPorPedir.length} clase(s)</span> con materiales por pedir esta próxima semana.
              Envía la solicitud a pañol con anticipación.
            </div>
          )}
        </div>
      )}

      {/* Selector de secciones */}
      {secciones.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/40 border border-slate-800 rounded-xl p-2">
          <span className="text-xs text-slate-500 font-semibold px-2">Sección:</span>
          {secciones.map((sec) => (
            <button
              key={sec}
              onClick={() => { setSelectedSection(sec); setSelectedSemana(1) }}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                sec === selectedSection
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* VISTA TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              {/* Slider de Semanas */}
              <div className="flex items-center justify-center gap-4 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                <button
                  disabled={selectedSemana <= 1}
                  onClick={() => setSelectedSemana(s => s - 1)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white disabled:text-slate-700 transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="text-white font-bold text-lg select-none">
                  Semana {selectedSemana} de {maxSemanas}
                </span>
                <button
                  disabled={selectedSemana >= maxSemanas}
                  onClick={() => setSelectedSemana(s => s + 1)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white disabled:text-slate-700 transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Lista de Tarjetas agrupadas por sesión (Cátedra / Práctico) */}
              {clasesSemana.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  No hay clases registradas para esta semana.
                </div>
              ) : (
                <div className="space-y-6">
                  {totalSesionesSemana > 0 && (
                    <p className="text-center text-xs text-slate-500">
                      Esta semana tiene <span className="font-semibold text-slate-300">{totalSesionesSemana} {totalSesionesSemana === 1 ? 'sesión' : 'sesiones'}</span>
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {clasesSemanaOrdenadas.map((c) => {
                      const isFeriado = !!c.es_feriado

                      let borderLeftColor = 'border-l-indigo-500'
                      let bgClass = 'bg-slate-900'
                      let badgeLabel = 'Cátedra'
                      let badgeClass = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'

                      if (isFeriado) {
                        borderLeftColor = 'border-l-red-500'
                        bgClass = 'bg-red-950/10'
                        badgeLabel = 'Feriado'
                        badgeClass = 'bg-red-500/10 text-red-400 border-red-500/20'
                      } else if (c.tiene_evaluacion) {
                        borderLeftColor = 'border-l-rose-500'
                        badgeLabel = 'Evaluación'
                        badgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      } else if (c.tipo_bloque === 'laboratorio') {
                        borderLeftColor = 'border-l-emerald-500'
                        badgeLabel = 'Laboratorio'
                        badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }

                      return (
                        <div
                          key={c.id}
                          className={`border border-slate-800 border-l-4 rounded-xl p-5 shadow-lg relative flex flex-col justify-between ${bgClass} ${borderLeftColor}`}
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                  Sesión {c.sesion}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeClass}`}>
                                  {badgeLabel}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 font-medium">
                                {formatFecha(c.fecha)}
                              </span>
                            </div>

                            <h3 className="text-lg font-bold text-white leading-snug">
                              {c.titulo}
                            </h3>

                            {!isFeriado && (
                              <p className="text-slate-400 text-sm line-clamp-3">
                                {c.contenido}
                              </p>
                            )}

                            {isFeriado && (
                              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>{c.contenido}</span>
                              </div>
                            )}

                            {!isFeriado && c.materiales_requeridos && (
                              <div className="pt-2 border-t border-slate-800">
                                <span className="text-xs font-semibold text-slate-400 block mb-1">
                                  Materiales Sugeridos:
                                </span>
                                <p className="text-xs text-slate-500">{c.materiales_requeridos}</p>
                              </div>
                            )}

                            {c.tiene_evaluacion && (
                              <div className="bg-rose-500/10 border border-rose-500/30 p-2 rounded-lg flex items-center justify-between text-xs text-rose-300">
                                <span className="font-bold uppercase">Hito de Evaluación</span>
                                <span className="capitalize">{c.titulo_evaluacion || 'Evaluación'}</span>
                              </div>
                            )}

                            {/* Estado de la sesión + control de asistencia (RAGC) */}
                            {!isFeriado && (() => {
                              const restanteRAGC = horasRestantesRAGC(c)
                              const estadoLabels: Record<string, { txt: string; cls: string }> = {
                                realizada: { txt: '✓ Realizada', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
                                pendiente: { txt: '⏳ Pendiente (por recuperar)', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
                                adelantada: { txt: '⏩ Adelantada', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
                                suspendida: { txt: '🚫 Suspendida', cls: 'bg-red-500/15 text-red-300 border-red-500/30' },
                              }
                              const badge = estadoLabels[c.estado]
                              return (
                                <div className="pt-2 border-t border-slate-800 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {(c.hora_inicio || c.hora_fin) && (
                                      <span className="text-[10px] text-slate-500 font-medium">
                                        🕒 {c.hora_inicio}{c.hora_fin ? `–${c.hora_fin}` : ''}
                                      </span>
                                    )}
                                    {badge && (
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.cls}`}>{badge.txt}</span>
                                    )}
                                  </div>

                                  {/* Aviso de plazo RAGC */}
                                  {restanteRAGC !== null && (
                                    <div className={`flex items-center justify-between gap-2 text-[11px] p-1.5 rounded border ${
                                      restanteRAGC <= 6 ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                    }`}>
                                      <span>{restanteRAGC > 0 ? `Registra asistencia en RAGC (${restanteRAGC}h restantes)` : 'Plazo RAGC vencido'}</span>
                                      <button
                                        onClick={() => patchClase(c.id, { asistencia_ragc: true }, 'Asistencia RAGC registrada')}
                                        className="font-bold underline hover:no-underline shrink-0"
                                      >
                                        Marcar RAGC
                                      </button>
                                    </div>
                                  )}
                                  {c.estado === 'realizada' && c.asistencia_ragc && (
                                    <span className="text-[10px] text-emerald-400 font-semibold">✓ Asistencia registrada en RAGC</span>
                                  )}

                                  {/* Nota de recuperación cuando queda pendiente */}
                                  {c.estado === 'pendiente' && c.nota_recuperacion && (
                                    <p className="text-[11px] text-amber-200/80 italic">Recuperación: {c.nota_recuperacion}</p>
                                  )}

                                  {/* Acciones de estado */}
                                  {c.estado !== 'realizada' && c.estado !== 'suspendida' && (
                                    <div className="flex flex-wrap gap-1.5">
                                      <button
                                        disabled={!puedeConfirmar(c)}
                                        onClick={() => patchClase(c.id, { estado: 'realizada' }, 'Clase confirmada como realizada')}
                                        title={puedeConfirmar(c) ? 'Confirmar que dictaste la clase' : 'Se habilita al comenzar la clase'}
                                        className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                      >
                                        <CheckSquare className="w-3 h-3" /> Confirmar realizada
                                      </button>
                                      <button
                                        onClick={() => {
                                          const nota = window.prompt('¿Cómo se recuperará esta clase? (trabajo autónomo, repaso la próxima clase, etc.)', c.nota_recuperacion || '')
                                          if (nota !== null) patchClase(c.id, { estado: 'pendiente', nota_recuperacion: nota || null }, 'Clase marcada como pendiente')
                                        }}
                                        className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all"
                                      >
                                        <AlertTriangle className="w-3 h-3" /> No se realizó
                                      </button>
                                      {puedeConfirmar(c) ? null : (
                                        <button
                                          onClick={() => patchClase(c.id, { estado: 'adelantada' }, 'Clase marcada como adelantada')}
                                          className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border bg-sky-500/10 border-sky-500/30 text-sky-300 hover:bg-sky-500/20 transition-all"
                                        >
                                          ⏩ Adelantar
                                        </button>
                                      )}
                                    </div>
                                  )}
                                  {(c.estado === 'realizada' || c.estado === 'adelantada') && (
                                    <button
                                      onClick={() => patchClase(c.id, { estado: 'programada', asistencia_ragc: false }, 'Estado revertido')}
                                      className="text-[10px] text-slate-500 hover:text-slate-300 underline"
                                    >
                                      Deshacer estado
                                    </button>
                                  )}
                                </div>
                              )
                            })()}
                          </div>

                          {/* Botones de acción rápidos */}
                          <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/60">
                            <button
                              onClick={() => patchClase(c.id, { materiales_pedidos: !c.materiales_pedidos }, c.materiales_pedidos ? 'Materiales desmarcados' : 'Materiales marcados como pedidos')}
                              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                                c.materiales_pedidos
                                  ? 'bg-green-500/20 border-green-500 text-green-400'
                                  : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              {c.materiales_pedidos ? 'Materiales Pedidos' : 'Pedir Materiales'}
                            </button>

                            <button
                              onClick={() => setSelectedClase(c)}
                              className="flex items-center gap-1 text-xs text-slate-300 hover:text-white font-semibold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-all"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Editar
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VISTA CALENDARIO MENSUAL */}
          {activeTab === 'calendar' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white select-none capitalize">
                  {currentMonth.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                    className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                    className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {/* Cabecera Días */}
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
                  <div key={d} className="text-center text-slate-500 font-semibold text-xs py-2 bg-slate-950/40 rounded">
                    {d.slice(0, 3)}
                  </div>
                ))}

                {/* Celdas de Días */}
                {getDaysInMonth(currentMonth).map((day, idx) => {
                  const dateStr = getLocalDateString(day)
                  // El calendario mensual muestra TODAS las secciones juntas.
                  const clasesDia = clases
                    .filter(c => getLocalDateString(new Date(c.fecha)) === dateStr)
                    .sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''))

                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                  
                  return (
                    <div
                      key={idx}
                      className={`min-h-[90px] border border-slate-800/40 p-1.5 rounded flex flex-col justify-between transition-all ${
                        isCurrentMonth ? 'bg-slate-950/20' : 'bg-transparent opacity-30 pointer-events-none'
                      }`}
                    >
                      <span className={`text-xs font-semibold ${isCurrentMonth ? 'text-slate-400' : 'text-slate-600'}`}>
                        {day.getDate()}
                      </span>

                      <div className="space-y-1">
                        {clasesDia.map(c => {
                          const isFeriado = !!c.es_feriado
                          
                          let color = 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                          if (isFeriado) {
                            color = 'bg-red-500/10 border-red-500/30 text-red-400'
                          } else if (c.tiene_evaluacion) {
                            color = 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          } else if (c.tipo_bloque === 'laboratorio') {
                            color = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          }

                          return (
                            <button
                              key={c.id}
                              onClick={() => setSelectedClase(c)}
                              title={`${c.section ? `Sección ${c.section} · ` : ''}${c.hora_inicio ? `${c.hora_inicio} · ` : ''}${c.titulo}`}
                              className={`w-full text-left truncate text-[10px] font-medium p-1 rounded border transition-all ${color}`}
                            >
                              {c.section && <span className="font-bold opacity-80">{c.section}</span>}
                              {c.section && ' '}
                              {c.hora_inicio && <span className="opacity-60">{c.hora_inicio}</span>}{' '}
                              {c.titulo}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL DE EDICIÓN DE CLASE */}
      {selectedClase && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-white font-bold">Editar Sesión {selectedClase.sesion}</h3>
              <button
                onClick={() => setSelectedClase(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase">Fecha</span>
                <p className="text-slate-300 text-sm font-medium">{formatFecha(selectedClase.fecha)}</p>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase mb-1">Título de la Clase</label>
                <input
                  type="text"
                  value={selectedClase.titulo}
                  onChange={(e) => setSelectedClase({ ...selectedClase, titulo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase mb-1">Contenido Académico</label>
                <textarea
                  rows={3}
                  value={selectedClase.contenido}
                  onChange={(e) => setSelectedClase({ ...selectedClase, contenido: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase mb-1">Estado</label>
                  <select
                    value={selectedClase.estado}
                    onChange={(e) => setSelectedClase({ ...selectedClase, estado: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="programada">Programada</option>
                    <option value="dictada">Dictada</option>
                    <option value="suspendida">Suspendida</option>
                  </select>
                </div>

                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-sm select-none">
                    <input
                      type="checkbox"
                      checked={!!selectedClase.materiales_pedidos}
                      onChange={(e) => setSelectedClase({ ...selectedClase, materiales_pedidos: e.target.checked })}
                      className="w-4 h-4 rounded accent-indigo-600 focus:outline-none"
                    />
                    <span>Materiales Pedidos</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase mb-1">Observaciones / Notas Personales</label>
                <textarea
                  rows={2}
                  placeholder="Añade notas del desarrollo de la clase, asistencia, etc."
                  value={selectedClase.observaciones || ''}
                  onChange={(e) => setSelectedClase({ ...selectedClase, observaciones: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-slate-800 bg-slate-950/40">
              <button
                type="button"
                onClick={() => setSelectedClase(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleUpdateClase(selectedClase.id, {
                  titulo: selectedClase.titulo,
                  contenido: selectedClase.contenido,
                  estado: selectedClase.estado,
                  materiales_pedidos: selectedClase.materiales_pedidos,
                  observaciones: selectedClase.observaciones
                })}
                className="flex items-center gap-1 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-md hover:shadow-indigo-500/20"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
