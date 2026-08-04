import { supabase } from './supabase'

/* ────────────────────────────────────────────────────────────────
 * Cierre de semestre e informe final
 * ──────────────────────────────────────────────────────────────── */

export interface SemesterEndInfo {
    /** Fecha de término del semestre (ms epoch), o null si el ramo no está planificado. */
    fechaFin: number | null
    /** De dónde salió la fecha: la última clase real, o el cálculo inicio + semanas. */
    fuente: 'ultima_clase' | 'calculada' | null
    fechaInicio: number | null
    semanas: number | null
    /** true si ya pasó la fecha de término. */
    terminado: boolean
    /** Días que faltan para el término (negativo si ya pasó). */
    diasRestantes: number | null
}

/**
 * Calcula la fecha de término del semestre de un ramo.
 *
 * Prioriza la última clase realmente calendarizada, porque ya incorpora feriados
 * y ajustes hechos por el docente. Si el ramo no tiene calendario, cae al cálculo
 * `fecha_inicio + semanas_semestre` de la programación del semestre.
 */
export function getSemesterEndInfo(course: any, ultimaClaseTs?: number | null): SemesterEndInfo {
    const cfg = course?.schedule_config || null
    const fechaInicio = cfg?.fecha_inicio ? Number(cfg.fecha_inicio) : null
    const semanas = cfg?.semanas_semestre ? Number(cfg.semanas_semestre) : null

    let fechaFin: number | null = null
    let fuente: SemesterEndInfo['fuente'] = null

    if (ultimaClaseTs) {
        fechaFin = Number(ultimaClaseTs)
        fuente = 'ultima_clase'
    } else if (fechaInicio && semanas) {
        // El semestre termina al final de la última semana planificada.
        fechaFin = fechaInicio + semanas * 7 * 24 * 60 * 60 * 1000
        fuente = 'calculada'
    }

    if (fechaFin === null) {
        return { fechaFin: null, fuente: null, fechaInicio, semanas, terminado: false, diasRestantes: null }
    }

    // Se compara contra el final del día de término: el semestre sigue abierto
    // durante todo el día de la última clase.
    const fin = new Date(fechaFin)
    fin.setHours(23, 59, 59, 999)
    const ahora = Date.now()
    const diasRestantes = Math.ceil((fin.getTime() - ahora) / (24 * 60 * 60 * 1000))

    return {
        fechaFin,
        fuente,
        fechaInicio,
        semanas,
        terminado: ahora > fin.getTime(),
        diasRestantes,
    }
}

export interface CourseSemesterStat {
    id: string
    name: string
    code: string
    secciones: number
    enLista: number
    inscritos: number
    activos: number
    adopcionPct: number | null
    participacionPct: number | null
    quizzes: number
    entregas: number
    entregasPorAlumno: number
    promedioScore: number
    aprobacionPct: number | null
    evaluaciones: number
    misionesEntregas: number
    canjes: number
    documentos: number
    clasesPlanificadas: number
    clasesRealizadas: number
    clasesSuspendidas: number
    feriados: number
    puntosTotales: number
    fechaInicio: number | null
    fechaFin: number | null
    semestre: string | null
    studentsEnabled: boolean
    cerrado: boolean
}

export interface SemesterReport {
    generadoEn: number
    semestre: string | null
    periodo: { inicio: number | null; fin: number | null }
    totales: {
        ramos: number
        ramosConAlumnos: number
        ramosSoloOrganizacion: number
        secciones: number
        enLista: number
        inscritos: number
        activos: number
        adopcionPct: number | null
        participacionPct: number | null
        quizzes: number
        entregas: number
        entregasPorAlumno: number
        promedioScore: number
        aprobacionPct: number | null
        evaluaciones: number
        misionesEntregas: number
        canjes: number
        documentos: number
        clasesPlanificadas: number
        clasesRealizadas: number
        clasesSuspendidas: number
        feriados: number
        puntosTotales: number
    }
    belbin: Record<string, number>
    porCurso: CourseSemesterStat[]
}

