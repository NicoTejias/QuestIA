import { useState, useEffect, useRef, useCallback } from 'react'
import { Calendar, CheckCircle2, AlertTriangle, Upload, Loader2, X, Sparkles, BookOpen, ShieldCheck, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { FECHA_INICIO_OFICIAL_2026_2, generarPlanificacion18Semanas } from '../../services/calendarPlannerService'
import type { SesionHorarioConfig } from '../../services/calendarPlannerService'
import { AvaSyncService } from '../../services/avaSyncService'
import type { EstadoDocumentosMaleta } from '../../services/avaSyncService'
import { extractTextFromFile, getFileType } from '../../utils/documentParser'
import { DUOC_OFFICIAL_COURSES_2026_2 } from '../../data/duocCoursesData'

interface CalendarioAutomaticoModalProps {
  course: any
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CalendarioAutomaticoModal({ course, isOpen, onClose, onSuccess }: CalendarioAutomaticoModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Obtener secciones oficiales de este curso (desde datos oficiales o config previa)
  const courseOfficial = DUOC_OFFICIAL_COURSES_2026_2.find(c => c.code === course?.code)
  const availableSections = courseOfficial?.sections || course?.schedule_config?.secciones?.map((s: any) => s.seccion) || ['001D']

  const [selectedSection, setSelectedSection] = useState<string>(availableSections[0] || '001D')
  const [fechaInicio, setFechaInicio] = useState<string>(FECHA_INICIO_OFICIAL_2026_2)
  const [loading, setLoading] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [docUploadType, setDocUploadType] = useState<'PDA' | 'PIA' | 'PA'>('PDA')

  // Horario por defecto: 2 sesiones semanales (Lunes Cátedra, Miércoles Laboratorio)
  const [sesiones, setSesiones] = useState<SesionHorarioConfig[]>([
    { dia: 1, tipo: 'catedra', hora_inicio: '08:30', hora_fin: '10:40' },
    { dia: 3, tipo: 'laboratorio', hora_inicio: '08:30', hora_fin: '10:40' }
  ])

  // Estado de documentos
  const [estadoDocs, setEstadoDocs] = useState<EstadoDocumentosMaleta | null>(null)
  const [loadingDocs, setLoadingDocs] = useState(true)

  const cargarEstadoDocs = useCallback(async () => {
    if (!course?.id) return
    setLoadingDocs(true)
    try {
      const res = await AvaSyncService.verificarDocumentosMaestros(course.id)
      setEstadoDocs(res)
    } catch (err: any) {
      console.error('Error cargando documentos de maleta:', err)
    } finally {
      setLoadingDocs(false)
    }
  }, [course?.id])

  useEffect(() => {
    if (isOpen) {
      cargarEstadoDocs()
    }
  }, [isOpen, cargarEstadoDocs])

  if (!isOpen) return null

  const handleSubirDocumento = async (files: FileList | null) => {
    if (!files || files.length === 0 || !course?.id) return
    const file = files[0]
    setUploadingDoc(true)
    try {
      const text = await extractTextFromFile(file)
      const fileType = getFileType(file.name) || 'pdf'
      await AvaSyncService.registrarDocumentoOficial({
        courseId: course.id,
        teacherId: course.teacher_id || '',
        fileName: file.name,
        fileType,
        fileSize: file.size,
        contentText: text,
        docType: docUploadType
      })
      toast.success(`Documento ${docUploadType} (${file.name}) subido y vinculado exitosamente.`)
      await cargarEstadoDocs()
    } catch (err: any) {
      console.error(err)
      toast.error(`Error al procesar el archivo: ${err.message}`)
    } finally {
      setUploadingDoc(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleGenerarPlanificacion = async () => {
    setLoading(true)
    try {
      const res = await generarPlanificacion18Semanas({
        courseId: course.id,
        teacherId: course.teacher_id || '',
        seccion: selectedSection,
        semestre: course.semester || '2026-2',
        fechaInicioIso: fechaInicio,
        sesionesHorario: sesiones,
        regimen: 'diurno'
      })

      toast.success(`¡Calendario de 18 semanas generado para la sección ${selectedSection}! (${res.totalClases} sesiones programadas)`)
      if (!res.documentosEncontrados.completo) {
        toast.warning(`Recuerda subir los documentos faltantes (${res.documentosEncontrados.faltantes.join(', ')}) para enriquecer las sesiones.`)
      }

      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error generando planificación:', err)
      toast.error(`Error al generar planificación: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const DIAS_OPCIONES = [
    { id: 1, label: 'Lunes' },
    { id: 2, label: 'Martes' },
    { id: 3, label: 'Miércoles' },
    { id: 4, label: 'Jueves' },
    { id: 5, label: 'Viernes' },
    { id: 6, label: 'Sábado' }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Encabezado */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Planificación Curricular Oficial (18 Semanas)
              </h3>
              <p className="text-xs text-slate-400">
                {course.code} - {course.name} · Calendario Académico Duoc UC 2026-2
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar text-sm">
          {/* Tarjeta de Inicio de Semestre Institucional */}
          <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Inicio Oficial Duoc UC
              </span>
              <p className="text-white font-semibold text-sm">
                Lunes 10 de Agosto de 2026 (Semestre 2026-2)
              </p>
              <p className="text-xs text-slate-400">
                Las 18 semanas se calendarizan automáticamente desde esta fecha fija del calendario académico.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <input
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Selector de Sección y Horario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Sección a Programar
              </label>
              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {availableSections.map((sec: string) => (
                  <option key={sec} value={sec}>
                    Sección {sec}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Se generarán las 18 semanas de clases y evaluaciones exclusivas para esta sección.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Estructura Semanal (2 Sesiones)
              </label>
              <div className="space-y-2">
                {sesiones.map((ses, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <select
                      value={ses.dia}
                      onChange={e => {
                        const newDia = Number(e.target.value)
                        setSesiones(prev => prev.map((s, i) => i === idx ? { ...s, dia: newDia } : s))
                      }}
                      className="bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1"
                    >
                      {DIAS_OPCIONES.map(d => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </select>

                    <select
                      value={ses.tipo}
                      onChange={e => {
                        const newTipo = e.target.value as 'catedra' | 'laboratorio'
                        setSesiones(prev => prev.map((s, i) => i === idx ? { ...s, tipo: newTipo } : s))
                      }}
                      className="bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1"
                    >
                      <option value="catedra">Cátedra</option>
                      <option value="laboratorio">Laboratorio</option>
                    </select>

                    <input
                      type="text"
                      value={ses.hora_inicio || '08:30'}
                      onChange={e => {
                        const val = e.target.value
                        setSesiones(prev => prev.map((s, i) => i === idx ? { ...s, hora_inicio: val } : s))
                      }}
                      placeholder="08:30"
                      className="w-16 bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1 text-center"
                    />
                    <span className="text-slate-500">-</span>
                    <input
                      type="text"
                      value={ses.hora_fin || '10:40'}
                      onChange={e => {
                        const val = e.target.value
                        setSesiones(prev => prev.map((s, i) => i === idx ? { ...s, hora_fin: val } : s))
                      }}
                      placeholder="10:40"
                      className="w-16 bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1 text-center"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Verificación de Documentos Maestros (PDA, PIA, PA) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                Maleta Didáctica Institucional (AVA / Vivo Duoc)
              </span>
              {loadingDocs ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              ) : estadoDocs?.completo ? (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Documentos Completos
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Faltan Documentos Oficiales
                </span>
              )}
            </div>

            {/* Badges de estado de documentos */}
            <div className="grid grid-cols-3 gap-3">
              <div className={`p-3 rounded-lg border text-center transition-all ${
                estadoDocs?.tienePDA ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}>
                <div className="text-xs font-bold">PDA</div>
                <div className="text-[10px] mt-0.5">Plan Didáctico Aula</div>
                <div className="mt-1">
                  {estadoDocs?.tienePDA ? '✅ Vinculado' : '⚠️ Pendiente'}
                </div>
              </div>

              <div className={`p-3 rounded-lg border text-center transition-all ${
                estadoDocs?.tienePIA ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}>
                <div className="text-xs font-bold">PIA</div>
                <div className="text-[10px] mt-0.5">Plan Instruccional</div>
                <div className="mt-1">
                  {estadoDocs?.tienePIA ? '✅ Vinculado' : '⚠️ Pendiente'}
                </div>
              </div>

              <div className={`p-3 rounded-lg border text-center transition-all ${
                estadoDocs?.tienePA ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}>
                <div className="text-xs font-bold">PA</div>
                <div className="text-[10px] mt-0.5">Programa Asignatura</div>
                <div className="mt-1">
                  {estadoDocs?.tienePA ? '✅ Vinculado' : '⚠️ Pendiente'}
                </div>
              </div>
            </div>

            {/* Carga rápida si falta algún documento */}
            {(!estadoDocs?.completo) && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 space-y-3">
                <p className="text-xs text-amber-300 font-medium">
                  ¿Tienes los archivos oficiales de este ramo? Súbelos para que la IA extraiga los Indicadores de Logro y temas de cada sesión:
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Tipo:</span>
                    <select
                      value={docUploadType}
                      onChange={e => setDocUploadType(e.target.value as any)}
                      className="bg-slate-900 border border-slate-800 text-white rounded px-2.5 py-1 text-xs"
                    >
                      <option value="PDA">PDA (Plan Didáctico de Aula)</option>
                      <option value="PIA">PIA (Plan Instruccional)</option>
                      <option value="PA">PA (Programa de Asignatura)</option>
                    </select>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc"
                    className="hidden"
                    onChange={e => handleSubirDocumento(e.target.files)}
                  />

                  <button
                    type="button"
                    disabled={uploadingDoc}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    {uploadingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Subir {docUploadType}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Esquema Pedagógico Oficial de 18 Semanas */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Distribución Pedagógica Oficial (18 Semanas)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase">Semanas 1 a 4</span>
                <p className="font-semibold text-white">EA 1: Fundamentos</p>
                <p className="text-[11px] text-slate-400">Cátedra y talleres prácticos</p>
              </div>

              <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-3 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase">Semana 5</span>
                <p className="font-semibold text-amber-200">🎯 Formativa 1</p>
                <p className="text-[11px] text-slate-400">Hito EA 1 + Retroalimentación</p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase">Semanas 6 a 9</span>
                <p className="font-semibold text-white">EA 2: Desarrollo</p>
                <p className="text-[11px] text-slate-400">Instalaciones y normativa</p>
              </div>

              <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-3 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase">Semana 10</span>
                <p className="font-semibold text-amber-200">🎯 Formativa 2</p>
                <p className="text-[11px] text-slate-400">Hito EA 2 + Avance de taller</p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase">Semanas 11 a 14</span>
                <p className="font-semibold text-white">EA 3: Aplicación</p>
                <p className="text-[11px] text-slate-400">Proyecto y diagnóstico</p>
              </div>

              <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-3 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase">Semana 15</span>
                <p className="font-semibold text-amber-200">🎯 Formativa 3</p>
                <p className="text-[11px] text-slate-400">Hito EA 3 + Preparación Examen</p>
              </div>

              <div className="bg-rose-950/20 border border-rose-500/30 rounded-lg p-3 space-y-1">
                <span className="text-[10px] font-bold text-rose-400 uppercase">Semanas 16 y 17</span>
                <p className="font-semibold text-rose-200">🏆 Examen Transversal</p>
                <p className="text-[11px] text-slate-400">Entrega y defensa de proyecto</p>
              </div>

              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-3 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Semana 18</span>
                <p className="font-semibold text-emerald-200">🔄 Recuperaciones</p>
                <p className="text-[11px] text-slate-400">Rezagados y actas oficiales</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pie del modal con botón de acción */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800 rounded-xl transition-all"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleGenerarPlanificacion}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generando Planificación...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generar Planificación Oficial (18 Semanas)</span>
                <ChevronRight className="w-4 h-4 ml-1 opacity-70" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
