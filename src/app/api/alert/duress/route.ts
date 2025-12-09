import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { vaultId, email, location } = body;

        console.log('🚨 SILENT ALARM TRIGGERED 🚨');
        console.log('Vault:', vaultId);
        console.log('Email:', email);
        console.log('Location:', location);

        // In a real implementation, we would use Resend here:
        /*
        await resend.emails.send({
            from: 'Security <alert@deadmansswitch.com>',
            to: email,
            subject: '🚨 URGENT: Duress Alert',
            html: `...`
        });
        */

        // For MVP/Demo, simulate a delay and success
        await new Promise(resolve => setTimeout(resolve, 1000));

        return NextResponse.json({ success: true, message: 'Alert sent' });
    } catch (error) {
        console.error('Duress alert failed:', error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}
