import { supabase } from '../lib/supabase'
import { parsearInformacionDocente } from './maletaDidacticaService'
import type { EstructuraMaletaDidactica } from './maletaDidacticaService'

/**
 * Fecha oficial de inicio de clases según el Calendario Académico de Duoc UC para el Segundo Semestre 2026.
 * Siempre debe iniciar desde esta fecha fija (Segundo lunes de agosto de 2026).
 */
export const FECHA_INICIO_OFICIAL_2026_2 = '2026-08-10'

export interface FeriadoDuoc {
  fecha: string
  nombre: string
  media_jornada: boolean
  hora_limite?: string
}

/**
 * Calendario Oficial de Feriados y Suspensiones Institucionales de Duoc UC 2026
 */
export const FERIADOS_DUOC_2026: FeriadoDuoc[] = [
  { fecha: '2026-04-02', nombre: 'Víspera de Semana Santa (Suspensión desde 13:00 Hrs)', media_jornada: true, hora_limite: '13:00' },
  { fecha: '2026-04-03', nombre: 'Semana Santa (Viernes Santo)', media_jornada: false },
  { fecha: '2026-04-04', nombre: 'Semana Santa (Sábado Santo)', media_jornada: false },
  { fecha: '2026-05-01', nombre: 'Día del Trabajo', media_jornada: false },
  { fecha: '2026-05-21', nombre: 'Día de las Glorias Navales', media_jornada: false },
  { fecha: '2026-06-21', nombre: 'Día Nacional de los Pueblos Indígenas', media_jornada: false },
  { fecha: '2026-06-29', nombre: 'San Pedro y San Pablo', media_jornada: false },
  { fecha: '2026-07-16', nombre: 'Día de la Virgen del Carmen', media_jornada: false },
  { fecha: '2026-08-15', nombre: 'Asunción de la Virgen', media_jornada: false },
  { fecha: '2026-09-17', nombre: 'Víspera de Fiestas Patrias (Suspensión desde 13:00 Hrs)', media_jornada: true, hora_limite: '13:00' },
  { fecha: '2026-09-18', nombre: 'Fiestas Patrias', media_jornada: false },
  { fecha: '2026-09-19', nombre: 'Glorias del Ejército', media_jornada: false },
  { fecha: '2026-10-12', nombre: 'Encuentro de Dos Mundos', media_jornada: false },
  { fecha: '2026-10-31', nombre: 'Día de las Iglesias Evangélicas y Protestantes', media_jornada: false },
  { fecha: '2026-11-01', nombre: 'Día de Todos los Santos', media_jornada: false },
  { fecha: '2026-11-11', nombre: 'Aniversario Duoc UC (Suspensión desde las 15:15 Hrs)', media_jornada: true, hora_limite: '15:15' },
  { fecha: '2026-12-08', nombre: 'Inmaculada Concepción', media_jornada: false },
  { fecha: '2026-12-24', nombre: 'Víspera de Navidad (Suspensión desde 13:00 Hrs)', media_jornada: true, hora_limite: '13:00' },
  { fecha: '2026-12-25', nombre: 'Día de Navidad', media_jornada: false }
]

export interface SesionHorarioConfig {
  dia: number // 1: Lunes, 2: Martes, 3: Miércoles, 4: Jueves, 5: Viernes, 6: Sábado
  tipo: 'catedra' | 'laboratorio'
  hora_inicio?: string
  hora_fin?: string
}

export interface PlanificacionParams {
  courseId: string
  teacherId: string
  seccion: string
  semestre?: string
  fechaInicioIso?: string // '2026-08-10'
  regimen?: 'diurno' | 'vespertino'
  sesionesHorario: SesionHorarioConfig[]
  inventarioPanol?: string[]
}

