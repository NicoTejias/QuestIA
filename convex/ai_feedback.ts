import { action } from "./_generated/server";
import { v } from "convex/values";

export const getGroupFeedback = action({
    args: {
        groupsData: v.array(v.object({
            name: v.string(),
            members: v.array(v.object({
                name: v.string(),
                belbinRole: v.string(),
                belbinCategory: v.string(),
            })),
            stats: v.any(),
        })),
    },
    handler: async (_ctx, args) => {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY no configurada");
        }

        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        const groupSummary = args.groupsData.map(g => {
            const members = g.members.map(m => `${m.name} (${m.belbinRole} - ${m.belbinCategory})`).join(", ");
            return `Grupo: ${g.name}\nIntegrantes: ${members}\nEstadísticas: Mental:${g.stats.mental}, Social:${g.stats.social}, Acción:${g.stats.accion || g.stats.acción || 0}`;
        }).join("\n\n");

        const prompt = `Eres un experto en dinámicas de equipo y los roles de Belbin. 
He generado los siguientes grupos para una clase universitaria. 
Analiza la composición de los grupos y proporciona:
1. Un breve comentario sobre el equilibrio general de la clase.
2. Identifica si hay algún grupo con un desequilibrio crítico (ej. falta de roles de acción o exceso de roles mentales).
3. Sugerencias rápidas para que el docente facilite el trabajo en estos equipos.

GRUPOS GENERADOS:
${groupSummary}

Responde en español, con un tono profesional y alentador. Sé conciso pero útil.`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    },
});
