import { describe, it, expect } from 'vitest'
import { parsearInformacionDocente } from '../services/maletaDidacticaService'

describe('MaletaDidacticaService - Parser de Información Docente', () => {
  it('debe extraer correctamente la sigla, nombre y horas desde el texto del PDA/PIA', () => {
    const sampleText = `
Sigla: PEI1108
Nombre: DIBUJO DE PLANOS ELÉCTRICOS
Horas Totales: 72
N° de Semanas de Programación: 18
Docencia Dirigida Presencial: 72 horas
`
    const resultado = parsearInformacionDocente(sampleText, 'PDA - PEI1108 DIBUJO DE PLANOS ELÉCTRICOS.pdf')
    expect(resultado.sigla).toBe('PEI1108')
    expect(resultado.nombreAsignatura).toBe('DIBUJO DE PLANOS ELÉCTRICOS')
    expect(resultado.horasTotales).toBe(72)
    expect(resultado.semanasProgramacion).toBe(18)
    expect(resultado.documentosEncontrados.pda).toBe(true)
  })

  it('debe identificar las 3 Experiencias de Aprendizaje (EAs) principales', () => {
    const sampleText = `
3. SÍNTESIS DE LA RUTA DE APRENDIZAJE
EA 1 - Historia y fundamentos del dibujo técnico (20 horas)
EA 2 - Fundamentos y normas básicas de dibujo eléctrico, aplicables a AutoCAD (24 horas)
EA 3 - Elaboración de proyectos eléctricos normalizados en AutoCAD (24 horas)
EXAMEN TRANSVERSAL (4 horas)
`
    const resultado = parsearInformacionDocente(sampleText, 'PIA - PEI1108 DIBUJO DE PLANOS ELÉCTRICOS.pdf')
    expect(resultado.experiencias.length).toBeGreaterThanOrEqual(3)
    expect(resultado.experiencias[0].codigo).toBe('EA 1')
    expect(resultado.experiencias[0].titulo).toContain('Historia y fundamentos del dibujo técnico')
    expect(resultado.experiencias[1].codigo).toBe('EA 2')
    expect(resultado.experiencias[2].codigo).toBe('EA 3')
  })

  it('debe detectar las evaluaciones oficiales y sus ponderaciones porcentuales', () => {
    const sampleText = `
Parcial 1: 15%
Parcial 2: 15%
Plano eléctrico (Parcial 3): 35%
Proyecto corto (Parcial 4): 35%
EXAMEN TRANSVERSAL: 40%
Eva For 1: Evaluación Formativa 1 (0%)
`
    const resultado = parsearInformacionDocente(sampleText, 'PIA - PEI1108 DIBUJO DE PLANOS ELÉCTRICOS.pdf')
    const titulos = resultado.evaluaciones.map(e => e.titulo)
    expect(titulos.some(t => t.includes('Parcial 1'))).toBe(true)
    expect(titulos.some(t => t.includes('Plano Eléctrico') || t.includes('Parcial 3'))).toBe(true)
    expect(titulos.some(t => t.includes('Examen Transversal'))).toBe(true)

    const parcial1 = resultado.evaluaciones.find(e => e.titulo.includes('Parcial 1'))
    expect(parcial1?.ponderacionParcial).toBe(15)

    const transversal = resultado.evaluaciones.find(e => e.titulo.includes('Examen Transversal'))
    expect(transversal?.ponderacionParcial).toBe(40)
  })

  it('debe estructurar y asociar correctamente el índice de respuesta en opciones múltiples', () => {
    const rawQuestions = [
      {
        question: '¿Cuál es la norma que rige los tableros eléctricos?',
        options: ['Pliego RIC N°01', 'Pliego RIC N°10', 'Pliego RIC N°02', 'Pliego RIC N°18'],
        correct_answer: 'Pliego RIC N°02'
      }
    ]

    const normalized = rawQuestions.map(q => {
      let correctIdx = 0
      if (q.correct_answer && Array.isArray(q.options)) {
        const found = q.options.findIndex(opt => 
          opt.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()
        )
        if (found >= 0) correctIdx = found
      }
      return { ...q, correct: correctIdx, correct_option: correctIdx }
    })

    expect(normalized[0].correct).toBe(2)
    expect(normalized[0].correct_option).toBe(2)
    expect(normalized[0].options[normalized[0].correct]).toBe('Pliego RIC N°02')
  })
})
