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

    const manifest = course.drive_files_manifest || [];
    const fileTreeSummary = manifest.length > 0
      ? manifest.map(f => `- [${f.category || 'documento'}] ${f.path}`).join("\n")
      : "Sin archivos indexados en el cuaderno de Google Drive aún.";

    const prompt = `Eres un experto pedagógico en diseño curricular para la educación superior.
Analiza la siguiente estructura de archivos del Cuaderno de Google Drive del curso "${course.name}" (${course.code}):

ESTRUCTURA DEL CUADERNO DEL CURSO (ARCHIVOS Y SUBCARPETAS):
${fileTreeSummary}

DESCRIPCIÓN Y OBJETIVOS DEL CURSO:
${course.description}

TAREA:
Genera una propuesta de planificación académica estructurada semanalmente para el semestre.
Responde estrictamente en formato JSON con la siguiente estructura:
{
  "resumen_ejecutivo": "string con una síntesis pedagógica de la planificación basada en los materiales del cuaderno",
  "semanas": [
    {
      "semana": 1,
      "unidad": "Nombre de la unidad temática",
      "tema": "Tema específico de la clase",
      "aprendizaje_esperado": "Resultado de Aprendizaje (RA) u objetivo",
      "archivos_referenciados": ["Ruta o nombre de archivos del cuaderno utilizados"],
      "actividades_sugeridas": ["Actividad 1", "Actividad 2"],
      "mision_gamificada": {
        "titulo": "Título de la misión",
        "descripcion": "Descripción del desafío autónomo o grupal",
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
