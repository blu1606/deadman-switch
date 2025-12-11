/**
 * Password Hint Generator API
 * Phase 9.2: AI-powered hint generation
 * Phase 9.7: Semantic Caching (pgvector)
 * 
 * POST /api/ai/generate-hint
 * Generates a clever hint that helps recipient guess password without exposing it
 */

import { NextRequest, NextResponse } from 'next/server';
import { generate } from '@/lib/ai';
import { scanForSecrets } from '@/utils/safetyScanner';
import { generateEmbedding } from '@/lib/ai/embedding';
import { findCachedResponse, cacheResponse } from '@/lib/ai/cache';

// Edge runtime for faster cold starts
export const runtime = 'edge';

interface GenerateHintRequest {
    context: string;
    recipient?: string;
}

const SYSTEM_PROMPT = `You are helping create a password hint for a digital inheritance vault.
Your goal is to help the recipient remember or guess the password without revealing it.

Rules:
1. NEVER include the actual password in the hint
2. Reference shared memories, inside jokes, or family knowledge
3. Be warm and personal in tone
4. Keep the hint under 50 words
5. If the context mentions specific names/dates, use them indirectly
6. The hint should be a riddle or memory prompt, not a direct clue`;

/**
 * Scrub sensitive data from input before sending to AI
 * Reuses Anti-Doxxer patterns from safetyScanner
 */
function scrubSensitiveData(text: string): { scrubbed: string; hadSensitive: boolean } {
    const result = scanForSecrets(text);

    if (result.detected) {
        // Remove the detected pattern (this is a simplified version)
        return {
            scrubbed: text.replace(/[1-9A-HJ-NP-Za-km-z]{87,88}|0x[a-fA-F0-9]{64}/g, '[REDACTED]'),
            hadSensitive: true,
        };
    }

    return { scrubbed: text, hadSensitive: false };
}

export async function POST(request: NextRequest) {
    try {
        const body: GenerateHintRequest = await request.json();

        if (!body.context || body.context.length < 10) {
            return NextResponse.json(
                { error: 'Please provide more context about the password (at least 10 characters)' },
                { status: 400 }
            );
        }

        if (body.context.length > 500) {
            return NextResponse.json(
                { error: 'Context too long. Keep it under 500 characters.' },
                { status: 400 }
            );
        }

        // Scrub any accidentally pasted sensitive data
        const { scrubbed, hadSensitive } = scrubSensitiveData(body.context);

        if (hadSensitive) {
            console.warn('[AI] Sensitive data detected and scrubbed from hint request');
        }

        // ---------------------------------------------------------
        // 9.7 AI Semantic Caching
        // ---------------------------------------------------------
        const recipientClause = body.recipient
            ? `The recipient is: ${body.recipient}`
            : 'The recipient is a loved one.';

        // Use the scrubbed input as the cache key to ensure safety
        const cacheInput = `Context: ${scrubbed}\n${recipientClause}`;
        let embedding: number[] | null = null;

        try {
            // Generate embedding for semantic search
            // This adds ~100-200ms but saves ~2-3s on cache hit
            embedding = await generateEmbedding(cacheInput);

            // Check for existing similar answer
            const cached = await findCachedResponse(embedding);

            if (cached) {
                console.log(`[AI] Cache HIT (Similarity: ${cached.similarity.toFixed(4)})`);
                return NextResponse.json({
                    hint: cached.response,
                    provider: 'cache-hit',
                    latency: 150, // Approx overhead
                    ...(hadSensitive && { warning: 'Sensitive data was automatically removed for your safety.' }),
                });
            }
        } catch (cacheErr) {
            // Fail open: If cache/embedding fails, just generate normally
            console.warn('[AI] Cache lookup failed:', cacheErr);
        }
        // ---------------------------------------------------------


        // Build the prompt for LLM
        const prompt = `Create a password hint based on this context:

"${scrubbed}"

${recipientClause}

Generate a single hint that will help them remember without giving the password away.`;

        // Generate hint using fallback provider
        const result = await generate(prompt, {
            systemPrompt: SYSTEM_PROMPT,
            maxTokens: 100,
            temperature: 0.8,
        });

        if (result.provider === 'none') {
            return NextResponse.json(
                { error: 'AI service temporarily unavailable. Please try again.' },
                { status: 503 }
            );
        }

        // ---------------------------------------------------------
        // Cache the new result (Async / Fire-and-forget)
        // ---------------------------------------------------------
        if (embedding && result.text) {
            // In Edge Runtime, we should use waitUntil to ensure bg tasks complete
            // usage: context.waitUntil() - but we are in Route Handler
            // Next.js App Router API Routes wait for response return, but background promises *might* be cancelled
            // Ideally we just await it if it's fast, or accept risk.
            // Supabase insert is fast (~50ms).
            cacheResponse(cacheInput, result.text.trim(), embedding).catch(e =>
                console.error('[AI] Cache save warning:', e)
            );
        }
        // ---------------------------------------------------------

        return NextResponse.json({
            hint: result.text.trim(),
            provider: result.provider,
            latency: result.latency,
            ...(hadSensitive && { warning: 'Sensitive data was automatically removed for your safety.' }),
        });

    } catch (error) {
        console.error('[API] generate-hint error:', error);
        return NextResponse.json(
            { error: 'Failed to generate hint' },
            { status: 500 }
        );
    }
}
