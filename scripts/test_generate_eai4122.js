const SUPABASE_URL = "https://wzkwmiyzszegekpuqnaz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8SlWG-0qPUkcPMvg36hhEA_RFdk8zqb";
const TEACHER_CLERK_ID = "user_3BAuEJEUMRcSXZ7t1EM6pMkVLug";

const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json"
};

const FECHA_INICIO_OFICIAL_2026_2 = '2026-08-10';

const FERIADOS_DUOC_2026 = [
  { fecha: '2026-08-15', motivo: 'Asunción de la Virgen', tipo: 'nacional' },
  { fecha: '2026-09-18', motivo: 'Fiestas Patrias (Independencia Nacional)', tipo: 'nacional' },
  { fecha: '2026-09-19', motivo: 'Día de las Glorias del Ejército', tipo: 'nacional' },
  { fecha: '2026-10-12', motivo: 'Encuentro de Dos Mundos', tipo: 'nacional' },
  { fecha: '2026-10-31', motivo: 'Día de las Iglesias Evangélicas y Protestantes', tipo: 'nacional' },
  { fecha: '2026-11-01', motivo: 'Día de Todos los Santos', tipo: 'nacional' },
  { fecha: '2026-11-11', motivo: 'Día Institucional Duoc UC (Suspensión de Actividades desde 15:15)', tipo: 'institucional' },
  { fecha: '2026-12-08', motivo: 'Inmaculada Concepción', tipo: 'nacional' }
];

