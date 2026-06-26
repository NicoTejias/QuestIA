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

        // 3. Prompt de Gemini
        const content = doc.content_text.substring(0, 15000);
        const prompt = `Eres un asistente de planificación curricular para profesores de Duoc UC.
Analiza el Plan de Aula (PDA) oficial y extrae de forma secuencial y detallada la lista de sesiones de clases del ramo.
La asignatura dura aproximadamente ${args.semanas_semestre} semanas.

REGLAS DE EXTRACCIÓN:
- Extrae todas las clases secuenciales.
- Para cada clase extrae: semana, sesión correlativa, título del tema, contenido a dictar, actividades que harán y materiales requeridos (laboratorio, software, instrumentos o guías de ejercicio).
- Si la sesión corresponde a una evaluación (Prueba Escrita, Examen, Encargo o Presentación de Trabajo), indícalo en tiene_evaluacion: true, con el tipo_evaluacion respectivo.

CONTENIDO DEL PDA:
${content}

RESPONDE ÚNICAMENTE en formato JSON válido, sin markdown ni backticks, utilizando estrictamente este formato:
{
  "sesiones": [
    {
      "semana": 1,
      "sesion": 1,
      "titulo": "Título de la clase",
      "contenido": "Detalle del contenido que se enseñará en esta clase",
      "actividades": "Actividad práctica o teórica de aula",
      "materiales_sugeridos": "Materiales, software, herramientas o equipos requeridos",
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
        let sesiones: any[] = [];
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found");
            const data = JSON.parse(jsonMatch[0]);
            sesiones = data.sesiones || [];
        } catch (e: any) {
            throw new ConvexError("No se pudo procesar la respuesta JSON del asistente. Intenta de nuevo.");
        }

        if (sesiones.length === 0) {
            throw new ConvexError("No se detectaron sesiones válidas en el PDA.");
        }

        // 4. Algoritmo de Fechas cruzando con el Calendario de Duoc UC 2026
        const clasesFinales: any[] = [];
        let currentTimestamp = args.fecha_inicio;

        // Ayudante para avanzar al siguiente día programado en el horario del profesor
        const getNextClassDate = (timestamp: number): number => {
            let temp = new Date(timestamp);
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
            return timestamp + 24 * 60 * 60 * 1000; // fallback a 1 día
        };

        let sesionIndex = 0;
        let correlativoSesion = 1;

        while (sesionIndex < sesiones.length) {
            const sesionIA = sesiones[sesionIndex];
            const dateObj = new Date(currentTimestamp);
            const dateStr = stringifyDate(dateObj);

            // Revisar si la fecha actual es feriado
            const feriado = FERIADOS_DUOC_2026.find(f => f.fecha === dateStr);

            if (feriado) {
                let suspenderClase = true;

                // Si es víspera o media jornada, revisar si el bloque horario del profe colisiona con el horario de suspensión
                if (feriado.media_jornada && feriado.hora_limite) {
                    // Por simplicidad, consideramos que si el régimen es vespertino o la clase es en la tarde/noche (típicamente bloques > 8 en Duoc, p.ej. bloques de vespertino), se suspende.
                    if (args.regimen === "vespertino") {
                        suspenderClase = true;
                    } else {
                        // En régimen diurno, si el horario inicia después de la hora límite, se suspende
                        // Si no, se dicta normalmente
                        suspenderClase = false; 
                    }
                }

                if (suspenderClase) {
                    // Añadimos una clase de tipo Feriado/Suspendida al calendario
                    clasesFinales.push({
                        semana: Math.ceil(correlativoSesion / args.dias_semana.length) || 1,
                        sesion: correlativoSesion,
                        fecha: currentTimestamp,
                        titulo: `Feriado: ${feriado.nombre}`,
                        contenido: "Clase suspendida por feriado oficial en el calendario institucional.",
                        tiene_evaluacion: false,
                        es_feriado: true,
                        detalle_feriado: feriado.nombre,
                        estado: "suspendida",
                    });

                    correlativoSesion++;
                    currentTimestamp = getNextClassDate(currentTimestamp);
                    // NO incrementamos el index de la IA para que el contenido se dicte en la siguiente sesión válida
                    continue;
                }
            }

            // Si no es feriado, registramos la clase real de contenido del PDA
            clasesFinales.push({
                semana: sesionIA.semana || Math.ceil(correlativoSesion / args.dias_semana.length) || 1,
                sesion: correlativoSesion,
                fecha: currentTimestamp,
                titulo: sesionIA.titulo,
                contenido: sesionIA.contenido,
                actividades: sesionIA.actividades,
                materiales_requeridos: sesionIA.materiales_sugeridos,
                tiene_evaluacion: sesionIA.tiene_evaluacion,
                tipo_evaluacion: sesionIA.tipo_evaluacion !== "ninguna" ? sesionIA.tipo_evaluacion : undefined,
                titulo_evaluacion: sesionIA.titulo_evaluacion || undefined,
                estado: "programada",
            });

            correlativoSesion++;
            currentTimestamp = getNextClassDate(currentTimestamp);
            sesionIndex++;
        }

        // 5. Inserción masiva final en la base de datos
        await ctx.runMutation(api.calendar.bulkInsertClases, {
            course_id: args.course_id,
            clases: clasesFinales,
        });

        return { success: true, count: clasesFinales.length };
    },
});
