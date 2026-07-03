/**
 * Cliente de IA con fallback automático entre múltiples modelos.
 * Orden de prioridad:
 *   1. Gemini 2.0 Flash  (rápido, cuota gratuita limitada)
 *   2. Gemini 1.5 Flash  (fallback Gemini, cuota separada)
 *   3. OpenAI GPT-4o-mini (fallback si OPENAI_API_KEY está configurada)
 *
 * Para producción: configura OPENAI_API_KEY en las variables de entorno de Convex.
 * npx convex env set OPENAI_API_KEY sk-...
 */

// Cascada de modelos reales, del más capaz al más disponible bajo alta demanda.
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash"];

// Errores transitorios: cuota (429) o sobrecarga del modelo (503). En ambos casos
// tiene sentido probar el siguiente modelo de la cascada.
function isTransientError(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err);
    return msg.includes("429") || msg.includes("Too Many Requests") || msg.includes("quota") ||
        msg.includes("503") || msg.includes("500") || msg.includes("high demand") ||
        msg.includes("overloaded") || msg.includes("UNAVAILABLE");
}

async function tryGemini(key: string, model: string, prompt: string): Promise<string> {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(key);
    const genModel = genAI.getGenerativeModel({ model });
    const result = await genModel.generateContent(prompt);
    return result.response.text();
}

async function tryOpenAI(key: string, prompt: string): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        }),
    });
    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenAI error ${response.status}: ${err}`);
    }
    const data: any = await response.json();
    return data.choices[0].message.content;
}

/**
 * Genera contenido con IA usando fallback automático entre proveedores.
 * Lanza error solo si TODOS los proveedores fallan.
 */
export async function generateWithFallback(prompt: string): Promise<string> {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    const errors: string[] = [];

    // Intentar cada modelo de Gemini en orden
    if (geminiKey) {
        for (const model of GEMINI_MODELS) {
            try {
                return await tryGemini(geminiKey, model, prompt);
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                errors.push(`${model}: ${msg.substring(0, 120)}`);
                if (!isTransientError(err)) {
                    // Error que no es transitorio (cuota/sobrecarga) → no tiene sentido probar otro modelo
                    break;
                }
                // Cuota agotada o modelo sobrecargado → probar el siguiente modelo
            }
        }
    }

    // Fallback a OpenAI
    if (openaiKey) {
        try {
            return await tryOpenAI(openaiKey, prompt);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`openai/gpt-4o-mini: ${msg.substring(0, 120)}`);
        }
    }

    // Todos fallaron
    if (!geminiKey && !openaiKey) {
        throw new Error("No hay API keys configuradas. Configura GEMINI_API_KEY o OPENAI_API_KEY.");
    }

    const isAllTransient = errors.every(e => isTransientError(new Error(e)));
    if (isAllTransient) {
        throw new Error(
            "Los modelos de IA están con alta demanda o cuota agotada temporalmente. Espera unos minutos e intenta de nuevo, " +
            "o configura OPENAI_API_KEY como respaldo: npx convex env set OPENAI_API_KEY sk-..."
        );
    }

    throw new Error(`Fallo al comunicarse con IA: ${errors.join(" | ")}`);
}

/** @deprecated Usa generateWithFallback(prompt) directamente */
export async function getGeminiModel(modelName = "gemini-2.5-flash") {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY no configurada");
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(key);
    return genAI.getGenerativeModel({ model: modelName });
}
