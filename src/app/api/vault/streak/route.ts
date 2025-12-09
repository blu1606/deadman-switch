import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch streak for a vault
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const vaultAddress = searchParams.get('vault');

    if (!vaultAddress) {
        return NextResponse.json({ error: 'Missing vault address' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('vault_streaks')
        .select('streak_count, longest_streak, last_ping_at')
        .eq('vault_address', vaultAddress)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        streak: data?.streak_count || 0,
        longestStreak: data?.longest_streak || 0,
        lastPingAt: data?.last_ping_at || null
    });
}

// POST: Increment streak on successful ping
export async function POST(req: Request) {
    try {
        const { vaultAddress } = await req.json();

        if (!vaultAddress) {
            return NextResponse.json({ error: 'Missing vault address' }, { status: 400 });
        }

        const now = new Date();

        // Get existing streak
        const { data: existing } = await supabase
            .from('vault_streaks')
            .select('*')
            .eq('vault_address', vaultAddress)
            .single();

        let newStreak = 1;
        let longestStreak = 1;

        if (existing) {
            const lastPing = new Date(existing.last_ping_at);
            const hoursSinceLastPing = (now.getTime() - lastPing.getTime()) / (1000 * 60 * 60);

            // If last ping was within 48 hours, increment streak
            // Otherwise, reset to 1
            if (hoursSinceLastPing <= 48) {
                newStreak = existing.streak_count + 1;
            } else {
                newStreak = 1; // Reset
            }

            longestStreak = Math.max(existing.longest_streak, newStreak);
        }

        // Upsert streak
        const { error } = await supabase
            .from('vault_streaks')
            .upsert({
                vault_address: vaultAddress,
                streak_count: newStreak,
                longest_streak: longestStreak,
                last_ping_at: now.toISOString(),
                updated_at: now.toISOString()
            }, { onConflict: 'vault_address' });

        if (error) {
            console.error('Streak update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            streak: newStreak,
            longestStreak
        });

    } catch (err: any) {
        console.error('Streak API error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
