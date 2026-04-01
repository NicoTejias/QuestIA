/**
 * Helper centralizado para inicializar el cliente de Gemini.
 * Evita duplicar la inicialización en cada action que usa IA.
 */
export async function getGeminiModel(modelName = "gemini-3.1-flash") {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY no configurada");
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(key);
    return genAI.getGenerativeModel({ model: modelName });
}
