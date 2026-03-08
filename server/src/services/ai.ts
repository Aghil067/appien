import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Smart Logic to determine expiry using Gemini 1.5 Flash.
 * Falls back to local logic if NO API key or error.
 */
export const determineExpiryWithAI = async (questionText: string): Promise<Date> => {
    const now = new Date();
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
        You are an AI for a hyper-local question app. Determine the useful lifespan of this question in HOURS.
        Context: The user is asking this NOW.
        
        Question: "${questionText}"
        
        Rules:
        1. "Midnight" / "Tonight" -> Calculate hours remaining until 11:59 PM tonight.
        2. "Urgent" / "ASAP" / "Emergency" -> 1 or 2 hours.
        3. "This weekend" -> 48 to 72 hours.
        4. "Buying/Selling/Rent" -> 168 hours (1 week).
        5. General query -> 24 hours.
        
        Return ONLY a single number (integer or float). No text.
      `;

            const result = await model.generateContent(prompt);
            const output = result.response.text();
            const hours = parseFloat(output.trim());

            if (!isNaN(hours) && hours > 0) {
                console.log(`🧠 AI Decided Expiry: ${hours} hours for "${questionText}"`);
                return new Date(now.getTime() + hours * 60 * 60 * 1000);
            }
        } catch (e) {
            console.warn("⚠️ AI Expiry unavailable, using smart rules fallback.");
        }
    }

    // --- FALLBACK LOGIC ---
    const lower = questionText.toLowerCase();
    let hours = 24;

    if (lower.match(/\b(urgent|asap|emergency|help|stuck|now|quick|fast)\b/)) hours = 2;
    else if (lower.match(/\b(tonight|dinner|lunch|evening|today|midnight)\b/)) {
        const midnight = new Date();
        midnight.setHours(23, 59, 59, 999);
        return midnight;
    }
    else if (lower.match(/\b(weekend|saturday|sunday)\b/)) hours = 72;
    else if (lower.match(/\b(buy|sell|rent|found|lost|lease|selling|buying)\b/)) hours = 168;

    console.log(`⚙️ Rules Decided Expiry: ${hours} hours`);
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
};