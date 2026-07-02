import { action } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { api } from "./_generated/api";
import { generateWithFallback } from "./geminiClient";

const FERIADOS_DUOC_2026 = [
  // 1er Semestre 2026-1 (Rango de clases: 09-03-2026 al 21-07-2026)
  { fecha: "2026-04-02", nombre: "Víspera de Semana Santa (Media Jornada - Suspensión desde 13:00 Hrs)", media_jornada: true, hora_limite: "13:00" },
  { fecha: "2026-04-03", nombre: "Semana Santa (Viernes Santo)", media_jornada: false },
  { fecha: "2026-04-04", nombre: "Semana Santa (Sábado Santo)", media_jornada: false },
  { fecha: "2026-05-01", nombre: "Día del Trabajo", media_jornada: false },
  { fecha: "2026-05-21", nombre: "Día de las Glorias Navales", media_jornada: false },
  { fecha: "2026-06-21", nombre: "Día Nacional de los Pueblos Indígenas", media_jornada: false },
  { fecha: "2026-06-29", nombre: "San Pedro y San Pablo", media_jornada: false },
  { fecha: "2026-07-16", nombre: "Día de la Virgen del Carmen", media_jornada: false },

  // 2do Semestre 2026-2 (Rango de clases: 10-08-2026 al 22-12-2026)
  { fecha: "2026-08-15", nombre: "Asunción de la Virgen", media_jornada: false },
  { fecha: "2026-09-17", nombre: "Víspera de Fiestas Patrias (Media Jornada - Suspensión desde 13:00 Hrs)", media_jornada: true, hora_limite: "13:00" },
  { fecha: "2026-09-18", nombre: "Fiestas Patrias", media_jornada: false },
  { fecha: "2026-09-19", nombre: "Glorias del Ejército", media_jornada: false },
  { fecha: "2026-10-12", nombre: "Encuentro de Dos Mundos", media_jornada: false },
  { fecha: "2026-10-31", nombre: "Día de las Iglesias Evangélicas y Protestantes", media_jornada: false },
  { fecha: "2026-11-01", nombre: "Día de Todos los Santos", media_jornada: false },
  { fecha: "2026-11-11", nombre: "Aniversario Duoc UC (Suspensión desde las 15:15 Hrs)", media_jornada: true, hora_limite: "15:15" },
  { fecha: "2026-12-08", nombre: "Inmaculada Concepción", media_jornada: false },
  { fecha: "2026-12-24", nombre: "Víspera de Navidad (Media Jornada - Suspensión desde 13:00 Hrs)", media_jornada: true, hora_limite: "13:00" },
  { fecha: "2026-12-25", nombre: "Día de Navidad", media_jornada: false },
];

function stringifyDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export const generateCalendarFromPDA = action({
    args: {
        course_id: v.id("courses"),
        document_id: v.id("course_documents"),
        semestre: v.union(v.literal("2026-1"), v.literal("2026-2")),
        seccion: v.string(),
        regimen: v.union(v.literal("diurno"), v.literal("vespertino")),
        semanas_semestre: v.number(),
        dias_semana: v.array(v.number()), // [1, 3] = Lunes, Miércoles (1=Lunes, ..., 6=Sábado)
        bloques_horario: v.array(v.string()), // ["1-2", "11-12"]
        dias_tipo: v.optional(v.record(v.string(), v.union(v.literal("catedra"), v.literal("laboratorio")))),
        sesiones_horario: v.optional(v.array(v.object({
            dia: v.number(),
            tipo: v.union(v.literal("catedra"), v.literal("laboratorio")),
        }))),
        fecha_inicio: v.number(), // Timestamp ms de la primera clase
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new ConvexError("No autenticado");

        // Obtener el documento maestro PDA
        const doc = await ctx.runQuery(api.documents.getDocumentById, {
            document_id: args.document_id,
        });
        if (!doc) throw new ConvexError("Documento no encontrado");

        if (!doc.content_text || doc.content_text.length < 50) {
            throw new ConvexError("El PDA no contiene suficiente texto legible.");
        }

        // 1. Guardar la configuración de horario y régimen en el curso
        await ctx.runMutation(api.calendar.saveScheduleConfig, {
            course_id: args.course_id,
            schedule_config: {
                semestre: args.semestre,
                seccion: args.seccion,
                regimen: args.regimen,
                semanas_semestre: args.semanas_semestre,
                dias_semana: args.dias_semana,
                bloques_horario: args.bloques_horario,
                fecha_inicio: args.fecha_inicio,
            },
        });

        // 2. Limpiar clases previas del calendario
        await ctx.runMutation(api.calendar.limpiarCalendario, {
            course_id: args.course_id,
        });

        // Sesiones por semana reales: cada (día, tipo) es una sesión distinta.
        // Si no llega sesiones_horario (compatibilidad), se asume 1 sesión por día.
        const sesionesHorario = args.sesiones_horario && args.sesiones_horario.length > 0
            ? args.sesiones_horario
            : args.dias_semana.map((dia) => ({ dia, tipo: (args.dias_tipo?.[String(dia)] || "catedra") as "catedra" | "laboratorio" }));
        const sesionesPorSemana = sesionesHorario.length;
        const tieneCatedra = sesionesHorario.some((s) => s.tipo === "catedra");
        const tieneLaboratorio = sesionesHorario.some((s) => s.tipo === "laboratorio");

        // 3. Prompt de Gemini
        const content = doc.content_text.substring(0, 40000);
        const prompt = `Eres un asistente de planificación curricular para profesores de Duoc UC.
Analiza el Plan de Aula (PDA) oficial y extrae el temario ORGANIZADO POR SEMANA de la asignatura.
La asignatura dura aproximadamente ${args.semanas_semestre} semanas.

REGLAS DE EXTRACCIÓN:
- Debes devolver exactamente UNA entrada por cada semana del semestre (${args.semanas_semestre} semanas en total), numeradas del 1 al ${args.semanas_semestre}. NO agrupes ni omitas semanas.
- Cada semana de clases se imparte en ${sesionesPorSemana} sesión(es): ${sesionesHorario.map((s) => s.tipo === "laboratorio" ? "una de Laboratorio (práctica/taller)" : "una de Cátedra (teoría)").join(" y ")}.
${tieneCatedra ? '- "contenido_catedra": el contenido TEÓRICO/conceptual de esa semana (lo que se explica en la clase de cátedra).\n' : ""}${tieneLaboratorio ? '- "contenido_laboratorio": la actividad PRÁCTICA/taller de esa semana asociada a la teoría. Debe abordar el MISMO tema de la semana, pero de forma aplicada.\n' : ""}- "titulo": el nombre del tema de la semana.
- "materiales_sugeridos": materiales, software, herramientas o equipos requeridos esa semana.
- EVALUACIONES: marca "tiene_evaluacion": true SOLO en las semanas donde el PDA indica EXPLÍCITAMENTE una evaluación calificada (una fecha/semana concreta con Prueba, Certamen, Examen, Encargo o Presentación con nota). NO marques evaluación por el solo hecho de que el texto mencione "evaluación", "actividad evaluada", "rúbrica" o "ponderación" de forma general. Ante la duda, deja "tiene_evaluacion": false. Es normal que la mayoría de las semanas NO tengan evaluación; típicamente hay solo 2 a 4 en todo el semestre y rara vez en semanas consecutivas.
- Si el contenido incluye varios documentos (marcados con "=== DOCUMENTO: ... ==="), prioriza el que contenga la programación semanal del ramo (el PDA/planificación) para el temario y las fechas de evaluación.

CONTENIDO DEL PDA:
${content}

RESPONDE ÚNICAMENTE en formato JSON válido, sin markdown ni backticks, utilizando estrictamente este formato (una entrada por semana):
{
  "semanas": [
    {
      "semana": 1,
      "titulo": "Tema de la semana",
      "contenido_catedra": "Contenido teórico a dictar en cátedra",
      "contenido_laboratorio": "Actividad práctica/taller de laboratorio de esa semana",
      "materiales_sugeridos": "Materiales, software o equipos requeridos",
      "tiene_evaluacion": false,
      "tipo_evaluacion": "ninguna",
      "titulo_evaluacion": ""
    }
  ]
}`;

        let responseText = "";
        try {
            responseText = await generateWithFallback(prompt);
        } catch (err: any) {
            throw new ConvexError(`Fallo al comunicarse con IA: ${err.message}`);
        }

        // Parsear JSON
        let semanasPDA: any[] = [];
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found");
            const parsed = JSON.parse(jsonMatch[0]);
            // Nuevo formato (por semana) con compatibilidad hacia el anterior (por sesión).
            semanasPDA = parsed.semanas || parsed.sesiones || [];
        } catch (e: any) {
            throw new ConvexError("No se pudo procesar la respuesta JSON del asistente. Intenta de nuevo.");
        }

        if (semanasPDA.length === 0) {
            throw new ConvexError("No se detectaron contenidos válidos en el PDA.");
        }

        // Indexar el contenido por número de semana.
        const contenidoPorSemana = new Map<number, any>();
        semanasPDA.forEach((s: any, idx: number) => {
            const num = Number(s.semana) || (idx + 1);
            if (!contenidoPorSemana.has(num)) contenidoPorSemana.set(num, s);
        });

        // 4. Algoritmo de Fechas cruzando con el Calendario de Duoc UC 2026
        const clasesFinales: any[] = [];
        
        // Obtener el lunes de la semana de inicio como punto de referencia
        const getMondayOfDate = (d: Date): Date => {
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d);
            monday.setDate(diff);
            monday.setHours(12, 0, 0, 0);
            return monday;
        };

        const startTemp = new Date(args.fecha_inicio);
        startTemp.setHours(12, 0, 0, 0);

        const getNextClassDate = (timestamp: number): number => {
            const temp = new Date(timestamp);
            temp.setHours(12, 0, 0, 0);
            let loops = 0;
            while (loops < 14) {
                temp.setDate(temp.getDate() + 1);
                // getDay(): 0=Domingo, 1=Lunes, ..., 6=Sábado
                const dayOfWeek = temp.getDay();
                if (args.dias_semana.includes(dayOfWeek)) {
                    return temp.getTime();
                }
                loops++;
            }
            return timestamp + 24 * 60 * 60 * 1000;
        };

        const getFirstClassDate = (timestamp: number): number => {
            const temp = new Date(timestamp);
            temp.setHours(12, 0, 0, 0);
            const dayOfWeek = temp.getDay();
            if (args.dias_semana.includes(dayOfWeek)) {
                return temp.getTime();
            }
            return getNextClassDate(timestamp);
        };

        // Fecha del primer día de clases (define la Semana 1)
        const firstClassTimestamp = getFirstClassDate(startTemp.getTime());
        const firstClassMonday = getMondayOfDate(new Date(firstClassTimestamp));

        // Devuelve el timestamp (mediodía local) del día `dayOfWeek` dentro de la semana cuyo lunes es `mondayTs`.
        const getDateOfDayInWeek = (mondayTs: number, dayOfWeek: number): number => {
            const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const d = new Date(mondayTs);
            d.setDate(d.getDate() + offset);
            d.setHours(12, 0, 0, 0);
            return d.getTime();
        };

        let correlativoSesion = 1;

        // El NÚMERO de sesiones por semana lo determina el HORARIO del profesor (sesionesHorario),
        // NO la cantidad de objetos que devuelva la IA. Por cada semana generamos una sesión por
        // cada slot (día + tipo): así cátedra y laboratorio de una misma semana son 2 sesiones.
        for (let semanaIndex = 1; semanaIndex <= args.semanas_semestre; semanaIndex++) {
            const mondayTs = firstClassMonday.getTime() + (semanaIndex - 1) * 7 * 24 * 60 * 60 * 1000;
            const temaSemana = contenidoPorSemana.get(semanaIndex) || {};
            // La evaluación de la semana se asigna a UNA sola sesión, no a todas.
            let evaluacionAsignada = false;

            for (const slot of sesionesHorario) {
                const cleanTimestamp = getDateOfDayInWeek(mondayTs, slot.dia);
                const dateObj = new Date(cleanTimestamp);
                const dateStr = stringifyDate(dateObj);
                const feriado = FERIADOS_DUOC_2026.find(f => f.fecha === dateStr);

                if (feriado) {
                    let suspenderClase = true;
                    if (feriado.media_jornada && feriado.hora_limite) {
                        suspenderClase = args.regimen === "vespertino";
                    }
                    if (suspenderClase) {
                        clasesFinales.push({
                            semana: semanaIndex,
                            sesion: correlativoSesion,
                            fecha: cleanTimestamp,
                            titulo: `Feriado: ${feriado.nombre}`,
                            contenido: "Clase suspendida por feriado oficial en el calendario institucional.",
                            tiene_evaluacion: false,
                            es_feriado: true,
                            detalle_feriado: feriado.nombre,
                            estado: "suspendida",
                            tipo_bloque: slot.tipo
                        });
                        correlativoSesion++;
                        continue;
                    }
                }

                const esLab = slot.tipo === 'laboratorio';
                const contenido = esLab
                    ? (temaSemana.contenido_laboratorio || temaSemana.contenido || 'Actividad práctica de la semana.')
                    : (temaSemana.contenido_catedra || temaSemana.contenido || 'Contenido teórico de la semana.');

                // La evaluación aplica a UNA sola sesión de la semana (la primera que se genere).
                const estaSesionTieneEval = !!temaSemana.tiene_evaluacion && !evaluacionAsignada;
                if (estaSesionTieneEval) evaluacionAsignada = true;

                const tituloBase = temaSemana.titulo || `Semana ${semanaIndex}`;
                const sufijo = esLab ? ' (Laboratorio)' : (tieneLaboratorio ? ' (Cátedra)' : '');
                const tipoBloque = estaSesionTieneEval ? 'evaluacion' : slot.tipo;

                clasesFinales.push({
                    semana: semanaIndex,
                    sesion: correlativoSesion,
                    fecha: cleanTimestamp,
                    titulo: `${tituloBase}${sufijo}`,
                    contenido,
                    actividades: esLab ? (temaSemana.contenido_laboratorio || undefined) : undefined,
                    materiales_requeridos: temaSemana.materiales_sugeridos || undefined,
                    tiene_evaluacion: estaSesionTieneEval,
                    tipo_evaluacion: estaSesionTieneEval && temaSemana.tipo_evaluacion && temaSemana.tipo_evaluacion !== "ninguna" ? temaSemana.tipo_evaluacion : undefined,
                    titulo_evaluacion: estaSesionTieneEval ? (temaSemana.titulo_evaluacion || undefined) : undefined,
                    estado: "programada",
                    tipo_bloque: tipoBloque
                });

                correlativoSesion++;
            }
        }

        // 5. Inserción masiva final en la base de datos
        await ctx.runMutation(api.calendar.bulkInsertClases, {
            course_id: args.course_id,
            clases: clasesFinales,
        });

        return { success: true, count: clasesFinales.length };
    },
});
