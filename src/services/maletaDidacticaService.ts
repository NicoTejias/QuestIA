import { supabase } from '../lib/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface ExperienciaAprendizaje {
  id: string
  numero: number
  codigo: string // ej: "EA 1"
  titulo: string
  descripcion?: string
  horas?: number
  ambiente?: string
  indicadoresLogro?: string[]
  actividades?: string[]
}

export interface EvaluacionOficialMaleta {
  id: string
  titulo: string
  situacionEvaluativa?: string
  tipo: 'prueba' | 'trabajo' | 'informe'
  esFormativa: boolean
  ponderacionParcial: number // ej 15, 35
  ponderacionFinal?: number // ej 60%, 40% ET
  eaAsociada?: string // ej: "EA 1"
  semanaSugerida?: number
  criteriosEvaluacion?: string
}

export interface EstructuraMaletaDidactica {
  sigla: string
  nombreAsignatura: string
  carrera?: string
  horasTotales?: number
  semanasProgramacion?: number
  experiencias: ExperienciaAprendizaje[]
  evaluaciones: EvaluacionOficialMaleta[]
  documentosEncontrados: {
    pa?: boolean
    pda?: boolean
    pia?: boolean
  }
}

/**
 * Modelos de Gemini en cascada de acuerdo a las reglas de QuestIA:
 * 1. gemini-3-flash-preview (prioritario para contenido académico)
 * 2. Fallbacks automáticos ante 429/503
 */
const MODELOS_CASCADA = [
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
]

/**
 * Parser determinista y extracción heurística del texto de documentos de la Maleta Didáctica Duoc UC
 */
