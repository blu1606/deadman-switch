import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { vaultAddress, ownerEmail, recipientEmail, contactEmail, contactName, duressEnabled } = body;

        if (!vaultAddress) {
            return NextResponse.json({ error: 'Vault address required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        if (!supabase) {
            return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
        }

        // Handle emergency contacts (for duress feature)
        if (contactEmail !== undefined) {
            if (duressEnabled && contactEmail) {
                // Upsert emergency contact
                const { error } = await supabase
                    .from('emergency_contacts')
                    .upsert(
                        {
                            vault_address: vaultAddress,
                            contact_email: contactEmail,
                            contact_name: contactName || null,
                            duress_enabled: duressEnabled,
                            updated_at: new Date().toISOString()
                        },
                        { onConflict: 'vault_address,contact_email' }
                    );

                if (error) {
                    console.error('[API] Failed to save emergency contact:', error);
                    return NextResponse.json({ error: 'Failed to save emergency contact' }, { status: 500 });
                }
            } else {
                // If duress disabled, delete the contact
                const { error } = await supabase
                    .from('emergency_contacts')
                    .delete()
                    .eq('vault_address', vaultAddress)
                    .eq('contact_email', contactEmail);

                if (error) {
                    console.error('[API] Failed to remove emergency contact:', error);
                }
            }

            return NextResponse.json({ success: true, type: 'emergency_contact' });
        }

        // Handle regular vault contacts (owner/recipient emails)
        if (!ownerEmail && !recipientEmail) {
            return NextResponse.json({ success: true, message: 'No emails provided' });
        }

        const { error } = await supabase
            .from('vault_contacts')
            .upsert(
                {
                    vault_address: vaultAddress,
                    owner_email: ownerEmail || null,
                    recipient_email: recipientEmail || null,
                },
                { onConflict: 'vault_address' }
            );

        if (error) {
            console.error('[API] Failed to save contacts:', error);
            return NextResponse.json({ error: 'Failed to save contacts' }, { status: 500 });
        }

        return NextResponse.json({ success: true, type: 'vault_contact' });
    } catch (err: any) {
        console.error('[API] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