function addDays(isoDateStr, days) {
  const [y, m, d] = isoDateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

async function run() {
    console.log("Buscando curso EAI4122...");
    const cRes = await fetch(`${SUPABASE_URL}/rest/v1/courses?code=eq.EAI4122&teacher_id=eq.${TEACHER_CLERK_ID}&select=*`, { headers });
    const [curso] = await cRes.json();
    if (!curso) {
        console.error("No se encontró EAI4122");
        return;
    }
    console.log("Curso encontrado:", curso.id, curso.code, curso.name);

    // Días de la semana para 008D: Lunes (1) y Miércoles (3)
    const horario = [
        { dia: 1, tipo: 'catedra', hora_inicio: '08:30', hora_fin: '10:40' },
        { dia: 3, tipo: 'laboratorio', hora_inicio: '08:30', hora_fin: '10:40' }
    ];

    const clases = [];
    let formativaContador = 1;

    for (let sem = 1; sem <= 18; sem++) {
        const offsetLunesSemana = (sem - 1) * 7;
        const fechaLunes = addDays(FECHA_INICIO_OFICIAL_2026_2, offsetLunesSemana);

        for (let sIdx = 0; sIdx < horario.length; sIdx++) {
            const h = horario[sIdx];
            const offsetDias = h.dia === 0 ? 6 : h.dia - 1;
            const fechaClase = addDays(fechaLunes, offsetDias);

            const feriado = FERIADOS_DUOC_2026.find(f => f.fecha === fechaClase);
            const esFeriado = !!feriado;

            let tieneEval = false;
            let tipoEval = null;
            let tituloEval = null;
            let titulo = `Semana ${sem} - Sesión ${sIdx + 1}: ${h.tipo === 'laboratorio' ? 'Taller Práctico de Mantenimiento' : 'Cátedra Teórica y Diagnóstico'}`;
            let contenido = `Desarrollo de competencias de mantenimiento de instalaciones eléctricas para semana ${sem}.`;

            if (sem === 5 && sIdx === 1) {
                tieneEval = true;
                tipoEval = 'formativa';
                tituloEval = 'Evaluación Formativa 1 (Parcial)';
                titulo = 'Semana 5 - Evaluación Formativa 1: Diagnóstico de Circuitos y Protocolos';
            } else if (sem === 10 && sIdx === 1) {
                tieneEval = true;
                tipoEval = 'formativa';
                tituloEval = 'Evaluación Formativa 2 (Intermedia)';
                titulo = 'Semana 10 - Evaluación Formativa 2: Mantenimiento Preventivo y Motores';
            } else if (sem === 15 && sIdx === 1) {
                tieneEval = true;
                tipoEval = 'formativa';
                tituloEval = 'Evaluación Formativa 3 (Final)';
                titulo = 'Semana 15 - Evaluación Formativa 3: Automatización y Control';
            } else if (sem === 16 && sIdx === 1) {
                tieneEval = true;
                tipoEval = 'examen';
                tituloEval = 'Examen Transversal (ET) - Parte 1';
                titulo = 'Semana 16 - Examen Transversal (ET): Evaluación Teórica / Práctica';
            } else if (sem === 17 && sIdx === 1) {
                tieneEval = true;
                tipoEval = 'examen';
                tituloEval = 'Examen Transversal (ET) - Parte 2 / Cierre';
                titulo = 'Semana 17 - Examen Transversal (ET): Defensa y Cierre de Competencias';
            } else if (sem === 18) {
                titulo = `Semana 18 - Sesión ${sIdx + 1}: Recuperaciones, Rezagados y Cierre de Actas`;
                contenido = 'Atención a estudiantes con evaluaciones pendientes o rezagados, revisión final de calificaciones y cierre de actas institucionales.';
            }

            clases.push({
                course_id: curso.id,
                section: '008D',
                semana: sem,
                sesion: (sem - 1) * 2 + (sIdx + 1),
                fecha: new Date(fechaClase + 'T12:00:00Z').getTime(),
                titulo,
                contenido,
                actividades: esFeriado ? 'Feriado / Suspensión de actividades institucionales' : 'Actividad formativa según Guía de Aprendizaje Duoc UC',
                materiales_requeridos: esFeriado ? null : 'EPP, Instrumentos de medición Fluke, Manual de Taller',
                tiene_evaluacion: tieneEval && !esFeriado,
                evaluacion_id: null,
                es_feriado: esFeriado,
                detalle_feriado: feriado ? feriado.motivo : null,
                estado: esFeriado ? 'suspendida' : 'programada',
                tipo_bloque: h.tipo,
                hora_inicio: h.hora_inicio,
                hora_fin: h.hora_fin,
                created_at: new Date().toISOString()
            });
        }
    }

    console.log(`Generadas ${clases.length} clases. Limpiando previas...`);
    await fetch(`${SUPABASE_URL}/rest/v1/clases_calendarizadas?course_id=eq.${curso.id}&section=eq.008D`, {
        method: 'DELETE',
        headers
    });

    console.log("Insertando en clases_calendarizadas por lote...");
    const insRes = await fetch(`${SUPABASE_URL}/rest/v1/clases_calendarizadas`, {
        method: 'POST',
        headers: {
            ...headers,
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(clases)
    });

    if (!insRes.ok) {
        const errText = await insRes.text();
        console.error("Error al insertar:", insRes.status, errText);
        return;
    }

    const inserted = await insRes.json();
    console.log(`¡Éxito! Se insertaron ${inserted.length} clases en Supabase.`);

    // Consultar feriados y evaluaciones
    const feriadosInsertados = inserted.filter(c => c.es_feriado);
    console.log("Clases marcadas como feriado:", feriadosInsertados.map(f => `Semana ${f.semana} (${f.detalle_feriado})`));

    const evalsInsertadas = inserted.filter(c => c.tiene_evaluacion);
    console.log("Clases con evaluación:", evalsInsertadas.map(e => `Semana ${e.semana} (Sesión ${e.sesion}): ${e.titulo}`));

    // Actualizar curso
    await fetch(`${SUPABASE_URL}/rest/v1/courses?id=eq.${curso.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
            schedule_config: {
                ...curso.schedule_config,
                seccion: '008D',
                semestre: '2026-2',
                fecha_inicio_iso: FECHA_INICIO_OFICIAL_2026_2,
                semanas_semestre: 18,
                generado_automatico: true,
                documentos_verificados: true
            }
        })
    });
    console.log("Curso actualizado con configuración de 18 semanas.");
}

run();