export function parsearInformacionDocente(contentText: string, fileName: string = ''): EstructuraMaletaDidactica {
  const fullText = (fileName + '\n' + contentText).trim()

  // 1. Extraer Sigla y Nombre de Asignatura
  let sigla = ''
  let nombreAsignatura = ''

  const siglaMatch = fullText.match(/\b([A-Z]{3,4}\d{4})\b/)
  if (siglaMatch) {
    sigla = siglaMatch[1]
  }

  const nombreMatch = fullText.match(/(?:DIBUJO DE PLANOS EL[EÉ]CTRICOS|MANTENIMIENTO DE INSTALACIONES|GESTI[OÓ]N DE PROYECTOS|INSTALACIONES EL[EÉ]CTRICAS|PINTURA|M[AÁ]QUINAS EL[EÉ]CTRICAS)/i)
  if (nombreMatch) {
    nombreAsignatura = nombreMatch[0].toUpperCase()
  } else if (sigla) {
    const lineWithSigla = fullText.split('\n').find(l => l.includes(sigla))
    if (lineWithSigla) {
      nombreAsignatura = lineWithSigla.replace(sigla, '').replace(/[-_.:]/g, ' ').trim()
    }
  }

  // 2. Extraer Horas Totales y Semanas
  let horasTotales = 72
  let semanasProgramacion = 18

  const horasMatch = fullText.match(/Horas\s+Totales\s+(\d+)/i) || fullText.match(/(\d+)\s+Horas\s+Totales/i)
  if (horasMatch) horasTotales = parseInt(horasMatch[1], 10)

  const semMatch = fullText.match(/N°\s*de\s*Semanas\s*de\s*Programaci[oó]n\s*(\d+)/i) || fullText.match(/(\d+)\s*Semanas/i)
  if (semMatch) semanasProgramacion = parseInt(semMatch[1], 10)

  // 3. Extraer Experiencias de Aprendizaje (EAs)
  const experiencias: ExperienciaAprendizaje[] = []
  const eaRegex = /EA\s*(\d+)\s*[-–:]\s*([^\n\r]+?)(?=(?:Horas|Laboratorio|Eva|EA\s*\d+|EXAMEN|\n\s*\n|$))/gi
  let eaMatch: RegExpExecArray | null

  // Búsqueda detallada de EAs
  const eaFound = new Set<number>()
  while ((eaMatch = eaRegex.exec(fullText)) !== null) {
    const num = parseInt(eaMatch[1], 10)
    if (!eaFound.has(num)) {
      eaFound.add(num)
      const rawTitle = eaMatch[2].replace(/\s+/g, ' ').trim()
      experiencias.push({
        id: `ea-${num}`,
        numero: num,
        codigo: `EA ${num}`,
        titulo: rawTitle,
        ambiente: 'Laboratorio de PC',
        horas: num === 1 ? 20 : 24,
      })
    }
  }

  // Si no se capturaron por regex estricto, buscar patrones conocidos de Duoc
  if (experiencias.length === 0) {
    if (fullText.includes('Historia y fundamentos del dibujo técnico')) {
      experiencias.push({
        id: 'ea-1',
        numero: 1,
        codigo: 'EA 1',
        titulo: 'Historia y fundamentos del dibujo técnico',
        horas: 20,
        ambiente: 'Laboratorio de PC',
      })
    }
    if (fullText.includes('Fundamentos y normas básicas de dibujo eléctrico')) {
      experiencias.push({
        id: 'ea-2',
        numero: 2,
        codigo: 'EA 2',
        titulo: 'Fundamentos y normas básicas de dibujo eléctrico, aplicables a AutoCAD',
        horas: 24,
        ambiente: 'Laboratorio de PC',
      })
    }
    if (fullText.includes('Elaboración de proyectos eléctricos')) {
      experiencias.push({
        id: 'ea-3',
        numero: 3,
        codigo: 'EA 3',
        titulo: 'Elaboración de proyectos eléctricos normalizados en AutoCAD',
        horas: 24,
        ambiente: 'Laboratorio de PC',
      })
    }
  }

  // 4. Extraer Evaluaciones Oficiales y Ponderaciones
  const evaluaciones: EvaluacionOficialMaleta[] = []

  // Parcial 1
  if (fullText.match(/Parcial\s*1/i)) {
    const pesoMatch = fullText.match(/Parcial\s*1.*?(\d{1,2})%/is)
    const ponderacion = pesoMatch ? parseInt(pesoMatch[1], 10) : 15
    evaluaciones.push({
      id: 'eval-parcial-1',
      titulo: 'Evaluación Parcial 1',
      situacionEvaluativa: 'Prueba de selección única',
      tipo: 'prueba',
      esFormativa: false,
      ponderacionParcial: ponderacion,
      eaAsociada: 'EA 1',
      semanaSugerida: 5,
      criteriosEvaluacion: 'Comprensión y aplicación de conceptos esenciales de dibujo técnico e historia.',
    })
  }

  // Parcial 2
  if (fullText.match(/Parcial\s*2/i)) {
    const pesoMatch = fullText.match(/Parcial\s*2.*?(\d{1,2})%/is)
    const ponderacion = pesoMatch ? parseInt(pesoMatch[1], 10) : 15
    evaluaciones.push({
      id: 'eval-parcial-2',
      titulo: 'Evaluación Parcial 2',
      situacionEvaluativa: 'Encargo de dibujo y configuración CAD',
      tipo: 'trabajo',
      esFormativa: false,
      ponderacionParcial: ponderacion,
      eaAsociada: 'EA 1',
      semanaSugerida: 6,
      criteriosEvaluacion: 'Simbología técnica, escalas y capas en entorno digital.',
    })
  }

  // Parcial 3 / Plano eléctrico
  if (fullText.match(/Plano\s*el[eé]ctrico|Parcial\s*3/i)) {
    const pesoMatch = fullText.match(/(?:Plano\s*el[eé]ctrico|Parcial\s*3).*?(\d{1,2})%/is)
    const ponderacion = pesoMatch ? parseInt(pesoMatch[1], 10) : 35
    evaluaciones.push({
      id: 'eval-parcial-3',
      titulo: 'Evaluación Parcial 3: Plano Eléctrico',
      situacionEvaluativa: 'Entrega de encargo, Presentación',
      tipo: 'trabajo',
      esFormativa: false,
      ponderacionParcial: ponderacion,
      eaAsociada: 'EA 2',
      semanaSugerida: 11,
      criteriosEvaluacion: 'Normativa RIC N°10 y N°18, cuadros de carga, diagramas unilineales.',
    })
  }

  // Parcial 4 / Proyecto corto
  if (fullText.match(/Proyecto\s*corto|Parcial\s*4/i)) {
    const pesoMatch = fullText.match(/(?:Proyecto\s*corto|Parcial\s*4).*?(\d{1,2})%/is)
    const ponderacion = pesoMatch ? parseInt(pesoMatch[1], 10) : 35
    evaluaciones.push({
      id: 'eval-parcial-4',
      titulo: 'Evaluación Parcial 4: Proyecto de Planos Monofásicos y Trifásicos',
      situacionEvaluativa: 'Proyecto práctico en AutoCAD',
      tipo: 'trabajo',
      esFormativa: false,
      ponderacionParcial: ponderacion,
      eaAsociada: 'EA 3',
      semanaSugerida: 16,
      criteriosEvaluacion: 'Elaboración de planos habitacionales e industriales bajo D.S. N°8.',
    })
  }

  // Examen Transversal
  if (fullText.match(/EXAMEN\s*TRANSVERSAL|Evaluaci[oó]n\s*Final\s*Transversal/i)) {
    evaluaciones.push({
      id: 'eval-examen-transversal',
      titulo: 'Examen Transversal (ET)',
      situacionEvaluativa: 'Proyecto integrador final en laboratorio',
      tipo: 'informe',
      esFormativa: false,
      ponderacionParcial: 40,
      ponderacionFinal: 40,
      semanaSugerida: semanasProgramacion,
      criteriosEvaluacion: 'Consolidación de competencias del semestre y carpeta técnica completa.',
    })
  }

  // Evaluaciones Formativas
  if (fullText.includes('Eva For 1') || fullText.includes('Evaluación Formativa 1')) {
    evaluaciones.push({
      id: 'eval-formativa-1',
      titulo: 'Evaluación Formativa 1 (Diagnóstica / Conceptual)',
      situacionEvaluativa: 'Cuestionario de verificación',
      tipo: 'prueba',
      esFormativa: true,
      ponderacionParcial: 0,
      eaAsociada: 'EA 1',
      semanaSugerida: 2,
    })
  }
  if (fullText.includes('Eva For 2')) {
    evaluaciones.push({
      id: 'eval-formativa-2',
      titulo: 'Evaluación Formativa 2 (Simbología y Producto Eléctrico)',
      situacionEvaluativa: 'Avance de taller',
      tipo: 'trabajo',
      esFormativa: true,
      ponderacionParcial: 0,
      eaAsociada: 'EA 1',
      semanaSugerida: 4,
    })
  }

  const docs = {
    pa: fullText.includes('PROGRAMA DE ASIGNATURA') || fileName.toUpperCase().includes('PA -') || fileName.toUpperCase().includes('PA_'),
    pda: fullText.includes('PLAN DIDÁCTICO DE AULA') || fullText.includes('PLAN DIDACTICO') || fileName.toUpperCase().includes('PDA -') || fileName.toUpperCase().includes('PDA_'),
    pia: fullText.includes('PROGRAMA DE IMPLEMENTACIÓN DE ASIGNATURA') || fullText.includes('PROGRAMA INSTITUCIONAL') || fileName.toUpperCase().includes('PIA -') || fileName.toUpperCase().includes('PIA_'),
  }

  return {
    sigla: sigla || '',
    nombreAsignatura: nombreAsignatura || '',
    horasTotales,
    semanasProgramacion,
    experiencias,
    evaluaciones,
    documentosEncontrados: docs,
  }
}

