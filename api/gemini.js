import { GoogleGenerativeAI } from "@google/generative-ai";

async function callGrokAPI(prompt, grokApiKey) {
    if (!grokApiKey) return null;

    const grokModels = [
        "grok-2-latest",
        "grok-beta",
        "grok-2-1212",
        "grok-2",
        "grok-vision-beta"
    ];

    for (const modelName of grokModels) {
        try {
            console.log(`[xAI Grok] Attempting generation with model: ${modelName}`);
            const response = await fetch("https://api.x.ai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${grokApiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        { role: "system", content: "You are an expert Tamil Nadu Travel Planner AI. Provide clean, well-structured markdown itineraries according to the user prompt." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7
                })
            });

            const data = await response.json();
            if (response.ok && data.choices?.[0]?.message?.content) {
                return {
                    text: data.choices[0].message.content,
                    model: `Grok (${modelName})`,
                    provider: 'xAI'
                };
            } else if (data?.error?.message) {
                console.error(`[xAI Grok] Model ${modelName} error:`, data.error.message);
            }
        } catch (e) {
            console.error(`[xAI Grok] Fetch error for ${modelName}:`, e.message);
        }
    }
    return null;
}

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

        const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || "";

        // Gather all Gemini API keys from environment variables dynamically
        const apiKeys = [];
        if (process.env.GEMINI_API_KEY) {
            apiKeys.push(process.env.GEMINI_API_KEY);
        }
        let keyIndex = 2;
        while (process.env[`GEMINI_API_KEY_${keyIndex}`]) {
            apiKeys.push(process.env[`GEMINI_API_KEY_${keyIndex}`]);
            keyIndex++;
        }

        // 1. PRIMARY: Try Gemini API
        const modelsToTry = [
            "gemini-3.6-flash",
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-flash-002"
        ];

        let lastError = null;
        let successfulResponse = null;

        if (apiKeys.length > 0) {
            const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            for (const modelName of modelsToTry) {
                const startIndex = Math.floor(Math.random() * apiKeys.length);
                let attempts = 0;
                const maxAttempts = apiKeys.length;

                while (attempts < maxAttempts) {
                    const currentKeyIndex = (startIndex + attempts) % apiKeys.length;
                    const apiKey = apiKeys[currentKeyIndex];

                    try {
                        console.log(`[Gemini] Attempting generation with model: ${modelName}`);
                        const genAI = new GoogleGenerativeAI(apiKey);
                        const model = genAI.getGenerativeModel({ model: modelName });
                        const result = await model.generateContent(prompt);
                        const response = await result.response;
                        const text = response.text();

                        if (text && text.trim().length > 0) {
                            successfulResponse = {
                                text: text,
                                model: modelName,
                                provider: 'Google Gemini',
                                keyIndexUsed: currentKeyIndex
                            };
                            break;
                        }
                    } catch (e) {
                        console.warn(`[Gemini] Attempt with model ${modelName} failed:`, e.message);
                        lastError = e;
                        attempts++;
                    }
                }

                if (successfulResponse) {
                    return res.status(200).json(successfulResponse);
                }
            }
        }

        // 2. FALLBACK: If Gemini fails, trigger Grok (xAI) API immediately
        console.log("[Fallback] Gemini failed or unconfigured. Triggering Grok (xAI) fallback...");
        const grokResult = await callGrokAPI(prompt, grokKey);

        if (grokResult && grokResult.text) {
            console.log(`[xAI Grok] Successfully generated plan using ${grokResult.model}`);
            return res.status(200).json(grokResult);
        }

        // 3. SECONDARY FALLBACK: Try OpenRouter if available
        const openRouterKey = process.env.OPENROUTER_API_KEY || "";
        if (openRouterKey) {
            const openRouterModels = [
                "google/gemini-2.0-flash-lite-001",
                "google/gemini-2.0-flash-001",
                "meta-llama/llama-3.3-70b-instruct:free",
                "deepseek/deepseek-r1:free"
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
                            model: `OpenRouter (${modelName})`,
                            provider: 'OpenRouter'
                        });
                    }
                } catch (e) {
                    console.error(`OpenRouter fetch error for ${modelName}:`, e.message);
                }
            }
        }

        // If all options failed, return detailed error
        let userErrorMsg = "AI service temporarily unavailable. Both Gemini and Grok fallback could not complete the request. Please try again shortly.";
        if (lastError?.message) {
            userErrorMsg = `AI generation error: ${lastError.message}`;
        }

        return res.status(503).json({
            error: userErrorMsg,
            diagnostic: {
                geminiAttempted: apiKeys.length > 0,
                grokAttempted: Boolean(grokKey),
                lastFailureMessage: lastError?.message
            }
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
