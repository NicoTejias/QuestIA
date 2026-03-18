import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("GEMINI_API_KEY not set");
        return;
    }
    const genAI = new GoogleGenerativeAI(key);
    // There is no direct "listModels" in the standard SDK easily accessible without additional permissions usually?
    // But we can try to guess or use the Management API.
    // Actually, one easy way to test if a model exists is to try a small generation.
    
    const modelsToTest = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-3-flash", "gemini-flash-3", "gemini-3.0-flash"];
    
    for (const model of modelsToTest) {
        try {
            const genModel = genAI.getGenerativeModel({ model });
            await genModel.generateContent("ping");
            console.log(`✅ ${model} is working`);
        } catch (e) {
            console.log(`❌ ${model} failed: ${e.message}`);
        }
    }
}

listModels();
