import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { generateWithFallback } from "./geminiClient";

export const planCourseFromDriveNotebook = action({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const course = await ctx.runQuery(api.courses.getCourseById, { courseId: args.courseId });
    if (!course) {
      throw new Error("Curso no encontrado");
    }

    const manifest = (course as any).drive_files_manifest || [];
    const fileTreeSummary = manifest.length > 0
      ? manifest.map((f: any) => `- [${f.category || 'documento'}] ${f.path}`).join("\n")
      : "Sin archivos indexados en el cuaderno de Google Drive aún.";

    const notebookMarkdown = (course as any).drive_notebook_text;
    const fileContentOrSummary = notebookMarkdown && notebookMarkdown.length > 50
      ? `CUADERNO CONSOLIDADO DEL RAMO EN MARKDOWN (.MD):\n${notebookMarkdown.substring(0, 500000)}`
      : `DOCUMENTOS Y ARCHIVOS DISPONIBLES EN EL CUADERNO DE DRIVE:\n${fileTreeSummary}`;

    const prompt = `Actúa como un experto en diseño instruccional y planificación académica. Tu tarea es organizar las sesiones de clases para el curso "${course.name}" (${course.code}) basándote exclusivamente en los documentos e insumos del cuaderno de Google Drive.

INSTRUCCIONES DE ESTRUCTURA:
- Distribución Temporal: La planificación debe cubrir 16 semanas. Cada semana cuenta con 1 sesión teórica (cátedra) y 1 sesión práctica/laboratorio.
- Uso de Fuentes:
  * Utiliza el PDA (Plan Didáctico de Aula) para definir la duración de cada Experiencia de Aprendizaje (EA) y las ponderaciones de las evaluaciones.
  * Guíate por la 'Información de uso docente' de cada actividad para determinar el contenido y objetivo específico de cada sesión semana a semana.
  * Asegura que los contenidos cubran los Indicadores de Logro (IL) detallados en el PA (Programa de Asignatura) y el PIA (Plan Instruccional).
- Reglas de Evaluación:
  * Las evaluaciones sumativas deben programarse al final de cada Experiencia de Aprendizaje (EA).
  * Las evaluaciones teóricas se realizan en horario de teoría y las prácticas en horario de laboratorio. Cada evaluación consume una sesión completa.
- Hitos Finales:
  * La Semana 15 debe reservarse exclusivamente para evaluaciones atrasadas, recuperativas y resolución de dudas finales.
  * La Semana 16 debe enfocarse en la preparación intensiva y simulacros para el Examen Transversal (ET).

CONTENIDO DEL CUADERNO CONSOLIDADO DE DRIVE (.MD):
${fileContentOrSummary}

DESCRIPCIÓN GENERAL DEL CURSO:
${course.description || "Sin descripción adicional."}

FORMATO DE SALIDA (ESTRICTAMENTE JSON VÁLIDO):
Responde ÚNICAMENTE en formato JSON con la siguiente estructura:
{
  "resumen_ejecutivo": "Síntesis pedagógica de la planificación detallando la alineación con PDA, PA, PIA y documentos docentes",
  "semanas": [
    {
      "semana": 1,
      "unidad": "Experiencia de Aprendizaje (EA)",
      "tema": "Tema de la semana",
      "aprendizaje_esperado": "Resultado / Indicador de Logro (IL)",
      "archivos_referenciados": ["Nombres exactos de PPTs, Guías de taller o Pautas a utilizar esta semana"],
      "actividades_sugeridas": ["Actividad teórica de cátedra", "Actividad práctica de laboratorio/taller"],
      "tiene_evaluacion": false,
      "tipo_evaluacion": "ninguna",
      "ponderacion": 0,
      "mision_gamificada": {
        "titulo": "Título de la misión",
        "descripcion": "Desafío autónomo o grupal alineado con los insumos docentes",
        "puntos_exp": 100
      }
    }
  ]
}`;

    const responseText = await generateWithFallback(prompt);
    
    try {
      return JSON.parse(responseText);
    } catch {
      return {
        resumen_ejecutivo: responseText,
        semanas: []
      };
    }
  },
});
