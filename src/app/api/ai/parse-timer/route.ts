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

import { TIMER_PARSING_PROMPT } from '@/lib/ai/prompts';

const SYSTEM_PROMPT = TIMER_PARSING_PROMPT;

/**
 * Fallback: Parse common duration patterns without AI
 */
function parseTimerFallback(input: string): { seconds: number; visualization: string } {
    const lowered = input.toLowerCase().trim();

    // Pattern: number + unit
    const match = lowered.match(/(\d+)\s*(second|minute|hour|day|week|month|year)s?/);
    if (!match) {
        return { seconds: 0, visualization: '' };
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
        'second': 1,
        'minute': 60,
        'hour': 3600,
        'day': 86400,
        'week': 604800,
        'month': 2592000, // 30 days
        'year': 31536000, // 365 days
    };

    const seconds = value * (multipliers[unit] || 0);
    const days = Math.floor(seconds / 86400);

    return {
        seconds,
        visualization: days >= 365 ? `${Math.floor(days / 365)} year(s)` :
            days >= 30 ? `${Math.floor(days / 30)} month(s)` :
                `${days} day(s)`
    };
}

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
            // Fallback: Parse common patterns without AI
            const fallbackResult = parseTimerFallback(body.input);
            if (fallbackResult.seconds > 0) {
                return NextResponse.json({
                    ...fallbackResult,
                    provider: 'fallback',
                    latency: 0
                });
            }
            return NextResponse.json(
                { error: 'AI service unavailable. Try "30 days" or "3 months".' },
                { status: 503 }
            );
        }

        // Parse JSON from AI response with multiple fallback strategies
        try {
            let jsonStr = result.text.trim();

            // Strategy 1: Try to find JSON object in response
            const jsonMatch = result.text.match(/\{[\s\S]*?\}/);
            if (jsonMatch) {
                jsonStr = jsonMatch[0];
            }

            // Strategy 2: Strip markdown code blocks if present
            jsonStr = jsonStr
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/g, '')
                .trim();

            // Strategy 3: Remove any leading/trailing text before/after JSON
            const startIdx = jsonStr.indexOf('{');
            const endIdx = jsonStr.lastIndexOf('}');
            if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
                jsonStr = jsonStr.substring(startIdx, endIdx + 1);
            }

            const parsed = JSON.parse(jsonStr);

            // Validate required fields
            if (typeof parsed.seconds !== 'number') {
                throw new Error('Missing seconds field');
            }

            return NextResponse.json({
                seconds: parsed.seconds,
                visualization: parsed.visualization || `${Math.floor(parsed.seconds / 86400)} days`,
                error: parsed.error,
                provider: result.provider,
                latency: result.latency
            });
        } catch (parseErr) {
            console.error('[API] JSON parse failed:', result.text, parseErr);
            return NextResponse.json({
                seconds: 0,
                error: 'Could not parse duration. Try "30 days" or "3 months".',
                provider: result.provider,
                latency: result.latency
            });
        }

    } catch (error) {
        console.error('[API] parse-timer error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