export interface ClasePlanificadaGenerada {
  semana: number
  sesion: number
  fecha: number // ms epoch
  fecha_str: string // YYYY-MM-DD
  titulo: string
  contenido: string
  actividades?: string
  materiales_requeridos?: string
  tiene_evaluacion: boolean
  tipo_evaluacion?: 'prueba' | 'trabajo' | 'informe'
  titulo_evaluacion?: string
  numero_evaluacion?: string
  ponderacion?: number
  es_formativa?: boolean
  es_feriado: boolean
  detalle_feriado?: string
  estado: 'programada' | 'suspendida'
  tipo_bloque: 'catedra' | 'laboratorio' | 'evaluacion'
  hora_inicio?: string
  hora_fin?: string
}

export interface ResultadoGeneracionPlanificacion {
  success: boolean
  totalClases: number
  totalSemanas: number
  clases: ClasePlanificadaGenerada[]
  documentosEncontrados: {
    pa: boolean
    pda: boolean
    pia: boolean
    completo: boolean
    faltantes: string[]
  }
  mensaje: string
}

/**
 * Convierte un objeto Date a string YYYY-MM-DD
 */
export function stringifyDateLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Obtiene el lunes de la semana que contiene una fecha
 */
export function getMondayOfDate(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  monday.setHours(12, 0, 0, 0)
  return monday
}

/**
 * Obtiene la fecha (a las 12:00) del día de la semana `dayOfWeek` (1=Lunes..6=Sábado)
 * correspondiente a la semana cuyo lunes es `mondayTs`.
 */
export function getDateOfDayInWeek(mondayTs: number, dayOfWeek: number): number {
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const d = new Date(mondayTs)
  d.setDate(d.getDate() + offset)
  d.setHours(12, 0, 0, 0)
  return d.getTime()
}

/**
 * Genera el plan curricular oficial de 18 semanas de clases para una sección.
 */