/**
 * Servicio principal de integración de Maleta Didáctica
 */
export const MaletaDidacticaService = {
  /**
   * Obtiene la estructura consolidada de la Maleta Didáctica de un curso
   */
  async obtenerEstructuraMaleta(courseId: string): Promise<EstructuraMaletaDidactica | null> {
    const { data: docs, error } = await supabase
      .from('course_documents')
      .select('*')
      .eq('course_id', courseId)
      .in('master_doc_type', ['PA', 'PDA', 'PIA', 'MALETA'])

    if (error) {
      console.error('Error al obtener documentos de maleta:', error)
      return null
    }

    if (!docs || docs.length === 0) return null

    // Unir texto de los documentos de la maleta
    const combinedText = docs.map(d => `=== ARCHIVO: ${d.file_name} ===\n${d.content_text || ''}`).join('\n\n')
    const combinedNames = docs.map(d => d.file_name).join(' ')
    return parsearInformacionDocente(combinedText, combinedNames)
  },

  /**
   * Vincula un documento oficial a la Maleta Didáctica de un ramo
   */
  async registrarDocumentoMaleta(data: {
    courseId: string
    teacherId: string
    fileName: string
    fileType: string
    fileSize: number
    contentText: string
    docType: 'PA' | 'PDA' | 'PIA' | 'MATERIAL_EA'
  }) {
    const { data: inserted, error } = await supabase
      .from('course_documents')
      .insert({
        course_id: data.courseId,
        teacher_id: data.teacherId,
        file_name: data.fileName,
        file_type: data.fileType,
        file_size: data.fileSize,
        file_path: `maleta/${data.courseId}/${data.docType}_${Date.now()}.${data.fileType}`,
        content_text: data.contentText,
        is_master_doc: true,
        master_doc_type: data.docType,
        uploaded_at: Date.now(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return inserted
  },

  /**
   * Genera un Desafío / Misión Gamificada con IA basándose en los contenidos de la Maleta Didáctica
   * Prioriza el modelo gemini-3-flash-preview de Google con cascada de fallbacks
   */
  async generarDesafioDesdeMaleta(params: {
    courseId: string
    teacherId: string
    eaCodigo?: string // ej: "EA 1"
    eaTitulo?: string
    documentId?: string
    numQuestions: number
    difficulty: 'facil' | 'medio' | 'dificil'
    quizType: string // multiple_choice, match, true_false, fill_blank, word_search, memory
    maxAttempts: number
  }) {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
    if (!apiKey) throw new Error('API Key de Google no configurada (VITE_GOOGLE_API_KEY).')

    // 1. Obtener texto del documento o de la maleta del curso
    let contextText = ''
    let docId = params.documentId

    if (docId) {
      const { data: doc } = await supabase.from('course_documents').select('*').eq('id', docId).single()
      if (doc) contextText = doc.content_text || ''
    }

    if (!contextText) {
      // Buscar documentos de la maleta del curso
      const { data: docs } = await supabase
        .from('course_documents')
        .select('*')
        .eq('course_id', params.courseId)
        .in('master_doc_type', ['PDA', 'PIA', 'PA'])

      if (docs && docs.length > 0) {
        docId = docs[0].id
        contextText = docs.map(d => d.content_text).join('\n\n')
      }
    }

    if (!contextText || contextText.length < 50) {
      throw new Error('No se encontró contenido suficiente en los documentos de la maleta didáctica para generar el desafío.')
    }

    // 2. Si se especificó una EA, recortar o priorizar la sección correspondiente
    let scopeInstruction = 'Genera el desafío abarcando los contenidos generales de la asignatura.'
    if (params.eaCodigo && params.eaTitulo) {
      scopeInstruction = `ENFÓCATE EXCLUSIVAMENTE en la ${params.eaCodigo}: "${params.eaTitulo}". 
Utiliza los Indicadores de Logro, los conceptos técnicos específicos y las actividades de taller descritas para esta experiencia en la Maleta Didáctica.`
    }

    // 3. Crear Prompt de IA Pedagógica
    const prompt = `Actúa como un Diseñador Instruccional Senior y Docente de Duoc UC.
Tu misión es generar un desafío formativo gamificado para estudiantes de educación superior técnica basándote en la Maleta Didáctica oficial.

ALCANCE PEDAGÓGICO:
${scopeInstruction}

REGLAS DE GENERACIÓN:
- Nivel de dificultad: ${params.difficulty.toUpperCase()}
- Formato del juego: ${params.quizType}
- Cantidad de preguntas/retos: ${params.numQuestions}
- Lenguaje: Español chileno profesional, riguroso pero motivador para estudiantes de ingeniería y técnica.
- Contenidos: Simbología normalizada, normativas eléctricas (Pliegos RIC), diseño técnico, herramientas CAD, o los temas específicos del documento.

DOCUMENTO OFICIAL DE LA MALETA DIDÁCTICA:
${contextText.substring(0, 35000)}

RESPONDE EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO (sin bloques de código markdown, sin \`\`\`json, sin texto adicional):
{
  "title": "Título llamativo del Desafío (ej: Reto EA1: Dominando la Simbología y Normativa CAD)",
  "description": "Breve explicación motivacional del reto y lo que aprenderá el alumno",
  "questions": [
    {
      "question": "Pregunta clara o situación problemática técnica",
      "options": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],
      "correct_answer": "Texto exacto de la alternativa correcta que coincide con options",
      "explanation": "Breve fundamentación técnica de por qué es la respuesta correcta según la normativa o contenido"
    }
  ]
}`

    // 4. Invocar Gemini con cascada de modelos
    const genAI = new GoogleGenerativeAI(apiKey)
    let jsonResult: any = null
    let lastError: any = null

    for (const modelName of MODELOS_CASCADA) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const res = await model.generateContent(prompt)
        const text = res.response.text()

        const match = text.match(/\{[\s\S]*\}/)
        if (match) {
          jsonResult = JSON.parse(match[0])
          break
        }
      } catch (err: any) {
        lastError = err
        console.warn(`Modelo ${modelName} falló para generar desafío, probando siguiente...`, err.message)
      }
    }

    if (!jsonResult) {
      throw lastError || new Error('No se pudo generar el desafío con IA.')
    }

    // Normalizar preguntas para máxima compatibilidad con el motor de juego y puntuación
    const normalizedQuestions = (jsonResult.questions || []).map((q: any) => {
      let correctIdx = 0
      if (typeof q.correct === 'number') {
        correctIdx = q.correct
      } else if (typeof q.correct_option === 'number') {
        correctIdx = q.correct_option
      } else if (q.correct_answer && Array.isArray(q.options)) {
        const found = q.options.findIndex((opt: string) => 
          opt.trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase() ||
          opt.trim().toLowerCase().includes(String(q.correct_answer).trim().toLowerCase())
        )
        if (found >= 0) correctIdx = found
      }

      return {
        ...q,
        type: params.quizType || 'multiple_choice',
        correct: correctIdx,
        correct_option: correctIdx,
      }
    })

    // 5. Guardar en la base de datos (tabla quizzes)
    const { data: savedQuiz, error: saveErr } = await supabase
      .from('quizzes')
      .insert({
        course_id: params.courseId,
        document_id: docId || null,
        teacher_id: params.teacherId,
        title: jsonResult.title,
        quiz_type: params.quizType,
        questions: normalizedQuestions,
        difficulty: params.difficulty,
        num_questions: normalizedQuestions.length,
        max_attempts: params.maxAttempts || 3,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (saveErr) {
      console.error('Error guardando quiz en base de datos:', saveErr)
      throw saveErr
    }

    return savedQuiz
  },

  /**
   * Genera o actualiza la planificación y el calendario a partir de los datos docentes de la Maleta Didáctica
   */
  async sincronizarPlanificacionDesdeMaleta(params: {
    courseId: string
    teacherId: string
    seccion: string
    semestre: string
    fechaInicio: number
    diasSemana: number[]
    diasTipo: Record<number, 'catedra' | 'laboratorio'>
  }) {
    const estructura = await this.obtenerEstructuraMaleta(params.courseId)
    if (!estructura) {
      throw new Error('La asignatura no cuenta con una Maleta Didáctica vinculada.')
    }

    // 1. Registrar o actualizar las evaluaciones oficiales en la tabla evaluaciones
    const evaluacionesCreadas = []
    const baseDate = new Date(params.fechaInicio)

    for (const ev of estructura.evaluaciones) {
      // Calcular fecha tentativa según semana sugerida
      const targetDate = new Date(baseDate.getTime() + (ev.semanaSugerida || 4) * 7 * 86400000)
      
      const { data: existing } = await supabase
        .from('evaluaciones')
        .select('id')
        .eq('course_id', params.courseId)
        .eq('titulo', ev.titulo)
        .maybeSingle()

      if (!existing) {
        const { data: newEval } = await supabase
          .from('evaluaciones')
          .insert({
            course_id: params.courseId,
            teacher_id: params.teacherId,
            section: params.seccion,
            titulo: ev.titulo,
            tipo: ev.tipo,
            descripcion: `${ev.situacionEvaluativa || 'Evaluación oficial'}. Ponderación: ${ev.ponderacionParcial}%. ${ev.criteriosEvaluacion || ''}`,
            fecha: targetDate.getTime(),
            puntos: ev.ponderacionParcial * 10,
            activo: true,
            created_at: Date.now(),
          })
          .select()
          .single()

        if (newEval) evaluacionesCreadas.push(newEval)
      }
    }

    return {
      success: true,
      estructura,
      evaluacionesCreadas: evaluacionesCreadas.length,
    }
  },

  /**
   * Vincula la Maleta Didáctica Oficial preconfigurada para asignaturas que ya cuentan con sus documentos en el sistema
   */
  async vincularMaletaPreconfigurada(courseId: string, courseCode: string, teacherId: string) {
    if (courseCode.toUpperCase() === 'PEI1108') {
      const { MALETA_OFICIAL_PEI1108 } = await import('../data/maletaOficialPEI1108')
      const agregados = []

      for (const item of MALETA_OFICIAL_PEI1108.files) {
        // Verificar si ya existe un documento con este nombre en este curso
        const { data: existing } = await supabase
          .from('course_documents')
          .select('id')
          .eq('course_id', courseId)
          .eq('file_name', item.fileName)
          .maybeSingle()

        if (!existing) {
          const { data: inserted, error } = await supabase
            .from('course_documents')
            .insert({
              course_id: courseId,
              teacher_id: teacherId,
              file_name: item.fileName,
              file_type: item.fileType,
              file_size: item.fileSize,
              file_path: `maleta/${courseId}/${item.docType}_${Date.now()}.pdf`,
              content_text: item.content,
              is_master_doc: true,
              master_doc_type: item.docType,
              uploaded_at: Date.now(),
              created_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (error) console.error('Error insertando doc maleta:', error)
          else agregados.push(inserted)
        }
      }

      return {
        success: true,
        documentosAgregados: agregados.length,
        totalArchivos: MALETA_OFICIAL_PEI1108.files.length,
      }
    }

    throw new Error(`No hay una maleta didáctica preconfigurada para la sigla ${courseCode}. Por favor sube los archivos directamente.`)
  },
}
