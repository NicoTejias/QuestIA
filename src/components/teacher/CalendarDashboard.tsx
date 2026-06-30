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

  // Obtener el número total de semanas en el calendario
  const maxSemanas = clases.reduce((acc, c) => Math.max(acc, c.semana), 1)

  // Filtrar clases de la semana seleccionada en Timeline
  const clasesSemana = clases.filter(c => c.semana === selectedSemana)

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

  const formatFecha = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Planificación Curricular - Sección {course.schedule_config?.seccion || 'N/A'}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Régimen: <span className="capitalize font-semibold text-indigo-400">{course.schedule_config?.regimen}</span> | Semanas planificadas: {course.schedule_config?.semanas_semestre}
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

              {/* Lista de Tarjetas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clasesSemana.length === 0 ? (
                  <div className="col-span-2 text-center text-slate-500 py-8">
                    No hay clases registradas para esta semana.
                  </div>
                ) : (
                  clasesSemana.map((c) => {
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
                        </div>

                        {/* Botones de acción rápidos */}
                        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/60">
                          <button
                            onClick={() => handleUpdateClase(c.id, { materiales_pedidos: !c.materiales_pedidos })}
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
                  })
                )}
              </div>
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
                  const clasesDia = clases.filter(c => {
                    const cDate = getLocalDateString(new Date(c.fecha))
                    return cDate === dateStr
                  })

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
                              className={`w-full text-left truncate text-[10px] font-medium p-1 rounded border transition-all ${color}`}
                            >
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
