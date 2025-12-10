/**
 * AI Provider Fallback Router
 * Phase 9.6: AI Providers Strategy
 * 
 * Tries providers in order: Groq → Gemini
 * Automatically falls back on rate limit (429) or errors
 */

import { generateWithGroq, isGroqAvailable } from './groq';
import { generateWithGemini, isGeminiAvailable } from './gemini';

export interface AIGenerateOptions {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
}

export interface AIResponse {
    text: string;
    provider: 'groq' | 'gemini' | 'none';
    latency: number;
}

/**
 * Generate text using the best available provider
 * Falls back automatically on errors or rate limits
 */
export async function generate(
    prompt: string,
    options: AIGenerateOptions = {}
): Promise<AIResponse> {
    const startTime = Date.now();

    // Try Groq first (fastest)
    if (isGroqAvailable()) {
        try {
            const text = await generateWithGroq(prompt, options);
            return {
                text,
                provider: 'groq',
                latency: Date.now() - startTime,
            };
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            // Only continue to fallback on rate limit or server errors
            if (err.status !== 429 && err.status !== 500 && err.status !== 503) {
                console.warn('[AI] Groq error (not rate limit):', err.message);
            }
            console.log('[AI] Groq unavailable, trying Gemini...');
        }
    }

    // Try Gemini as fallback
    if (isGeminiAvailable()) {
        try {
            const text = await generateWithGemini(prompt, options);
            return {
                text,
                provider: 'gemini',
                latency: Date.now() - startTime,
            };
        } catch (error: unknown) {
            const err = error as { message?: string };
            console.error('[AI] Gemini error:', err.message);
        }
    }

    // No providers available
    return {
        text: '',
        provider: 'none',
        latency: Date.now() - startTime,
    };
}

/**
 * Check which providers are configured
 */
export function getAvailableProviders(): string[] {
    const providers: string[] = [];
    if (isGroqAvailable()) providers.push('groq');
    if (isGeminiAvailable()) providers.push('gemini');
    return providers;
}

/**
 * Quick health check for AI system
 */
export async function healthCheck(): Promise<{
    available: boolean;
    providers: string[];
    testLatency?: number;
}> {
    const providers = getAvailableProviders();

    if (providers.length === 0) {
        return { available: false, providers: [] };
    }

    try {
        const result = await generate('Say "ok" in one word.', { maxTokens: 5 });
        return {
            available: result.provider !== 'none',
            providers,
            testLatency: result.latency,
        };
    } catch {
        return { available: false, providers };
    }
}
