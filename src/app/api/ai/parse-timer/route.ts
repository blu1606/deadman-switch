/**
 * Timer Intent Parser API
 * Phase 9.3: Natural Language Timer Parsing
 * 
 * POST /api/ai/parse-timer
 * Converts natural language duration input into seconds
 * Example: "3 months" -> 7776000
 */

import { NextRequest, NextResponse } from 'next/server';
import { generate } from '@/lib/ai';

export const runtime = 'edge';

interface ParseTimerRequest {
    input: string;
}

const SYSTEM_PROMPT = `You are a precise time duration parser. 
Convert the user's natural language input into TOTAL SECONDS.

Rules:
1. Return ONLY a JSON object: {"seconds": number, "visualization": "string"}
2. "visualization" should be a human-readable confirmation (e.g., "30 days")
3. If the input is invalid or not a time duration, return {"seconds": 0, "error": "Could not understand duration"}
4. Assume standard conversions:
   - 1 minute = 60 seconds
   - 1 hour = 3600 seconds
   - 1 day = 86400 seconds
   - 1 week = 604800 seconds
   - 1 month = 30 days (2592000 seconds)
   - 1 year = 365 days (31536000 seconds)
   
Examples:
Input: "3 months"
Output: {"seconds": 7776000, "visualization": "90 days"}

Input: "half a year"
Output: {"seconds": 15768000, "visualization": "6 months (182.5 days)"}

Input: "tomorrow"
Output: {"seconds": 86400, "visualization": "24 hours"}

Input: "banana"
Output: {"seconds": 0, "error": "Not a valid time duration"}`;

export async function POST(request: NextRequest) {
    try {
        const body: ParseTimerRequest = await request.json();

        if (!body.input || body.input.length > 100) {
            return NextResponse.json(
                { error: 'Invalid input. Please keep it under 100 characters.' },
                { status: 400 }
            );
        }

        const prompt = `Parse this duration: "${body.input}"`;

        const result = await generate(prompt, {
            systemPrompt: SYSTEM_PROMPT,
            maxTokens: 100,
            temperature: 0.1, // Low temperature for consistent math
        });

        if (result.provider === 'none') {
            return NextResponse.json(
                { error: 'AI service unavailable' },
                { status: 503 }
            );
        }

        // Parse JSON from AI response
        try {
            const cleanText = result.text.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanText);
            return NextResponse.json({
                ...parsed,
                provider: result.provider,
                latency: result.latency
            });
        } catch {
            console.error('[API] JSON parse failed:', result.text);
            return NextResponse.json(
                { seconds: 0, error: 'Failed to parse AI response' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('[API] parse-timer error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