export async function generarPlanificacion18Semanas(params: PlanificacionParams): Promise<ResultadoGeneracionPlanificacion> {
  const fechaInicioStr = params.fechaInicioIso || FECHA_INICIO_OFICIAL_2026_2
  const [y, m, d] = fechaInicioStr.split('-').map(Number)
  const baseStartDate = new Date(y, m - 1, d, 12, 0, 0, 0)
  const startMonday = getMondayOfDate(baseStartDate)

  // 1. Verificar documentos maestros en course_documents
  const { data: docs } = await supabase
    .from('course_documents')
    .select('id, file_name, master_doc_type, is_master_doc, content_text')
    .eq('course_id', params.courseId)

  let paDoc = false
  let pdaDoc = false
  let piaDoc = false
  let estructuraMaleta: EstructuraMaletaDidactica | null = null

  if (docs && docs.length > 0) {
    const combinedText = docs.map(doc => `=== ${doc.file_name} ===\n${doc.content_text || ''}`).join('\n\n')
    const combinedNames = docs.map(doc => doc.file_name).join(' ')
    estructuraMaleta = parsearInformacionDocente(combinedText, combinedNames)

    paDoc = docs.some(d => d.master_doc_type === 'PA' || d.file_name.toUpperCase().includes('PA'))
    pdaDoc = docs.some(d => d.master_doc_type === 'PDA' || d.file_name.toUpperCase().includes('PDA'))
    piaDoc = docs.some(d => d.master_doc_type === 'PIA' || d.file_name.toUpperCase().includes('PIA'))
  }

  const faltantes: string[] = []
  if (!pdaDoc) faltantes.push('PDA')
  if (!piaDoc) faltantes.push('PIA')
  if (!paDoc) faltantes.push('PA')
  const docsCompletos = faltantes.length === 0

  // 2. Definir sesiones horarias por semana
  // Si no se proporcionaron sesiones específicas, se asumen por defecto Lunes (Cátedra) y Miércoles (Laboratorio)
  const sesionesHorario = params.sesionesHorario && params.sesionesHorario.length > 0
    ? params.sesionesHorario
    : [
        { dia: 1, tipo: 'catedra' as const, hora_inicio: '08:30', hora_fin: '10:40' },
        { dia: 3, tipo: 'laboratorio' as const, hora_inicio: '08:30', hora_fin: '10:40' }
      ]

  const clasesGeneradas: ClasePlanificadaGenerada[] = []
  let correlativoSesion = 1

  // Si una evaluación cae en feriado, se guarda para dictarse en la siguiente sesión hábil
  let evaluacionPendienteFeriado: {
    titulo: string
    tipo_evaluacion: 'prueba' | 'trabajo' | 'informe'
    titulo_evaluacion: string
    numero_evaluacion: string
    ponderacion: number
    es_formativa: boolean
    semanaOriginal: number
  } | null = null

  // 3. Proyectar las 18 Semanas
  const TOTAL_SEMANAS = 18

  for (let semana = 1; semana <= TOTAL_SEMANAS; semana++) {
    const mondayTs = startMonday.getTime() + (semana - 1) * 7 * 24 * 60 * 60 * 1000
    let evaluacionSemanaAsignada = false

    // Identificar hitos pedagógicos oficiales según semana
    let esSemanaFormativa = false
    let numFormativa = 0
    let esExamen = false
    let esRecuperacion = false

    if (semana === 5) {
      esSemanaFormativa = true
      numFormativa = 1
    } else if (semana === 10) {
      esSemanaFormativa = true
      numFormativa = 2
    } else if (semana === 15) {
      esSemanaFormativa = true
      numFormativa = 3
    } else if (semana === 16 || semana === 17) {
      esExamen = true
    } else if (semana === 18) {
      esRecuperacion = true
    }

    // Para cada sesión de la semana según el horario
    for (let slotIdx = 0; slotIdx < sesionesHorario.length; slotIdx++) {
      const slot = sesionesHorario[slotIdx]
      const cleanTs = getDateOfDayInWeek(mondayTs, slot.dia)
      const dateObj = new Date(cleanTs)
      const dateStr = stringifyDateLocal(dateObj)
      const feriado = FERIADOS_DUOC_2026.find(f => f.fecha === dateStr)

      // Verificar suspensión por feriado o media jornada institucional
      let suspenderClase = false
      if (feriado) {
        if (feriado.media_jornada && feriado.hora_limite) {
          // Si el horario inicia después o en la hora límite, suspender
          const horaClase = slot.hora_inicio || '14:00'
          suspenderClase = horaClase >= feriado.hora_limite || params.regimen === 'vespertino'
        } else {
          suspenderClase = true
        }
      }

      // Determinar si esta sesión debería llevar la evaluación formativa / examen de la semana
      // La evaluación se asigna a la última sesión hábil de la semana para dar tiempo a preparar
      const esUltimaSesionDeSemana = slotIdx === sesionesHorario.length - 1
      const leTocaEvaluacion = (esSemanaFormativa || esExamen) && !evaluacionSemanaAsignada && (esUltimaSesionDeSemana || slot.tipo === 'laboratorio')

      // A. Manejo de Feriado o Suspensión Oficial
      if (suspenderClase && feriado) {
        if (leTocaEvaluacion) {
          evaluacionSemanaAsignada = true
          evaluacionPendienteFeriado = {
            titulo: esSemanaFormativa ? `Evaluación Formativa ${numFormativa}` : `Examen Transversal`,
            tipo_evaluacion: esSemanaFormativa ? (numFormativa === 1 ? 'prueba' : 'trabajo') : 'informe',
            titulo_evaluacion: esSemanaFormativa ? `Formativa ${numFormativa}` : `Examen Transversal`,
            numero_evaluacion: esSemanaFormativa ? `Formativa ${numFormativa}` : `ET`,
            ponderacion: 0,
            es_formativa: esSemanaFormativa,
            semanaOriginal: semana
          }
        }

        clasesGeneradas.push({
          semana,
          sesion: correlativoSesion,
          fecha: cleanTs,
          fecha_str: dateStr,
          titulo: `Feriado Oficial: ${feriado.nombre}`,
          contenido: leTocaEvaluacion
            ? `Clase suspendida por feriado institucional. La evaluación planificada se reagenda automáticamente para la siguiente clase hábil.`
            : `Sin actividad docente presencial según Calendario Académico de Duoc UC (${feriado.nombre}).`,
          tiene_evaluacion: false,
          es_feriado: true,
          detalle_feriado: feriado.nombre,
          estado: 'suspendida',
          tipo_bloque: slot.tipo,
          hora_inicio: slot.hora_inicio,
          hora_fin: slot.hora_fin
        })
        correlativoSesion++
        continue
      }

      // B. Si había una evaluación pendiente por un feriado anterior, tomarla con prioridad
      if (evaluacionPendienteFeriado) {
        clasesGeneradas.push({
          semana,
          sesion: correlativoSesion,
          fecha: cleanTs,
          fecha_str: dateStr,
          titulo: `${evaluacionPendienteFeriado.titulo} (Reprogramada por Feriado)`,
          contenido: `Rendición de ${evaluacionPendienteFeriado.titulo} reprogramada de la semana ${evaluacionPendienteFeriado.semanaOriginal} por suspensión de feriado.`,
          actividades: 'Aplicación de instrumento de evaluación y retroalimentación formativa inmediata.',
          tiene_evaluacion: true,
          tipo_evaluacion: evaluacionPendienteFeriado.tipo_evaluacion,
          titulo_evaluacion: evaluacionPendienteFeriado.titulo_evaluacion,
          numero_evaluacion: evaluacionPendienteFeriado.numero_evaluacion,
          ponderacion: evaluacionPendienteFeriado.ponderacion,
          es_formativa: evaluacionPendienteFeriado.es_formativa,
          es_feriado: false,
          estado: 'programada',
          tipo_bloque: 'evaluacion',
          hora_inicio: slot.hora_inicio,
          hora_fin: slot.hora_fin
        })
        evaluacionPendienteFeriado = null
        correlativoSesion++
        continue
      }

      // C. Sesión de Semana 18 (Recuperaciones y Cierre)
      if (esRecuperacion) {
        const esSesion1 = slotIdx === 0
        clasesGeneradas.push({
          semana: 18,
          sesion: correlativoSesion,
          fecha: cleanTs,
          fecha_str: dateStr,
          titulo: esSesion1
            ? 'Semana 18: Evaluaciones Recuperativas y Rezagados'
            : 'Semana 18: Cierre de Semestre y Firma de Actas Oficiales',
          contenido: esSesion1
            ? 'Atención a estudiantes con evaluaciones atrasadas o justificadas según reglamento académico. Revisión de notas pendientes.'
            : 'Consolidación de calificaciones finales, resolución de dudas de promedios y entrega de actas oficiales del curso.',
          actividades: esSesion1
            ? 'Rendición de instrumentos recuperativos en taller/laboratorio.'
            : 'Entrevista individual de cierre y verificación de libro de clases.',
          tiene_evaluacion: false,
          es_feriado: false,
          estado: 'programada',
          tipo_bloque: slot.tipo,
          hora_inicio: slot.hora_inicio,
          hora_fin: slot.hora_fin
        })
        correlativoSesion++
        continue
      }

      // D. Sesión con Evaluación Formativa o Examen Transversal
      if (leTocaEvaluacion) {
        evaluacionSemanaAsignada = true

        if (esSemanaFormativa) {
          const eaAsociada = numFormativa === 1 ? 'EA 1' : numFormativa === 2 ? 'EA 2' : 'EA 3'
          clasesGeneradas.push({
            semana,
            sesion: correlativoSesion,
            fecha: cleanTs,
            fecha_str: dateStr,
            titulo: `Semana ${semana}: Evaluación Formativa ${numFormativa} (${eaAsociada})`,
            contenido: `Comprobación del logro de competencias de la ${eaAsociada}. Evaluación formativa diagnóstica y aplicación práctica para retroalimentación docente.`,
            actividades: `Rendición de la Evaluación Formativa ${numFormativa}. Discusión plenaria de aciertos y oportunidades de mejora antes de la evaluación sumativa.`,
            materiales_requeridos: 'Pauta de evaluación formativa, instrumento de verificación de Indicadores de Logro.',
            tiene_evaluacion: true,
            tipo_evaluacion: numFormativa === 1 ? 'prueba' : 'trabajo',
            titulo_evaluacion: `Evaluación Formativa ${numFormativa}`,
            numero_evaluacion: `Formativa ${numFormativa}`,
            ponderacion: 0,
            es_formativa: true,
            es_feriado: false,
            estado: 'programada',
            tipo_bloque: 'evaluacion',
            hora_inicio: slot.hora_inicio,
            hora_fin: slot.hora_fin
          })
        } else if (esExamen) {
          const parteExamen = semana === 16 ? 'Parte 1 (Desarrollo y Entrega de Proyecto)' : 'Parte 2 (Defensa y Cierre Técnico)'
          clasesGeneradas.push({
            semana,
            sesion: correlativoSesion,
            fecha: cleanTs,
            fecha_str: dateStr,
            titulo: `Semana ${semana}: Examen Transversal - ${parteExamen}`,
            contenido: `Aplicación del Examen Transversal de la asignatura. Integración holística de competencias formativas desarrolladas en el semestre.`,
            actividades: `Ejecución de la pauta del Examen Transversal en ambiente de taller/laboratorio.`,
            materiales_requeridos: 'Pauta de Examen Transversal Duoc UC, rúbrica de desempeño institucional.',
            tiene_evaluacion: true,
            tipo_evaluacion: 'informe',
            titulo_evaluacion: `Examen Transversal (${parteExamen})`,
            numero_evaluacion: `ET-S${semana}`,
            ponderacion: 40,
            es_formativa: false,
            es_feriado: false,
            estado: 'programada',
            tipo_bloque: 'evaluacion',
            hora_inicio: slot.hora_inicio,
            hora_fin: slot.hora_fin
          })
        }

        correlativoSesion++
        continue
      }

      // E. Sesión Normal de Cátedra o Laboratorio
      // Definir qué EA corresponde según la semana
      let eaCodigo = 'EA 1'
      let eaNombre = 'Fundamentos e Identificación de Riesgos'
      if (semana >= 6 && semana <= 10) {
        eaCodigo = 'EA 2'
        eaNombre = 'Operaciones de Mantenimiento e Instalaciones'
      } else if (semana >= 11 && semana <= 15) {
        eaCodigo = 'EA 3'
        eaNombre = 'Mantenimiento Preventivo, Predictivo y Proyecto'
      }

      // Si tenemos estructura de maleta didáctica, enriquecer con los títulos reales
      if (estructuraMaleta && estructuraMaleta.experiencias.length > 0) {
        const eaIdx = semana <= 5 ? 0 : semana <= 10 ? 1 : 2
        const exp = estructuraMaleta.experiencias[eaIdx] || estructuraMaleta.experiencias[0]
        if (exp) {
          eaCodigo = exp.codigo
          eaNombre = exp.titulo
        }
      }

      const esLab = slot.tipo === 'laboratorio'
      const tipoLabel = esLab ? 'Taller / Laboratorio' : 'Cátedra / Teoría'

      clasesGeneradas.push({
        semana,
        sesion: correlativoSesion,
        fecha: cleanTs,
        fecha_str: dateStr,
        titulo: `Semana ${semana} (${tipoLabel}): ${eaCodigo} - ${eaNombre}`,
        contenido: esLab
          ? `Actividad práctica guiada y desarrollo de destrezas operativas de la ${eaCodigo}. Aplicación directa de normativas y estándares.`
          : `Fundamentos conceptuales, marco normativo y análisis de situaciones técnicas asociadas a la ${eaCodigo}.`,
        actividades: esLab
          ? `Taller práctico en sala de laboratorio: verificación instrumental, simulación y montaje.`
          : `Cátedra expositiva interactiva, estudio de casos reales y resolución de problemas guiados.`,
        materiales_requeridos: esLab
          ? 'Guías de laboratorio, instrumentos de medición, EPP de seguridad industrial.'
          : 'Presentación PPT de la unidad, pauta de casos de estudio.',
        tiene_evaluacion: false,
        es_feriado: false,
        estado: 'programada',
        tipo_bloque: slot.tipo,
        hora_inicio: slot.hora_inicio,
        hora_fin: slot.hora_fin
      })

      correlativoSesion++
    }
  }

  // 4. Guardar en Base de Datos Supabase
  // A. Actualizar configuración del curso
  const scheduleConfig = {
    semestre: params.semestre || '2026-2',
    fecha_inicio: baseStartDate.getTime(),
    fecha_inicio_iso: fechaInicioStr,
    semanas_semestre: TOTAL_SEMANAS,
    seccion: params.seccion,
    regimen: params.regimen || 'diurno',
    sesiones_horario: sesionesHorario,
    generado_automatico: true,
    documentos_verificados: docsCompletos
  }

  await supabase
    .from('courses')
    .update({ schedule_config: scheduleConfig, semester: params.semestre || '2026-2' })
    .eq('id', params.courseId)

  // B. Limpiar clases previas de la sección
  await supabase
    .from('clases_calendarizadas')
    .delete()
    .eq('course_id', params.courseId)
    .eq('section', params.seccion)

  // C. Limpiar evaluaciones previas de la sección
  await supabase
    .from('evaluaciones')
    .delete()
    .eq('course_id', params.courseId)
    .eq('section', params.seccion)

  // D. Insertar evaluaciones formativas y exámenes en la tabla `evaluaciones`
  for (const c of clasesGeneradas) {
    if (c.tiene_evaluacion && c.titulo_evaluacion) {
      const { data: evalInserted, error: evalErr } = await supabase
        .from('evaluaciones')
        .insert({
          course_id: params.courseId,
          teacher_id: params.teacherId,
          section: params.seccion,
          titulo: c.titulo_evaluacion,
          tipo: c.tipo_evaluacion || 'prueba',
          descripcion: `${c.titulo}. ${c.contenido}`,
          fecha: c.fecha,
          puntos: c.es_formativa ? 100 : (c.ponderacion || 40) * 10,
          activo: true,
          created_at: Date.now()
        })
        .select()
        .single()

      if (!evalErr && evalInserted) {
        ;(c as any).evaluacion_id = evalInserted.id
      }
    }
  }

  // E. Insertar clases en `clases_calendarizadas`
  const payloads = clasesGeneradas.map((c) => ({
    course_id: params.courseId,
    section: params.seccion,
    semana: c.semana,
    sesion: c.sesion,
    fecha: c.fecha,
    titulo: c.titulo,
    contenido: c.contenido,
    actividades: c.actividades || null,
    materiales_requeridos: c.materiales_requeridos || null,
    tiene_evaluacion: c.tiene_evaluacion,
    evaluacion_id: (c as any).evaluacion_id || null,
    es_feriado: c.es_feriado,
    detalle_feriado: c.detalle_feriado || null,
    estado: c.estado,
    tipo_bloque: c.tipo_bloque,
    hora_inicio: c.hora_inicio || null,
    hora_fin: c.hora_fin || null,
    created_at: new Date().toISOString()
  }))

  const { error: batchErr } = await supabase.from('clases_calendarizadas').insert(payloads)
  if (batchErr) {
    console.warn('[calendarPlannerService] Error en inserción en lote, reintentando una a una:', batchErr)
    for (const p of payloads) {
      const { error: singleErr } = await supabase.from('clases_calendarizadas').insert(p)
      if (singleErr) {
        console.error(`[calendarPlannerService] Error insertando clase semana ${p.semana} sesión ${p.sesion}:`, singleErr)
      }
    }
  }

  // Despachar eventos para refrescar UI
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('questia:clases_updated'))
    window.dispatchEvent(new Event('questia:evaluaciones_updated'))
  }

  let mensaje = `Planificación oficial de 18 semanas generada exitosamente (${clasesGeneradas.length} sesiones).`
  if (!docsCompletos) {
    mensaje += ` ⚠️ Atención: Faltan documentos oficiales (${faltantes.join(', ')}). Por favor súbelos para que los contenidos de cada sesión se enriquezcan automáticamente.`
  }

  return {
    success: true,
    totalClases: clasesGeneradas.length,
    totalSemanas: TOTAL_SEMANAS,
    clases: clasesGeneradas,
    documentosEncontrados: {
      pa: paDoc,
      pda: pdaDoc,
      pia: piaDoc,
      completo: docsCompletos,
      faltantes
    },
    mensaje
  }
}
