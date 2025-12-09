import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/utils/email';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { vaultAddress, location } = body;

        if (!vaultAddress) {
            return NextResponse.json({ error: 'Missing vault address' }, { status: 400 });
        }

        console.log('🚨 SILENT ALARM TRIGGERED 🚨');
        console.log('Vault:', vaultAddress);
        console.log('Location:', location || 'Unknown');

        // Fetch emergency contacts for this vault
        const { data: contacts, error } = await supabase
            .from('emergency_contacts')
            .select('contact_email, contact_name')
            .eq('vault_address', vaultAddress)
            .eq('duress_enabled', true);

        if (error) {
            console.error('Failed to fetch contacts:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!contacts || contacts.length === 0) {
            console.log('No emergency contacts configured');
            return NextResponse.json({
                success: true,
                message: 'Alert triggered (no contacts configured)',
                notified: 0
            });
        }

        // Send alert to all contacts
        const emailPromises = contacts.map(contact =>
            sendEmail({
                to: contact.contact_email,
                subject: '🚨 URGENT: Duress Alert Triggered',
                html: generateDuressEmail(vaultAddress, location, contact.contact_name)
            })
        );

        const results = await Promise.allSettled(emailPromises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

        console.log(`Notified ${successCount}/${contacts.length} contacts`);

        return NextResponse.json({
            success: true,
            message: 'Duress alert sent!',
            notified: successCount,
            total: contacts.length
        });

    } catch (error) {
        console.error('Duress alert failed:', error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}

function generateDuressEmail(vaultAddress: string, location: string | null, contactName: string | null): string {
    const truncatedVault = `${vaultAddress.slice(0, 8)}...${vaultAddress.slice(-8)}`;

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', sans-serif; background: #0F172A; color: #F8FAFC; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #1E293B; border-radius: 12px; padding: 30px; }
        .header { text-align: center; margin-bottom: 20px; }
        .alert { background: #DC262620; border: 2px solid #DC2626; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .alert-title { color: #DC2626; font-weight: bold; font-size: 20px; margin-bottom: 10px; }
        .info { background: #0F172A; border-radius: 8px; padding: 15px; margin: 15px 0; }
        .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
        .label { color: #94A3B8; }
        .value { color: #F8FAFC; font-family: monospace; }
        .footer { text-align: center; color: #64748B; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 DURESS ALERT</h1>
        </div>
        
        <div class="alert">
            <div class="alert-title">⚠️ A silent alarm has been triggered</div>
            <p>This may indicate that the vault owner is under duress or in danger.</p>
        </div>
        
        ${contactName ? `<p>Dear ${contactName},</p>` : ''}
        
        <p>A duress check-in was detected for a vault you are listed as an emergency contact for.</p>
        
        <div class="info">
            <div class="info-row">
                <span class="label">Vault:</span>
                <span class="value">${truncatedVault}</span>
            </div>
            <div class="info-row">
                <span class="label">Time:</span>
                <span class="value">${new Date().toISOString()}</span>
            </div>
            ${location ? `
            <div class="info-row">
                <span class="label">Approximate Location:</span>
                <span class="value">${location}</span>
            </div>
            ` : ''}
        </div>
        
        <p><strong>What this means:</strong></p>
        <ul>
            <li>The vault owner held the check-in button longer than normal (5+ seconds)</li>
            <li>This is a pre-configured signal that they may be in danger</li>
            <li>The check-in was NOT actually processed - the timer continues counting down</li>
        </ul>
        
        <p><strong>Recommended actions:</strong></p>
        <ul>
            <li>Try to contact the vault owner through alternative means</li>
            <li>If you believe they are in immediate danger, contact local authorities</li>
        </ul>
        
        <div class="footer">
            <p>This is an automated emergency message from Deadman's Switch.</p>
            <p>You are receiving this because you were registered as an emergency contact.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
}
