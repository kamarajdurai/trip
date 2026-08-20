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

        // Try OpenRouter API first if available
        const openRouterKey = process.env.OPENROUTER_API_KEY || "";

        if (openRouterKey) {
            const openRouterModels = [
                "google/gemini-2.0-flash-lite-001",
                "google/gemini-2.0-flash-001",
                "meta-llama/llama-3.3-70b-instruct:free",
                "deepseek/deepseek-r1:free",
                "google/gemini-flash-1.5"
            ];

            for (const modelName of openRouterModels) {
                try {
                    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${openRouterKey}`,
                            "HTTP-Referer": "http://localhost:5173",
                            "X-Title": "TN AI Travel Planner",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            model: modelName,
                            messages: [{ role: "user", content: prompt }]
                        })
                    });

                    const data = await response.json();
                    if (response.ok && data.choices?.[0]?.message?.content) {
                        return res.status(200).json({
                            text: data.choices[0].message.content,
                            model: `OpenRouter (${modelName})`
                        });
                    } else if (data?.error?.message) {
                        console.error(`OpenRouter model ${modelName} error:`, data.error.message);
                    }
                } catch (e) {
                    console.error(`OpenRouter fetch error for ${modelName}:`, e.message);
                }
            }
        }

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

        // Flash models available on Gemini API
        const modelsToTry = [
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-flash-002",
            "gemini-2.5-flash"
        ];

        let lastError = null;
        let successfulResponse = null;

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Try models sequentially
        for (const modelName of modelsToTry) {
            const startIndex = Math.floor(Math.random() * apiKeys.length);
            let attempts = 0;
            const maxAttempts = apiKeys.length * 2; // Allow up to 2 retries per key for rate limits

            while (attempts < maxAttempts) {
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
                    break; // Successfully got response, exit key loop
                } catch (e) {
                    console.error(`Attempt with model ${modelName} (Key index ${currentKeyIndex}) failed:`, e.message);

                    const isRateLimitOrQuota = e.status === 429 || e.status === 403 || e.message?.includes("quota") || e.message?.includes("limit") || e.message?.includes("429") || e.message?.includes("RESOURCE_EXHAUSTED");
                    const isNotFound = e.status === 404 || e.message?.includes("404") || e.message?.includes("not found");
                    const isLimitZero = e.message?.includes("limit: 0");

                    // Prioritize quota/rate limit errors over 404 or limit:0 errors
                    if (isRateLimitOrQuota || !lastError || (!isNotFound && !isLimitZero)) {
                        lastError = e;
                    }

                    if (isLimitZero || isNotFound) {
                        // Model not allowed or not found for this key tier, skip to next model
                        break;
                    }

                    const isTransientServerError = e.status >= 500;

                    if (isRateLimitOrQuota || isTransientServerError) {
                        attempts++;
                        if (attempts < maxAttempts) {
                            // Pause briefly (2.5s) to allow rate-limit window to clear
                            await sleep(2500);
                            continue;
                        }
                    }

                    break;
                }
            }

            if (successfulResponse) {
                return res.status(200).json(successfulResponse);
            }
        }

        // Extract friendly error message
        let userErrorMsg = "Gemini API rate limit or quota exceeded. Please wait a few seconds and try again.";
        if (lastError?.message) {
            if (lastError.message.includes("429") || lastError.message.includes("Quota") || lastError.message.includes("quota") || lastError.message.includes("limit") || lastError.message.includes("RESOURCE_EXHAUSTED")) {
                userErrorMsg = "Gemini API rate limit reached. Please wait a few seconds before generating another itinerary.";
            } else if (lastError.message.includes("404") || lastError.message.includes("not found")) {
                userErrorMsg = "Gemini API service temporarily unavailable. Please try again in a few moments.";
            } else {
                userErrorMsg = lastError.message;
            }
        }

        return res.status(lastError?.status || 429).json({
            error: userErrorMsg,
            diagnostic: {
                attemptedModels: modelsToTry,
                totalKeysConfigured: apiKeys.length,
                lastFailureMessage: lastError?.message
            }
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
