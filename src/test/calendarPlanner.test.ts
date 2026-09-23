import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  FECHA_INICIO_OFICIAL_2026_2,
  FERIADOS_DUOC_2026,
  generarPlanificacion18Semanas,
  getMondayOfDate,
  getDateOfDayInWeek,
  stringifyDateLocal
} from '../services/calendarPlannerService'

// Mock supabase para tests unitarios
vi.mock('../lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn((_table: string) => {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'eval-mock-id' }, error: null })
            })
          }),
          delete: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        }
      })
    }
  }
})

describe('calendarPlannerService - Motor de 18 Semanas y Calendario Académico Duoc UC', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe definir la fecha de inicio oficial del semestre 2026-2 como 10 de Agosto de 2026', () => {
    expect(FECHA_INICIO_OFICIAL_2026_2).toBe('2026-08-10')

    const [y, m, d] = FECHA_INICIO_OFICIAL_2026_2.split('-').map(Number)
    const fecha = new Date(y, m - 1, d, 12, 0, 0, 0)
    // En JS getDay(): 0=Dom, 1=Lun
    expect(fecha.getDay()).toBe(1) // Es día Lunes
    expect(stringifyDateLocal(fecha)).toBe('2026-08-10')
  })

  it('debe calcular correctamente el lunes de referencia y días de la semana', () => {
    const miercoles = new Date(2026, 7, 12, 12, 0, 0, 0) // 12 de agosto de 2026 (Miércoles)
    const lunes = getMondayOfDate(miercoles)
    expect(stringifyDateLocal(lunes)).toBe('2026-08-10')

    // Obtener el miércoles (día 3) de esa misma semana
    const miercolesTs = getDateOfDayInWeek(lunes.getTime(), 3)
    expect(stringifyDateLocal(new Date(miercolesTs))).toBe('2026-08-12')
  })

  it('debe contener los feriados y suspensiones institucionales oficiales de Duoc UC 2026', () => {
    const fechasFeriados = FERIADOS_DUOC_2026.map(f => f.fecha)

    // Fiestas Patrias (18 de Septiembre)
    expect(fechasFeriados).toContain('2026-09-18')
    const fiestasPatrias = FERIADOS_DUOC_2026.find(f => f.fecha === '2026-09-18')
    expect(fiestasPatrias?.nombre).toBe('Fiestas Patrias')

    // Encuentro de Dos Mundos (12 de Octubre)
    expect(fechasFeriados).toContain('2026-10-12')

    // Aniversario Duoc UC (11 de Noviembre con suspensión desde las 15:15)
    expect(fechasFeriados).toContain('2026-11-11')
    const aniversario = FERIADOS_DUOC_2026.find(f => f.fecha === '2026-11-11')
    expect(aniversario?.media_jornada).toBe(true)
    expect(aniversario?.hora_limite).toBe('15:15')

    // Inmaculada Concepción (8 de Diciembre)
    expect(fechasFeriados).toContain('2026-12-08')
  })

  it('debe generar exactamente 18 semanas de clases con formativas en semanas 5, 10 y 15', async () => {
    const params = {
      courseId: 'course-test-123',
      teacherId: 'teacher-test-456',
      seccion: '008D',
      semestre: '2026-2',
      fechaInicioIso: '2026-08-10',
      sesionesHorario: [
        { dia: 1, tipo: 'catedra' as const, hora_inicio: '08:30', hora_fin: '10:40' },
        { dia: 3, tipo: 'laboratorio' as const, hora_inicio: '08:30', hora_fin: '10:40' }
      ]
    }

    const resultado = await generarPlanificacion18Semanas(params)

    expect(resultado.success).toBe(true)
    expect(resultado.totalSemanas).toBe(18)
    expect(resultado.clases.length).toBeGreaterThanOrEqual(36) // 18 semanas x 2 sesiones = 36

    // Verificar semana 1 empieza el 10 de agosto
    const claseSemana1 = resultado.clases.find(c => c.semana === 1 && c.sesion === 1)
    expect(claseSemana1?.fecha_str).toBe('2026-08-10')

    // Verificar Evaluación Formativa 1 en Semana 5
    const clasesSemana5 = resultado.clases.filter(c => c.semana === 5)
    const formativa1 = clasesSemana5.find(c => c.tiene_evaluacion && c.es_formativa)
    expect(formativa1).toBeDefined()
    expect(formativa1?.titulo).toContain('Formativa 1')
    expect(formativa1?.tipo_bloque).toBe('evaluacion')

    // Verificar Evaluación Formativa 2 en Semana 10
    const clasesSemana10 = resultado.clases.filter(c => c.semana === 10)
    const formativa2 = clasesSemana10.find(c => c.tiene_evaluacion && c.es_formativa)
    expect(formativa2).toBeDefined()
    expect(formativa2?.titulo).toContain('Formativa 2')

    // Verificar Evaluación Formativa 3 en Semana 15
    const clasesSemana15 = resultado.clases.filter(c => c.semana === 15)
    const formativa3 = clasesSemana15.find(c => c.tiene_evaluacion && c.es_formativa)
    expect(formativa3).toBeDefined()
    expect(formativa3?.titulo).toContain('Formativa 3')
  })

  it('debe programar el Examen Transversal en las semanas 16 y 17', async () => {
    const params = {
      courseId: 'course-test-123',
      teacherId: 'teacher-test-456',
      seccion: '008D',
      semestre: '2026-2',
      fechaInicioIso: '2026-08-10',
      sesionesHorario: [
        { dia: 1, tipo: 'catedra' as const, hora_inicio: '08:30', hora_fin: '10:40' },
        { dia: 3, tipo: 'laboratorio' as const, hora_inicio: '08:30', hora_fin: '10:40' }
      ]
    }

    const resultado = await generarPlanificacion18Semanas(params)

    // Examen en Semana 16
    const examenSemana16 = resultado.clases.find(c => c.semana === 16 && c.tiene_evaluacion)
    expect(examenSemana16).toBeDefined()
    expect(examenSemana16?.titulo).toContain('Examen Transversal')
    expect(examenSemana16?.es_formativa).toBe(false)

    // Examen en Semana 17
    const examenSemana17 = resultado.clases.find(c => c.semana === 17 && c.tiene_evaluacion)
    expect(examenSemana17).toBeDefined()
    expect(examenSemana17?.titulo).toContain('Examen Transversal')
  })

  it('debe reservar la Semana 18 para recuperaciones, estudiantes con notas pendientes y cierre de actas', async () => {
    const params = {
      courseId: 'course-test-123',
      teacherId: 'teacher-test-456',
      seccion: '008D',
      semestre: '2026-2',
      fechaInicioIso: '2026-08-10',
      sesionesHorario: [
        { dia: 1, tipo: 'catedra' as const, hora_inicio: '08:30', hora_fin: '10:40' },
        { dia: 3, tipo: 'laboratorio' as const, hora_inicio: '08:30', hora_fin: '10:40' }
      ]
    }

    const resultado = await generarPlanificacion18Semanas(params)

    const clasesSemana18 = resultado.clases.filter(c => c.semana === 18)
    expect(clasesSemana18.length).toBe(2)

    // Sesión 1: Recuperaciones y rezagados
    expect(clasesSemana18[0].titulo).toContain('Recuperativas')
    expect(clasesSemana18[0].contenido).toContain('estudiantes con evaluaciones atrasadas')

    // Sesión 2: Cierre de semestre y firma de actas
    expect(clasesSemana18[1].titulo).toContain('Cierre de Semestre')
    expect(clasesSemana18[1].contenido).toContain('actas oficiales')
  })

  it('debe suspender clases en feriados oficiales (ej: 12 de Octubre Encuentro de Dos Mundos)', async () => {
    const params = {
      courseId: 'course-test-123',
      teacherId: 'teacher-test-456',
      seccion: '008D',
      semestre: '2026-2',
      fechaInicioIso: '2026-08-10',
      sesionesHorario: [
        { dia: 1, tipo: 'catedra' as const, hora_inicio: '08:30', hora_fin: '10:40' }, // Lunes
        { dia: 3, tipo: 'laboratorio' as const, hora_inicio: '08:30', hora_fin: '10:40' } // Miércoles
      ]
    }

    const resultado = await generarPlanificacion18Semanas(params)

    // El 12 de octubre de 2026 es Lunes (Semana 10)
    const claseFeriado = resultado.clases.find(c => c.fecha_str === '2026-10-12')
    expect(claseFeriado).toBeDefined()
    expect(claseFeriado?.es_feriado).toBe(true)
    expect(claseFeriado?.estado).toBe('suspendida')
    expect(claseFeriado?.detalle_feriado).toBe('Encuentro de Dos Mundos')
  })
})
