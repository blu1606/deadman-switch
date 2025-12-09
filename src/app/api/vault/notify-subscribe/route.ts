import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendScheduledVaultReady } from '@/utils/email';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { vaultAddress, recipientEmail, releaseTimestamp } = body;

        // Validation
        if (!vaultAddress || !recipientEmail || !releaseTimestamp) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recipientEmail)) {
            return NextResponse.json(
                { success: false, error: 'Invalid email address' },
                { status: 400 }
            );
        }

        // Check if already subscribed
        const { data: existing } = await supabase
            .from('vault_notify_subscriptions')
            .select('id')
            .eq('vault_address', vaultAddress)
            .eq('recipient_email', recipientEmail)
            .single();

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Already subscribed to this vault' },
                { status: 409 }
            );
        }

        // Schedule the email via Resend
        const scheduledAt = new Date(releaseTimestamp * 1000);
        const emailResult = await sendScheduledVaultReady(
            recipientEmail,
            vaultAddress,
            scheduledAt
        );

        if (!emailResult.success) {
            return NextResponse.json(
                { success: false, error: emailResult.error || 'Failed to schedule notification' },
                { status: 500 }
            );
        }

        // Save subscription to DB
        const { error: insertError } = await supabase
            .from('vault_notify_subscriptions')
            .insert({
                vault_address: vaultAddress,
                recipient_email: recipientEmail,
                release_timestamp: releaseTimestamp,
                notified: false // Will be set when email is sent by Resend
            });

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json(
                { success: false, error: 'Failed to save subscription' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `You'll be notified when this vault is ready!`,
            scheduledFor: scheduledAt.toISOString()
        });

    } catch (error: any) {
        console.error('Notify subscribe error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
