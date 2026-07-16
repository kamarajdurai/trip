import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
        return res.status(200).json({ status: "Service Active" });
    }

    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        const { prompt } = body || {};
        if (!prompt) return res.status(400).json({ error: "Prompt is required" });

        // Gather all API keys from environment variables dynamically (GEMINI_API_KEY, GEMINI_API_KEY_2, ...)
        const apiKeys = [];
        if (process.env.GEMINI_API_KEY) {
            apiKeys.push(process.env.GEMINI_API_KEY);
        }
        let keyIndex = 2;
        while (process.env[`GEMINI_API_KEY_${keyIndex}`]) {
            apiKeys.push(process.env[`GEMINI_API_KEY_${keyIndex}`]);
            keyIndex++;
        }

        if (apiKeys.length === 0) {
            return res.status(500).json({ error: "API Key missing. Please configure GEMINI_API_KEY in Vercel settings." });
        }

        // Models to try in order of preference
        const modelsToTry = [
            "gemini-2.5-flash",
            "gemini-1.5-flash"
        ];

        let lastError = null;
        let successfulResponse = null;

        // Try models sequentially
        for (const modelName of modelsToTry) {
            // For each model, try to use API keys in round-robin/random starting order
            const startIndex = Math.floor(Math.random() * apiKeys.length);
            let attempts = 0;

            while (attempts < apiKeys.length) {
                const currentKeyIndex = (startIndex + attempts) % apiKeys.length;
                const apiKey = apiKeys[currentKeyIndex];

                try {
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    
                    successfulResponse = {
                        text: response.text(),
                        model: modelName,
                        keyIndexUsed: currentKeyIndex
                    };
                    break; // Successfully got response, exit the key rotation loop
                } catch (e) {
                    lastError = e;
                    console.error(`Attempt with model ${modelName} and Key Index ${currentKeyIndex} failed:`, e.message);

                    // Check if it is a rate limit (429), quota issue, or transient error. If so, failover to the next key.
                    const isRateLimitOrQuota = e.status === 429 || e.status === 403 || e.message?.includes("quota") || e.message?.includes("limit");
                    const isTransientServerError = e.status >= 500;

                    if (isRateLimitOrQuota || isTransientServerError) {
                        attempts++;
                        continue;
                    }

                    // For other errors (e.g. invalid model name/bad request), don't try other keys for this model
                    break;
                }
            }

            if (successfulResponse) {
                return res.status(200).json(successfulResponse);
            }
        }

        // If all models and keys failed
        return res.status(lastError?.status || 500).json({
            error: lastError?.message || "All models and API keys failed to respond",
            suggestion: "If you see status 429 or 403, your API keys may have reached their limits. Check your Vercel environment variables or Google AI Studio billing/plan.",
            diagnostic: {
                attemptedModels: modelsToTry,
                totalKeysConfigured: apiKeys.length,
                lastFailureStatus: lastError?.status
            }
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