/** Nota mínima de aprobación usada para el porcentaje de aprobación del informe. */
const NOTA_APROBACION = 60

/** PostgREST corta en 1000 filas por defecto; el informe debe leerlas todas. */
const PAGE_SIZE = 1000

/**
 * Trae todas las filas de una consulta paginando con `range`.
 * Sin esto, un semestre con muchas entregas devolvería métricas truncadas
 * (y calladamente incorrectas) en vez de fallar.
 */
async function fetchAll<T = any>(
    build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>
): Promise<T[]> {
    const out: T[] = []
    for (let page = 0; ; page++) {
        const from = page * PAGE_SIZE
        const { data, error } = await build(from, from + PAGE_SIZE - 1)
        if (error) throw error
        const lote = data || []
        out.push(...lote)
        if (lote.length < PAGE_SIZE) break
    }
    return out
}

/** Una clase próxima, ya resuelta con el nombre del ramo para mostrarla directo. */
export interface ProximaClase {
    id: string
    courseId: string
    courseName: string
    courseCode: string
    fecha: number
    titulo: string | null
    section: string | null
    horaInicio: string | null
    tipoBloque: string | null
    esFeriado: boolean
}

/**
 * Próximas clases del docente a partir de hoy, ordenadas por fecha.
 * Alimenta la agenda de la barra lateral del dashboard.
 */
export async function getProximasClases(
    teacherId: string,
    role: string,
    limite = 5
): Promise<ProximaClase[]> {
    let cq = supabase.from('courses').select('id, name, code')
    if (role !== 'admin') cq = cq.eq('teacher_id', teacherId)
    const { data: courses, error: cErr } = await cq
    if (cErr) throw cErr
    if (!courses || courses.length === 0) return []

    const porId = new Map(courses.map(c => [c.id, c]))

    // Desde el inicio del día de hoy: una clase de esta mañana sigue siendo relevante.
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
        .from('clases_calendarizadas')
        .select('id, course_id, fecha, titulo, section, hora_inicio, tipo_bloque, es_feriado, estado')
        .in('course_id', [...porId.keys()])
        .gte('fecha', hoy.getTime())
        .order('fecha', { ascending: true })
        .limit(limite)
    if (error) throw error

    return (data || []).map(cl => {
        const curso = porId.get(cl.course_id)
        return {
            id: cl.id,
            courseId: cl.course_id,
            courseName: curso?.name || 'Ramo',
            courseCode: curso?.code || '',
            fecha: Number(cl.fecha),
            titulo: cl.titulo,
            section: cl.section,
            horaInicio: cl.hora_inicio,
            tipoBloque: cl.tipo_bloque,
            esFeriado: !!cl.es_feriado,
        }
    })
}

