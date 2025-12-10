/**
 * Groq AI Provider - Primary (Fastest)
 * Phase 9.6: AI Providers Strategy
 * 
 * Groq offers ~150ms latency and 14K requests/day FREE
 * Uses Llama 3.1 70B for best quality/speed ratio
 */

import Groq from 'groq-sdk';

// Lazy initialization to avoid issues when API key not set
let groqClient: Groq | null = null;

function getClient(): Groq {
    if (!groqClient) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('GROQ_API_KEY not configured');
        }
        groqClient = new Groq({ apiKey });
    }
    return groqClient;
}

export interface AIGenerateOptions {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
}

const DEFAULT_MODEL = 'llama-3.1-70b-versatile';

/**
 * Generate text completion using Groq
 */
export async function generateWithGroq(
    prompt: string,
    options: AIGenerateOptions = {}
): Promise<string> {
    const client = getClient();

    const messages: Groq.Chat.ChatCompletionMessageParam[] = [];

    if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages,
        max_tokens: options.maxTokens || 256,
        temperature: options.temperature || 0.7,
    });

    return completion.choices[0]?.message?.content || '';
}

/**
 * Stream text completion using Groq
 */
export async function* streamWithGroq(
    prompt: string,
    options: AIGenerateOptions = {}
): AsyncGenerator<string> {
    const client = getClient();

    const messages: Groq.Chat.ChatCompletionMessageParam[] = [];

    if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const stream = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages,
        max_tokens: options.maxTokens || 256,
        temperature: options.temperature || 0.7,
        stream: true,
    });

    for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
            yield content;
        }
    }
}

/**
 * Check if Groq is available (has API key)
 */
export function isGroqAvailable(): boolean {
    return !!process.env.GROQ_API_KEY;
}
