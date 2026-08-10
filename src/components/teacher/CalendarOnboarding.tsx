import { useState, useRef, useEffect } from 'react'
import { Calendar, Upload, Loader2, Info, CheckCircle2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { CalendarAPI, DocumentsAPI, InventarioPanolAPI, supabase } from '../../lib/api'
import { extractTextFromFile, getFileType } from '../../utils/documentParser'
import { esSemestreValido, semestreDeFecha, opcionesDeSemestre, formatSemestre } from '../../lib/semesters'

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
  { id: '18', label: 'Módulo 18 (21:11 - 21:50)', regimen: 'vespertino' },
  { id: '19', label: 'Módulo 19 (21:51 - 22:30)', regimen: 'vespertino' }
]

// Mapa módulo → { inicio, fin } extraído de los labels ("HH:MM - HH:MM").
const HORAS_MODULO: Record<string, { inicio: string; fin: string }> = Object.fromEntries(
  BLOQUES_DUOC.map(b => {
    const m = b.label.match(/\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/)
    return [b.id, { inicio: m?.[1] || '', fin: m?.[2] || '' }]
  })
)

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

// Una sección del ramo: nombre + su propio horario/régimen. La fecha de inicio es común al semestre.
interface SeccionConfig {
  id: string
  nombre: string
  regimen: 'diurno' | 'vespertino'
  selectedBlocks: Record<string, 'catedra' | 'laboratorio'> // llave: "dia-bloque"
}

const nuevaSeccion = (nombre = ''): SeccionConfig => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  nombre,
  regimen: 'diurno',
  selectedBlocks: {},
})

