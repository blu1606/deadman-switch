/**
 * Gemini AI Provider - Fallback 2
 * Phase 9.6: AI Providers Strategy
 * 
 * Google Gemini offers generous free tier (1M tokens/min)
 * Slower than Groq (~400ms) but very reliable
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

let geminiClient: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
    if (!geminiClient) {
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) {
            throw new Error('GOOGLE_AI_API_KEY not configured');
        }
        geminiClient = new GoogleGenerativeAI(apiKey);
    }
    return geminiClient;
}

export interface AIGenerateOptions {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
}

const DEFAULT_MODEL = 'gemini-1.5-flash';

/**
 * Generate text completion using Gemini
 */
export async function generateWithGemini(
    prompt: string,
    options: AIGenerateOptions = {}
): Promise<string> {
    const client = getClient();
    const model = client.getGenerativeModel({ model: DEFAULT_MODEL });

    const fullPrompt = options.systemPrompt
        ? `${options.systemPrompt}\n\nUser: ${prompt}`
        : prompt;

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
            maxOutputTokens: options.maxTokens || 256,
            temperature: options.temperature || 0.7,
        },
    });

    return result.response.text();
}

/**
 * Check if Gemini is available
 */
export function isGeminiAvailable(): boolean {
    return !!process.env.GOOGLE_AI_API_KEY;
}
