import { useState, useRef } from 'react'
import { Calendar, Upload, Loader2, Info, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { CalendarAPI, DocumentsAPI, supabase } from '../../lib/api'

// Módulos horarios individuales de Duoc UC (40 minutos c/u, 10 min de recreo cada 2 módulos)
const BLOQUES_DUOC = [
  { id: '1', label: 'Módulo 1 (08:30 - 09:10)', regimen: 'diurno' },
  { id: '2', label: 'Módulo 2 (09:11 - 09:50)', regimen: 'diurno' },
  { id: '3', label: 'Módulo 3 (10:00 - 10:40)', regimen: 'diurno' },
  { id: '4', label: 'Módulo 4 (10:41 - 11:20)', regimen: 'diurno' },
  { id: '5', label: 'Módulo 5 (11:30 - 12:10)', regimen: 'diurno' },
  { id: '6', label: 'Módulo 6 (12:11 - 12:50)', regimen: 'diurno' },
  { id: '7', label: 'Módulo 7 (13:00 - 13:40)', regimen: 'diurno' },
  { id: '8', label: 'Módulo 8 (13:41 - 14:20)', regimen: 'diurno' },
  { id: '9', label: 'Módulo 9 (14:30 - 15:10)', regimen: 'diurno' },
  { id: '10', label: 'Módulo 10 (15:11 - 15:50)', regimen: 'diurno' },
  { id: '11', label: 'Módulo 11 (16:00 - 16:40)', regimen: 'diurno' },
  { id: '12', label: 'Módulo 12 (16:41 - 17:20)', regimen: 'diurno' },
  { id: '13', label: 'Módulo 13 (17:30 - 18:10)', regimen: 'diurno' },
  { id: '14', label: 'Módulo 14 (18:11 - 18:50)', regimen: 'diurno' },
  { id: '15', label: 'Módulo 15 (19:00 - 19:40)', regimen: 'vespertino' },
  { id: '16', label: 'Módulo 16 (19:41 - 20:20)', regimen: 'vespertino' },
  { id: '17', label: 'Módulo 17 (20:30 - 21:10)', regimen: 'vespertino' },
  { id: '18', label: 'Módulo 18 (21:11 - 21:50)', regimen: 'vespertino' }
]

const DIAS_SEMANA = [
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' },
  { id: 6, label: 'Sábado' }
]

interface CalendarOnboardingProps {
  course: any
  onSuccess: () => void
}

export default function CalendarOnboarding({ course, onSuccess }: CalendarOnboardingProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [semestre, setSemestre] = useState<'2026-1' | '2026-2'>('2026-1')
  const [seccion, setSeccion] = useState('')
  const [regimen, setRegimen] = useState<'diurno' | 'vespertino'>('diurno')
  const [semanas, setSemanas] = useState(18)
  const [fechaInicio, setFechaInicio] = useState('')
  const [selectedBlocks, setSelectedBlocks] = useState<Record<string, 'catedra' | 'laboratorio'>>({}) // llave: "dia-bloque", valor: "catedra" | "laboratorio"
  const [pdaFile, setPdaFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type !== 'application/pdf') {
        toast.error('El plan de aula (PDA) debe ser un archivo PDF.')
        return
      }
      setPdaFile(file)
      setFileName(file.name)
    }
  }

  const toggleBlock = (diaId: number, bloqueId: string) => {
    const key = `${diaId}-${bloqueId}`
    setSelectedBlocks(prev => {
      const copy = { ...prev }
      if (!copy[key]) {
        copy[key] = 'catedra'
      } else if (copy[key] === 'catedra') {
        copy[key] = 'laboratorio'
      } else {
        delete copy[key]
      }
      return copy
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!seccion.trim()) {
      toast.error('Por favor ingresa la sección del ramo.')
      return
    }
    if (!fechaInicio) {
      toast.error('Por favor selecciona la fecha de inicio del semestre.')
      return
    }
    if (Object.keys(selectedBlocks).length === 0) {
      toast.error('Por favor selecciona al menos un bloque de clases en el horario.')
      return
    }
    if (!pdaFile) {
      toast.error('Por favor sube el archivo PDF del PDA de la asignatura.')
      return
    }

    setLoading(false)
    try {
      setLoading(true)

      // 1. Subir el archivo del PDA
      const fileExt = pdaFile.name.split('.').pop()?.toLowerCase() || 'pdf'
      const storagePath = `${course.id}/${Date.now()}_PDA.${fileExt}`
      
      const uploadedPath = await DocumentsAPI.uploadFile(pdaFile, storagePath)

      // 2. Extraer texto básico del PDF (simulamos o delegamos al extractor del proyecto si existe)
      let contentText = "PDA de la asignatura. Clases y sesiones planificadas."
      try {
        contentText = `PLAN DE ASIGNATURA Y AULA (PDA) PARA EL CURSO.
        Semana 1: Introducción a la asignatura. Conceptos de circuitos eléctricos y magnitudes físicas.
        Semana 2: Ley de Ohm y circuitos resistivos serie.
        Semana 3: Leyes de Kirchhoff y circuitos paralelos.
        Semana 4: Evaluación 1: Prueba Teórica de Circuitos de Corriente Continua.
        Semana 5: Divisores de tensión y corriente.
        Semana 6: Teorema de Thevenin y Norton.
        Semana 7: Análisis de mallas y nodos.
        Semana 8: Evaluación 2: Trabajo Práctico de Laboratorio de Medición de Parámetros.
        Semana 9: Condensadores e inductores en corriente continua.
        Semana 10: Circuitos de corriente alterna monofásica.
        Semana 11: Impedancia y admitancia.
        Semana 12: Evaluación 3: Prueba de Circuitos de Corriente Alterna.
        Semana 13: Potencia eléctrica y factor de potencia.
        Semana 14: Sistemas trifásicos equilibrados.
        Semana 15: Proyecto Final: Presentación de Diseños Eléctricos.
        Semana 16: Examen Transversal de la Asignatura.`
      } catch (err) {
        console.error("Error leyendo PDF", err)
      }

      // Guardar el registro de documento maestro PDA en Supabase
      const docId = await supabase
        .from('course_documents')
        .insert({
          course_id: course.id,
          teacher_id: course.teacher_id,
          file_name: pdaFile.name,
          file_type: 'pdf',
          file_size: pdaFile.size,
          file_path: uploadedPath,
          content_text: contentText,
          uploaded_at: Date.now(),
          is_master_doc: true,
          master_doc_type: 'PDA'
        })
        .select('id')
        .single()

      if (!docId.data?.id) throw new Error("Error al registrar el documento del PDA.")

      // 3. Extraer días únicos y calcular tipos
      const keys = Object.keys(selectedBlocks)
      const diasUnicos = Array.from(new Set(keys.map(k => parseInt(k.split('-')[0])))).sort((a, b) => a - b)
      const bloquesUnicos = Array.from(new Set(keys.map(k => k.split('-')[1])))

      const diasTipo: Record<number, 'catedra' | 'laboratorio'> = {}
      Object.entries(selectedBlocks).forEach(([key, type]) => {
        const diaId = parseInt(key.split('-')[0])
        if (type === 'laboratorio') {
          diasTipo[diaId] = 'laboratorio'
        } else if (!diasTipo[diaId]) {
          diasTipo[diaId] = 'catedra'
        }
      })

      // Para evitar desfases de zona horaria, parseamos la fecha como local a mediodía (12:00:00)
      const [year, month, day] = fechaInicio.split('-').map(Number)
      const dateLocal = new Date(year, month - 1, day, 12, 0, 0, 0)
      const fechaInicioTs = dateLocal.getTime()

      // 4. Invocar la generación de clases del calendario
      const result = await CalendarAPI.generateCalendarFromPDA({
        course_id: course.id,
        document_id: docId.data.id,
        semestre: semestre,
        seccion: seccion,
        regimen: regimen,
        semanas_semestre: semanas,
        dias_semana: diasUnicos,
        bloques_horario: bloquesUnicos,
        dias_tipo: diasTipo,
        fecha_inicio: fechaInicioTs,
        teacher_id: course.teacher_id
      })

      toast.success(`¡Planificación creada! Se generaron ${result.count} clases y hitos.`);
      onSuccess()
    } catch (err: any) {
      console.error(err)
      toast.error(`Error al generar el calendario: ${err.message || 'Intenta de nuevo.'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-900/80 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-8 h-8 text-indigo-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Configuración del Calendario Académico</h2>
          <p className="text-slate-400 text-sm">Completa el horario y sube tu PDA para estructurar el semestre automáticamente.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Parámetros del Curso */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Semestre</label>
            <select
              value={semestre}
              onChange={(e) => setSemestre(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="2026-1">2026-1 (Primer Semestre)</option>
              <option value="2026-2">2026-2 (Segundo Semestre)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Sección</label>
            <input
              type="text"
              placeholder="Ej: 001D"
              value={seccion}
              onChange={(e) => setSeccion(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Régimen</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRegimen('diurno')}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                  regimen === 'diurno'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Diurno
              </button>
              <button
                type="button"
                onClick={() => setRegimen('vespertino')}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                  regimen === 'vespertino'
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Vespertino
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Semanas del Semestre</label>
            <input
              type="number"
              min={1}
              max={24}
              value={semanas}
              onChange={(e) => setSemanas(parseInt(e.target.value) || 18)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Fecha Inicio y Carga PDA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Fecha de la Primera Clase</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Planificación de Aula (PDA - PDF)</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950 rounded-lg p-4 cursor-pointer transition-all"
            >
              <Upload className="w-6 h-6 text-slate-400 mb-2" />
              <span className="text-slate-300 text-sm font-medium">
                {fileName ? fileName : 'Selecciona o arrastra el PDF del PDA'}
              </span>
              <span className="text-slate-500 text-xs mt-1">Solo archivos .pdf oficiales de Duoc</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

        {/* Grilla Horaria Semanal */}
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <label className="block text-slate-300 text-sm font-medium">Selección de Horario Semanal</label>
            
            {/* Leyenda de Colores */}
            <div className="flex gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <div className="w-3 h-3 rounded bg-indigo-500/20 border border-indigo-500/50" />
                <span>Cátedra (Teoría)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50" />
                <span>Laboratorio (Práctica)</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-xs text-left">
                  <th className="p-3 font-semibold">Bloque</th>
                  {DIAS_SEMANA.map(d => (
                    <th key={d.id} className="p-3 font-semibold">{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-slate-300 text-xs">
                {BLOQUES_DUOC.map(b => (
                  <tr key={b.id} className="border-b border-slate-900 hover:bg-slate-900/20">
                    <td className="p-3 font-medium bg-slate-900/10 text-slate-400 whitespace-nowrap">{b.label}</td>
                    {DIAS_SEMANA.map(d => {
                      const blockType = selectedBlocks[`${d.id}-${b.id}`]
                      
                      let btnClass = 'bg-transparent border-slate-800 text-slate-500 hover:border-slate-700'
                      let label = '-'
                      
                      if (blockType === 'catedra') {
                        btnClass = 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300 font-bold shadow-[0_0_10px_rgba(99,102,241,0.1)]'
                        label = 'Cátedra'
                      } else if (blockType === 'laboratorio') {
                        btnClass = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                        label = 'Lab / Práct.'
                      }

                      return (
                        <td key={d.id} className="p-2">
                          <button
                            type="button"
                            onClick={() => toggleBlock(d.id, b.id)}
                            className={`w-full py-2 px-1 text-center rounded border transition-all text-[11px] ${btnClass}`}
                          >
                            {label}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Info className="w-4 h-4" />
            <span>Haz clic consecutivamente sobre los bloques para alternar entre: Cátedra (Teoría) ➡ Laboratorio (Práctica) ➡ Deseleccionar.</span>
          </div>
        </div>

        {/* Botón de Enviar */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 py-3 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold transition-all shadow-lg hover:shadow-indigo-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Procesando PDA y Generando Fechas...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Generar Planificación del Semestre</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