export default function CalendarOnboarding({ course, onSuccess }: CalendarOnboardingProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  // El semestre lo define el ramo; si aún no lo tiene, se propone el del calendario.
  const [semestre, setSemestre] = useState<string>(
    esSemestreValido(course.semester) ? course.semester : semestreDeFecha()
  )
  const [semanas, setSemanas] = useState(18)
  // Fecha de inicio única para todo el semestre (común a todas las secciones).
  const [fechaInicioSemestre, setFechaInicioSemestre] = useState('')

  // Secciones del ramo: el docente puede configurar el horario de cada una.
  const [secciones, setSecciones] = useState<SeccionConfig[]>([nuevaSeccion('Sección 1')])
  const [seccionActivaId, setSeccionActivaId] = useState<string>('')

  // Uno o varios archivos (maleta didáctica: varias presentaciones = varias sesiones en orden).
  const [pdaFiles, setPdaFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  // Wizard: paso actual (1: datos comunes, 2: secciones, 3: horarios).
  const [paso, setPaso] = useState<1 | 2 | 3>(1)

  // Valida el paso actual antes de avanzar. Devuelve true si es válido.
  const validarPaso = (p: number): boolean => {
    if (p === 1) {
      if (!fechaInicioSemestre) {
        toast.error('Selecciona la fecha de inicio del semestre.')
        return false
      }
      if (fuente === 'existentes' && docsSeleccionados.length === 0) {
        toast.error('Selecciona al menos un documento del ramo para calendarizar.')
        return false
      }
      if (fuente === 'nuevo' && pdaFiles.length === 0) {
        toast.error('Sube al menos un archivo del ramo.')
        return false
      }
    }
    if (p === 2) {
      if (secciones.some(s => !s.nombre.trim())) {
        toast.error('Cada sección debe tener un nombre.')
        return false
      }
      const nombres = secciones.map(s => s.nombre.trim().toLowerCase())
      if (new Set(nombres).size !== nombres.length) {
        toast.error('Hay secciones con el mismo nombre. Usa nombres distintos.')
        return false
      }
    }
    return true
  }

  const irSiguiente = () => {
    if (!validarPaso(paso)) return
    setPaso(p => (Math.min(3, p + 1) as 1 | 2 | 3))
  }

  // Sección actualmente en edición en la grilla de horario (paso 3).
  const seccionActiva = secciones.find(s => s.id === seccionActivaId) || secciones[0]

  // Ajusta la cantidad de secciones conservando las existentes (agrega o recorta al final).
  const setCantidadSecciones = (cantidad: number) => {
    const n = Math.max(1, Math.min(20, cantidad || 1))
    setSecciones(prev => {
      if (n === prev.length) return prev
      if (n < prev.length) return prev.slice(0, n)
      const extra = Array.from({ length: n - prev.length }, (_, i) =>
        nuevaSeccion(`Sección ${prev.length + i + 1}`)
      )
      return [...prev, ...extra]
    })
  }

  const updateSeccion = (id: string, patch: Partial<SeccionConfig>) => {
    setSecciones(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)))
  }

  const agregarSeccion = () => {
    const nueva = nuevaSeccion(`Sección ${secciones.length + 1}`)
    setSecciones(prev => [...prev, nueva])
    setSeccionActivaId(nueva.id)
  }

  const eliminarSeccion = (id: string) => {
    if (secciones.length <= 1) return
    setSecciones(prev => prev.filter(s => s.id !== id))
    if (seccionActivaId === id) setSeccionActivaId('')
  }

  // Fuente del PDA: documentos ya subidos al ramo (recomendado) o un archivo nuevo
  const [fuente, setFuente] = useState<'existentes' | 'nuevo'>('existentes')
  const [docsRamo, setDocsRamo] = useState<any[]>([])
  const [docsSeleccionados, setDocsSeleccionados] = useState<string[]>([])
  const [docsLoading, setDocsLoading] = useState(true)

  // Inventario de pañol (referencia de materiales para la IA).
  const [inventarioPanol, setInventarioPanol] = useState<string[]>([])
  useEffect(() => {
    InventarioPanolAPI.getDisponiblesNombres()
      .then(setInventarioPanol)
      .catch(() => setInventarioPanol([])) // si la tabla no existe aún, seguimos sin inventario
  }, [])

  useEffect(() => {
    let activo = true
    ;(async () => {
      try {
        const docs = await DocumentsAPI.getDocumentsByCourse(course.id)
        if (!activo) return
        const disponibles = (docs || []).filter((d: any) => d.content_text)
        setDocsRamo(disponibles)
        if (disponibles.length > 0) {
          setDocsSeleccionados(disponibles.map((d: any) => d.id))
        } else {
          setFuente('nuevo')
        }
      } catch (err) {
        console.error('Error cargando documentos del ramo', err)
        setFuente('nuevo')
      } finally {
        if (activo) setDocsLoading(false)
      }
    })()
    return () => { activo = false }
  }, [course.id])

  const toggleDocSeleccionado = (docId: string) => {
    setDocsSeleccionados(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const invalidos = files.filter(f => !getFileType(f.name))
    if (invalidos.length > 0) {
      toast.error('Solo se aceptan archivos PDF, DOCX, PPTX o XLSX.')
      return
    }
    // Se agregan a los ya seleccionados (permite ir sumando presentaciones de la maleta).
    setPdaFiles(prev => [...prev, ...files])
  }

  const quitarArchivo = (idx: number) => {
    setPdaFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const isBlockEnabled = (diaId: number, blockRegimen: string, sectionRegimen: string): boolean => {
    if (diaId === 6) {
      // Sábado es todo vespertino
      return blockRegimen === 'vespertino'
    }
    return blockRegimen === sectionRegimen
  }

  // Alterna un bloque del horario de la sección activa: vacío → cátedra → laboratorio → vacío.
  const toggleBlock = (diaId: number, bloqueId: string) => {
    if (!seccionActiva) return
    const b = BLOQUES_DUOC.find(item => item.id === bloqueId)
    if (b && !isBlockEnabled(diaId, b.regimen, seccionActiva.regimen)) return

    const key = `${diaId}-${bloqueId}`
    const copy = { ...seccionActiva.selectedBlocks }
    if (!copy[key]) {
      copy[key] = 'catedra'
    } else if (copy[key] === 'catedra') {
      copy[key] = 'laboratorio'
    } else {
      delete copy[key]
    }
    updateSeccion(seccionActiva.id, { selectedBlocks: copy })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Si aún no estamos en el último paso (ej: Enter en un input), avanzar en vez de generar.
    if (paso !== 3) {
      irSiguiente()
      return
    }

    if (!fechaInicioSemestre) {
      toast.error('Selecciona la fecha de inicio del semestre.')
      return
    }
    // Validar cada sección: nombre y al menos un bloque de horario.
    for (const s of secciones) {
      if (!s.nombre.trim()) {
        toast.error('Cada sección debe tener un nombre.')
        return
      }
      if (Object.keys(s.selectedBlocks).length === 0) {
        toast.error(`Marca al menos un bloque de horario para "${s.nombre}".`)
        return
      }
    }
    const nombres = secciones.map(s => s.nombre.trim().toLowerCase())
    if (new Set(nombres).size !== nombres.length) {
      toast.error('Hay secciones con el mismo nombre. Usa nombres distintos.')
      return
    }
    if (fuente === 'existentes' && docsSeleccionados.length === 0) {
      toast.error('Selecciona al menos un documento del ramo para calendarizar.')
      return
    }
    if (fuente === 'nuevo' && pdaFiles.length === 0) {
      toast.error('Por favor sube al menos un archivo del ramo.')
      return
    }

    setLoading(false)
    try {
      setLoading(true)

      // 1-2. Resolver el documento fuente del PDA según la fuente elegida.
      let documentId: string

      if (fuente === 'existentes') {
        // Combinar el texto de los documentos ya subidos al ramo (sin re-subir nada).
        const elegidos = docsRamo.filter(d => docsSeleccionados.includes(d.id))
        const contentText = elegidos
          .map(d => `=== DOCUMENTO: ${d.file_name} ===\n${d.content_text || ''}`)
          .join('\n\n')

        if (!contentText.trim()) {
          throw new Error('Los documentos seleccionados no contienen información suficiente para calendarizar.')
        }

        // Si es un único documento, usarlo directamente; si son varios, registrar un PDA combinado.
        if (elegidos.length === 1) {
          documentId = elegidos[0].id
        } else {
          const combinado = await supabase
            .from('course_documents')
            .insert({
              course_id: course.id,
              teacher_id: course.teacher_id,
              file_name: `PDA combinado (${elegidos.length} documentos)`,
              file_type: 'pdf',
              file_size: 0,
              file_path: '',
              content_text: contentText,
              uploaded_at: Date.now(),
              is_master_doc: true,
              master_doc_type: 'PDA'
            })
            .select('id')
            .single()
          if (!combinado.data?.id) throw new Error('Error al registrar el documento combinado del PDA.')
          documentId = combinado.data.id
        }
      } else {
        // Subir y procesar uno o varios archivos nuevos (PDA, o maleta didáctica de presentaciones).
        // Se extrae el texto de cada uno EN ORDEN y se concatena (cada archivo = una sesión/tema).
        const partes: string[] = []
        for (let idx = 0; idx < pdaFiles.length; idx++) {
          const f = pdaFiles[idx]
          try {
            const t = await extractTextFromFile(f)
            partes.push(`=== DOCUMENTO ${idx + 1}: ${f.name} ===\n${t}`)
          } catch (err: any) {
            console.error(`Error leyendo ${f.name}`, err)
            throw new Error(`No se pudo leer "${f.name}": ${err.message || 'archivo ilegible'}.`)
          }
        }
        const contentText = partes.join('\n\n')

        if (contentText.replace(/--- Página \d+ ---|=== DOCUMENTO.*===/g, '').trim().length < 100) {
          throw new Error(
            'Los archivos no contienen texto legible. Probablemente son PDF escaneados (imagen). ' +
            'Sube versiones con texto seleccionable.'
          )
        }

        // Subir el primer archivo a storage como referencia física del documento maestro.
        const primero = pdaFiles[0]
        const fileExt = primero.name.split('.').pop()?.toLowerCase() || 'pdf'
        const storagePath = `${course.id}/${Date.now()}_PDA.${fileExt}`
        const uploadedPath = await DocumentsAPI.uploadFile(primero, storagePath)

        const nombreDoc = pdaFiles.length === 1 ? primero.name : `Maleta didáctica (${pdaFiles.length} archivos)`
        const docId = await supabase
          .from('course_documents')
          .insert({
            course_id: course.id,
            teacher_id: course.teacher_id,
            file_name: nombreDoc,
            file_type: fileExt,
            file_size: primero.size,
            file_path: uploadedPath,
            content_text: contentText,
            uploaded_at: Date.now(),
            is_master_doc: true,
            master_doc_type: 'PDA'
          })
          .select('id')
          .single()

        if (!docId.data?.id) throw new Error("Error al registrar el documento del ramo.")
        documentId = docId.data.id
      }

      // 3. Generar el calendario para CADA sección con su propio horario.
      // El contenido del PDA es el mismo; solo cambian días, horas y fechas por sección.
      // La primera sección analiza el PDA con IA; las demás reutilizan ese análisis (1 sola llamada).
      let totalClases = 0
      let contenidoSemanas: any[] | undefined = undefined

      for (let i = 0; i < secciones.length; i++) {
        const s = secciones[i]
        const keys = Object.keys(s.selectedBlocks)
        const diasUnicos = Array.from(new Set(keys.map(k => parseInt(k.split('-')[0])))).sort((a, b) => a - b)
        const bloquesUnicos = Array.from(new Set(keys.map(k => k.split('-')[1])))

        const diasTipo: Record<number, 'catedra' | 'laboratorio'> = {}
        Object.entries(s.selectedBlocks).forEach(([key, type]) => {
          const diaId = parseInt(key.split('-')[0])
          if (type === 'laboratorio') diasTipo[diaId] = 'laboratorio'
          else if (!diasTipo[diaId]) diasTipo[diaId] = 'catedra'
        })

        // Cada combinación (día, tipo) es una sesión distinta (cátedra y laboratorio por separado).
        // Para cada grupo guardamos el módulo más temprano y el más tardío (para las horas).
        const rangoPorGrupo = new Map<string, { min: number; max: number }>()
        Object.entries(s.selectedBlocks).forEach(([key, type]) => {
          const [diaStr, bloqueStr] = key.split('-')
          const grupoKey = `${diaStr}-${type}`
          const modulo = parseInt(bloqueStr)
          const actual = rangoPorGrupo.get(grupoKey)
          if (!actual) rangoPorGrupo.set(grupoKey, { min: modulo, max: modulo })
          else rangoPorGrupo.set(grupoKey, { min: Math.min(actual.min, modulo), max: Math.max(actual.max, modulo) })
        })

        const sesionesHorario = Array.from(rangoPorGrupo.entries())
          .map(([grupoKey, rango]) => {
            const [diaStr, tipo] = grupoKey.split('-')
            return {
              dia: parseInt(diaStr),
              tipo: tipo as 'catedra' | 'laboratorio',
              orden: rango.min,
              hora_inicio: HORAS_MODULO[String(rango.min)]?.inicio || '',
              hora_fin: HORAS_MODULO[String(rango.max)]?.fin || '',
            }
          })
          .sort((a, b) => (a.dia - b.dia) || (a.orden - b.orden))
          .map(({ dia, tipo, hora_inicio, hora_fin }) => ({ dia, tipo, hora_inicio, hora_fin }))

        // Fecha de inicio única del semestre (común a todas las secciones).
        const [year, month, day] = fechaInicioSemestre.split('-').map(Number)
        const fechaInicioTs = new Date(year, month - 1, day, 12, 0, 0, 0).getTime()

        const result = await CalendarAPI.generateCalendarFromPDA({
          course_id: course.id,
          document_id: documentId,
          semestre: semestre,
          seccion: s.nombre.trim(),
          regimen: s.regimen,
          semanas_semestre: semanas,
          dias_semana: diasUnicos,
          bloques_horario: bloquesUnicos,
          dias_tipo: diasTipo,
          sesiones_horario: sesionesHorario,
          fecha_inicio: fechaInicioTs,
          teacher_id: course.teacher_id,
          // Solo limpiar todo el calendario al procesar la primera sección; el resto se agrega.
          replace_all: i === 0,
          // Reutilizar el temario ya analizado por la primera sección.
          contenido_semanas: contenidoSemanas,
          // Solo la primera sección analiza; se le pasa el inventario de pañol como referencia.
          inventario_panol: contenidoSemanas === undefined ? inventarioPanol : undefined
        })
        totalClases += result.count
        // Guardar el análisis de la primera sección para reutilizarlo en las siguientes.
        if (contenidoSemanas === undefined && result.semanas) contenidoSemanas = result.semanas
      }

      toast.success(`¡Planificación creada! Se generaron ${totalClases} clases en ${secciones.length} ${secciones.length === 1 ? 'sección' : 'secciones'}.`);
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

      {/* Indicador de pasos */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[
          { n: 1, label: 'Datos del ramo' },
          { n: 2, label: 'Secciones' },
          { n: 3, label: 'Horarios' },
        ].map((p, i) => (
          <div key={p.n} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              paso === p.n ? 'bg-indigo-600 text-white' : paso > p.n ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                paso >= p.n ? 'bg-white/20' : 'bg-slate-700'
              }`}>{paso > p.n ? '✓' : p.n}</span>
              {p.label}
            </div>
            {i < 2 && <div className={`w-6 h-0.5 ${paso > p.n ? 'bg-indigo-500' : 'bg-slate-700'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ===================== PASO 1: Datos comunes del ramo ===================== */}
        {paso === 1 && (
        <>
        {/* Campos compartidos por todas las secciones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Semestre</label>
            <select
              value={semestre}
              onChange={(e) => setSemestre(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {opcionesDeSemestre([semestre]).map(s => (
                <option key={s} value={s}>{formatSemestre(s)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Fecha de inicio del semestre</label>
            <input
              type="date"
              value={fechaInicioSemestre}
              onChange={(e) => setFechaInicioSemestre(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
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

        {/* Carga PDA */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Fuente del contenido (PDA)</label>

            {/* Selector de fuente */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-0.5 flex mb-3">
              <button
                type="button"
                onClick={() => setFuente('existentes')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                  fuente === 'existentes' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Documentos del ramo
              </button>
              <button
                type="button"
                onClick={() => setFuente('nuevo')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                  fuente === 'nuevo' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Subir nuevo
              </button>
            </div>

            {fuente === 'existentes' ? (
              <div className="border border-slate-800 bg-slate-950 rounded-lg p-3 space-y-2 max-h-56 overflow-y-auto">
                {docsLoading ? (
                  <div className="flex items-center justify-center gap-2 text-slate-500 text-sm py-4">
                    <Loader2 className="w-4 h-4 animate-spin" /> Cargando documentos del ramo...
                  </div>
                ) : docsRamo.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm py-4">
                    Este ramo no tiene documentos de contexto IA cargados.{' '}
                    <button type="button" onClick={() => setFuente('nuevo')} className="text-indigo-400 hover:text-indigo-300 font-semibold">
                      Sube uno nuevo
                    </button>.
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-500 mb-1">
                      Selecciona el/los documento(s) que describen el temario semanal. Si eliges varios, se combinan.
                    </p>
                    {docsRamo.map((doc) => {
                      const sel = docsSeleccionados.includes(doc.id)
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => toggleDocSeleccionado(doc.id)}
                          className={`w-full flex items-center gap-2 text-left p-2 rounded-lg border transition-all ${
                            sel ? 'bg-indigo-500/10 border-indigo-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            sel ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'
                          }`}>
                            {sel && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-slate-200 font-medium truncate">{doc.file_name}</p>
                            <p className="text-[10px] text-slate-500">
                              {doc.master_doc_type ? `Maestro: ${doc.master_doc_type}` : 'Documento'} · {(doc.content_text?.length || 0).toLocaleString()} caracteres
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950 rounded-lg p-4 cursor-pointer transition-all"
                >
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <span className="text-slate-300 text-sm font-medium">
                    {pdaFiles.length > 0 ? `${pdaFiles.length} archivo(s) seleccionado(s) — agregar más` : 'Selecciona o arrastra el PDA'}
                  </span>
                  <span className="text-slate-500 text-xs mt-1">PDF, DOCX, PPTX o XLSX. Puedes subir varias presentaciones (maleta didáctica): cada una será una sesión, en orden.</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx,.pptx,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Lista ordenada de archivos (el orden = orden de sesiones) */}
                {pdaFiles.length > 0 && (
                  <div className="space-y-1">
                    {pdaFiles.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
                        <span className="text-[10px] text-slate-500 font-mono w-5 shrink-0">{idx + 1}.</span>
                        <span className="text-sm text-slate-200 truncate flex-1">{f.name}</span>
                        <button type="button" onClick={() => quitarArchivo(idx)} className="text-slate-500 hover:text-red-400 shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </>
        )}

        {/* ===================== PASO 2: Secciones ===================== */}
        {paso === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">¿Cuántas secciones tiene este ramo?</label>
              <input
                type="number"
                min={1}
                max={20}
                value={secciones.length}
                onChange={(e) => setCantidadSecciones(parseInt(e.target.value))}
                className="w-32 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-slate-500 text-xs mt-1">Todas comparten el mismo contenido (PDA); en el siguiente paso defines el horario de cada una.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-slate-400 text-xs font-medium">Nombres / números de las secciones</label>
              {secciones.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-16 shrink-0">Sección {i + 1}</span>
                  <input
                    type="text"
                    placeholder="Ej: 001D"
                    value={s.nombre}
                    onChange={(e) => updateSeccion(s.id, { nombre: e.target.value })}
                    className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  {secciones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarSeccion(s.id)}
                      title="Eliminar sección"
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={agregarSeccion}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition-all mt-1"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar otra sección
              </button>
            </div>
          </div>
        )}

        {/* ===================== PASO 3: Horarios por sección ===================== */}
        {paso === 3 && seccionActiva && (
        <>
        {/* Navegación entre secciones */}
        <div className="flex flex-wrap gap-2">
          {secciones.map((s) => {
            const completa = Object.keys(s.selectedBlocks).length > 0
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSeccionActivaId(s.id)}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  s.id === seccionActiva.id
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {completa ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-2 h-2 rounded-full bg-slate-600" />}
                {s.nombre || 'Sin nombre'}
              </button>
            )
          })}
        </div>

        {/* Régimen de la sección activa (la fecha de inicio es común al semestre, en el paso 1) */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-3">
          <label className="block text-slate-400 text-xs font-medium mb-1">Régimen de {seccionActiva.nombre || 'la sección'}</label>
          <div className="flex gap-2 max-w-xs">
            <button
              type="button"
              onClick={() => updateSeccion(seccionActiva.id, { regimen: 'diurno' })}
              className={`flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                seccionActiva.regimen === 'diurno'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              Diurno
            </button>
            <button
              type="button"
              onClick={() => updateSeccion(seccionActiva.id, { regimen: 'vespertino' })}
              className={`flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                seccionActiva.regimen === 'vespertino'
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              Vespertino
            </button>
          </div>
        </div>

        {/* Grilla Horaria Semanal */}
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <label className="block text-slate-300 text-sm font-medium">
              Horario Semanal
              {seccionActiva && (
                <span className="ml-2 text-xs font-normal text-indigo-300">
                  · editando <span className="font-semibold">{seccionActiva.nombre || 'sección'}</span>
                </span>
              )}
            </label>

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
                      const enabled = isBlockEnabled(d.id, b.regimen, seccionActiva.regimen)
                      const blockType = seccionActiva?.selectedBlocks[`${d.id}-${b.id}`]

                      let btnClass = 'bg-transparent border-slate-800 text-slate-500 hover:border-slate-700'
                      let label = '-'

                      if (!enabled) {
                        btnClass = 'bg-slate-950/40 border-slate-900/60 text-slate-700 opacity-25 cursor-not-allowed'
                        label = 'OFF'
                      } else if (blockType === 'catedra') {
                        btnClass = 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300 font-bold shadow-[0_0_10px_rgba(99,102,241,0.1)]'
                        label = 'Cátedra'
                      } else if (blockType === 'laboratorio') {
                        btnClass = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                        label = 'Lab'
                      }

                      const titleText = !enabled
                        ? (d.id === 6 ? 'El sábado sólo permite régimen vespertino' : `Bloque no disponible para régimen ${seccionActiva.regimen}`)
                        : (blockType === 'laboratorio' ? 'Laboratorio / Práctico' : blockType === 'catedra' ? 'Cátedra' : 'Vacío')

                      return (
                        <td key={d.id} className="p-2">
                          <button
                            type="button"
                            disabled={!enabled}
                            onClick={() => toggleBlock(d.id, b.id)}
                            title={titleText}
                            className={`w-full min-w-[64px] py-2 px-1 text-center rounded border transition-all text-[11px] whitespace-nowrap truncate ${btnClass}`}
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
        </>
        )}

        {/* Barra de navegación del wizard */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setPaso(p => (Math.max(1, p - 1) as 1 | 2 | 3))}
            disabled={paso === 1 || loading}
            className="py-2.5 px-5 rounded-lg border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Anterior
          </button>

          {paso < 3 ? (
            <button
              type="button"
              onClick={irSiguiente}
              className="py-2.5 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg"
            >
              Siguiente
            </button>
          ) : (
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
                  <span>Generar Planificación ({secciones.length} {secciones.length === 1 ? 'sección' : 'secciones'})</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