export const SemesterAPI = {
    /**
     * Estado de cierre de cada ramo del docente: fecha de término, si ya terminó
     * y si el semestre ya fue cerrado.
     */
    async getSemesterStatus(teacherId: string, role: string) {
        let query = supabase.from('courses').select('*')
        if (role !== 'admin') query = query.eq('teacher_id', teacherId)
        const { data: courses, error } = await query
        if (error) throw error
        if (!courses || courses.length === 0) return []

        const courseIds = courses.map(c => c.id)
        // Última clase calendarizada por ramo, para derivar la fecha de término real.
        const { data: clases } = await supabase
            .from('clases_calendarizadas')
            .select('course_id, fecha')
            .in('course_id', courseIds)

        const ultimaPorCurso = new Map<string, number>()
        for (const cl of clases || []) {
            const prev = ultimaPorCurso.get(cl.course_id)
            if (!prev || Number(cl.fecha) > prev) ultimaPorCurso.set(cl.course_id, Number(cl.fecha))
        }

        return courses.map(c => ({
            ...c,
            ...getSemesterEndInfo(c, ultimaPorCurso.get(c.id) ?? null),
            cerrado: !!c.closed_at,
        }))
    },

    /**
     * Construye el informe de cierre con las métricas del semestre.
     * Es de solo lectura: se puede previsualizar sin cerrar nada.
     */
    async buildSemesterReport(teacherId: string, role: string, courseIds?: string[]): Promise<SemesterReport> {
        let query = supabase.from('courses').select('*')
        if (role !== 'admin') query = query.eq('teacher_id', teacherId)
        const { data: allCourses, error } = await query
        if (error) throw error

        const courses = (allCourses || []).filter(c => !courseIds || courseIds.includes(c.id))
        if (courses.length === 0) throw new Error('No hay ramos para incluir en el informe.')

        const ids = courses.map(c => c.id)

        const porCursoPaginado = (tabla: string, columnas: string) =>
            fetchAll((from, to) =>
                supabase.from(tabla).select(columnas).in('course_id', ids).range(from, to))

        const [enrollments, whitelist, quizzes, clases, evaluaciones, redemptions, documents, missions] =
            await Promise.all([
                porCursoPaginado('enrollments', '*, profiles(name, belbin_profile)'),
                porCursoPaginado('whitelists', 'id, course_id, section'),
                porCursoPaginado('quizzes', 'id, course_id, title, is_active'),
                porCursoPaginado('clases_calendarizadas', 'id, course_id, fecha, semana, estado, es_feriado, section'),
                porCursoPaginado('evaluaciones', 'id, course_id, tipo, activo'),
                porCursoPaginado('redemptions', 'id, course_id, status'),
                porCursoPaginado('course_documents', 'id, course_id, is_master_doc'),
                porCursoPaginado('missions', 'id, course_id'),
            ]) as any[][]

        const quizIds = (quizzes || []).map(q => q.id)
        const missionIds = (missions || []).map(m => m.id)

        // Las entregas se piden aparte: cuelgan del quiz/misión, no del curso.
        // Se paginan porque son la tabla que más crece de un semestre a otro.
        const quizSubs = quizIds.length
            ? await fetchAll((from, to) =>
                supabase
                    .from('quiz_submissions')
                    .select('id, quiz_id, user_id, score, earned_points, completed_at')
                    .in('quiz_id', quizIds)
                    .range(from, to))
            : []
        const missionSubs = missionIds.length
            ? await fetchAll((from, to) =>
                supabase
                    .from('mission_submissions')
                    .select('id, mission_id, user_id')
                    .in('mission_id', missionIds)
                    .range(from, to))
            : []

        const quizToCourse = new Map((quizzes || []).map(q => [q.id, q.course_id]))
        const missionToCourse = new Map((missions || []).map(m => [m.id, m.course_id]))

        const porCurso: CourseSemesterStat[] = courses.map(course => {
            const cEnroll = (enrollments || []).filter(e => e.course_id === course.id)
            const cWhite = (whitelist || []).filter(w => w.course_id === course.id)
            const cQuizzes = (quizzes || []).filter(q => q.course_id === course.id)
            const cClases = (clases || []).filter(c => c.course_id === course.id)
            const cSubs = (quizSubs || []).filter(s => quizToCourse.get(s.quiz_id) === course.id)
            const cMisSubs = (missionSubs || []).filter(s => missionToCourse.get(s.mission_id) === course.id)
            const cEval = (evaluaciones || []).filter(e => e.course_id === course.id)
            const cRedem = (redemptions || []).filter(r => r.course_id === course.id)
            const cDocs = (documents || []).filter(d => d.course_id === course.id)

            const inscritos = cEnroll.length
            const enLista = cWhite.length
            // Alumnos activos = los que entregaron al menos un quiz o una misión.
            // Es la señal real de participación, más honesta que contar inscritos.
            const activos = new Set([...cSubs.map(s => s.user_id), ...cMisSubs.map(s => s.user_id)]).size
            const notas = cSubs.map(s => Number(s.score) || 0)
            const promedio = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0
            const aprobados = notas.filter(n => n >= NOTA_APROBACION).length

            const ultimaClase = cClases.length ? Math.max(...cClases.map(c => Number(c.fecha))) : null
            const endInfo = getSemesterEndInfo(course, ultimaClase)

            const secciones = new Set(
                [
                    ...cClases.map(c => c.section),
                    ...cWhite.map(w => w.section),
                    ...cEnroll.map(e => e.section),
                ].filter(Boolean)
            ).size

            return {
                id: course.id,
                name: course.name,
                code: course.code,
                secciones,
                enLista,
                inscritos,
                activos,
                // Adopción: cuántos de la lista oficial llegaron a registrarse.
                adopcionPct: enLista > 0 ? Math.round((inscritos / enLista) * 100) : null,
                // Participación: cuántos de los inscritos realmente entregaron algo.
                participacionPct: inscritos > 0 ? Math.round((activos / inscritos) * 100) : null,
                quizzes: cQuizzes.length,
                entregas: cSubs.length,
                entregasPorAlumno: inscritos > 0 ? +(cSubs.length / inscritos).toFixed(1) : 0,
                promedioScore: +promedio.toFixed(1),
                aprobacionPct: notas.length ? Math.round((aprobados / notas.length) * 100) : null,
                evaluaciones: cEval.length,
                misionesEntregas: cMisSubs.length,
                canjes: cRedem.length,
                documentos: cDocs.length,
                clasesPlanificadas: cClases.length,
                clasesRealizadas: cClases.filter(c => c.estado === 'realizada').length,
                clasesSuspendidas: cClases.filter(c => c.estado === 'suspendida').length,
                feriados: cClases.filter(c => c.es_feriado).length,
                puntosTotales: cEnroll.reduce((s, e) => s + (Number(e.ranking_points) || 0), 0),
                fechaInicio: endInfo.fechaInicio,
                fechaFin: endInfo.fechaFin,
                semestre: course.schedule_config?.semestre || null,
                studentsEnabled: course.students_enabled !== false,
                cerrado: !!course.closed_at,
            }
        })

        // Solo los ramos con alumnos habilitados cuentan para las métricas de participación:
        // un ramo en modo organización no tiene alumnos y hundiría los promedios.
        const conAlumnos = porCurso.filter(c => c.studentsEnabled)
        const sum = (f: (c: CourseSemesterStat) => number, list: CourseSemesterStat[] = porCurso) =>
            list.reduce((s, c) => s + (f(c) || 0), 0)

        const totalInscritos = sum(c => c.inscritos, conAlumnos)
        const totalEnLista = sum(c => c.enLista, conAlumnos)
        const totalActivos = sum(c => c.activos, conAlumnos)
        const totalEntregas = sum(c => c.entregas, conAlumnos)

        // El promedio global se pondera por entrega, no por ramo: un ramo con 3
        // entregas no puede pesar lo mismo que uno con 300.
        const idsConAlumnos = new Set(conAlumnos.map(c => c.id))
        const notasGlobales = (quizSubs || [])
            .filter(s => idsConAlumnos.has(quizToCourse.get(s.quiz_id) as string))
            .map(s => Number(s.score) || 0)
        const promedioGlobal = notasGlobales.length
            ? notasGlobales.reduce((a, b) => a + b, 0) / notasGlobales.length
            : 0

        // Distribución Belbin de los alumnos inscritos (perfil de equipo del semestre).
        const belbin: Record<string, number> = {}
        for (const e of enrollments || []) {
            const rol = (e as any).profiles?.belbin_profile?.role_dominant
            if (rol) belbin[rol] = (belbin[rol] || 0) + 1
        }

        const fechasFin = porCurso.map(c => c.fechaFin).filter(Boolean) as number[]
        const fechasInicio = porCurso.map(c => c.fechaInicio).filter(Boolean) as number[]

        return {
            generadoEn: Date.now(),
            semestre: porCurso.find(c => c.semestre)?.semestre || null,
            periodo: {
                inicio: fechasInicio.length ? Math.min(...fechasInicio) : null,
                fin: fechasFin.length ? Math.max(...fechasFin) : null,
            },
            totales: {
                ramos: porCurso.length,
                ramosConAlumnos: conAlumnos.length,
                ramosSoloOrganizacion: porCurso.length - conAlumnos.length,
                secciones: sum(c => c.secciones),
                enLista: totalEnLista,
                inscritos: totalInscritos,
                activos: totalActivos,
                adopcionPct: totalEnLista > 0 ? Math.round((totalInscritos / totalEnLista) * 100) : null,
                participacionPct: totalInscritos > 0 ? Math.round((totalActivos / totalInscritos) * 100) : null,
                quizzes: sum(c => c.quizzes),
                entregas: totalEntregas,
                entregasPorAlumno: totalInscritos > 0 ? +(totalEntregas / totalInscritos).toFixed(1) : 0,
                promedioScore: +promedioGlobal.toFixed(1),
                aprobacionPct: notasGlobales.length
                    ? Math.round((notasGlobales.filter(n => n >= NOTA_APROBACION).length / notasGlobales.length) * 100)
                    : null,
                evaluaciones: sum(c => c.evaluaciones),
                misionesEntregas: sum(c => c.misionesEntregas),
                canjes: sum(c => c.canjes),
                documentos: sum(c => c.documentos),
                clasesPlanificadas: sum(c => c.clasesPlanificadas),
                clasesRealizadas: sum(c => c.clasesRealizadas),
                clasesSuspendidas: sum(c => c.clasesSuspendidas),
                feriados: sum(c => c.feriados),
                puntosTotales: sum(c => c.puntosTotales),
            },
            belbin,
            porCurso,
        }
    },

    /**
     * Cierra el semestre de los ramos indicados y guarda el informe como snapshot.
     * Solo se permite si la fecha de término ya pasó en todos ellos.
     */
    async closeSemester(teacherId: string, role: string, courseIds: string[]) {
        if (!courseIds || courseIds.length === 0) {
            throw new Error('Selecciona al menos un ramo para cerrar.')
        }

        const estado = await this.getSemesterStatus(teacherId, role)
        const objetivo = estado.filter((c: any) => courseIds.includes(c.id))

        const noTerminados = objetivo.filter((c: any) => !c.terminado)
        if (noTerminados.length > 0) {
            throw new Error(
                `Aún no termina el semestre en: ${noTerminados.map((c: any) => c.code).join(', ')}.`
            )
        }

        const report = await this.buildSemesterReport(teacherId, role, courseIds)
        const closedAt = new Date().toISOString()

        // El informe se guarda por ramo con su propio detalle, para que cada uno
        // conserve su snapshot aunque después se cierren otros ramos por separado.
        for (const c of report.porCurso) {
            const { error } = await supabase
                .from('courses')
                .update({
                    closed_at: closedAt,
                    closure_report: { ...report, porCurso: report.porCurso.filter(x => x.id === c.id) },
                })
                .eq('id', c.id)
            if (error) throw error
        }

        return { closedAt, report, cerrados: report.porCurso.length }
    },

    /** Reabre un semestre cerrado: borra la marca de cierre y su snapshot. */
    async reopenSemester(courseIds: string[]) {
        const { error } = await supabase
            .from('courses')
            .update({ closed_at: null, closure_report: null })
            .in('id', courseIds)
        if (error) throw error
    },

    /** Activa o desactiva la vinculación de alumnos de un ramo. */
    async setStudentsEnabled(courseId: string, enabled: boolean) {
        const { error } = await supabase
            .from('courses')
            .update({ students_enabled: enabled })
            .eq('id', courseId)
        if (error) throw error
    },
}
