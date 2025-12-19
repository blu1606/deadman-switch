import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase';

// GET: Fetch emergency contacts for a vault
export async function GET(req: Request) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const vaultAddress = searchParams.get('vault');
    const ownerWallet = searchParams.get('owner');

    if (!vaultAddress && !ownerWallet) {
        return NextResponse.json({ error: 'Missing vault or owner parameter' }, { status: 400 });
    }

    let query = supabase.from('emergency_contacts').select('*');

    if (vaultAddress) {
        query = query.eq('vault_address', vaultAddress);
    }
    if (ownerWallet) {
        query = query.eq('owner_wallet', ownerWallet);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contacts: data || [] });
}

// POST: Add emergency contact
export async function POST(req: Request) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { vaultAddress, ownerWallet, contactEmail, contactName } = body;

        if (!vaultAddress || !ownerWallet || !contactEmail) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactEmail)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('emergency_contacts')
            .insert({
                vault_address: vaultAddress,
                owner_wallet: ownerWallet,
                contact_email: contactEmail,
                contact_name: contactName || null,
                duress_enabled: true
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return NextResponse.json({ error: 'Contact already exists for this vault' }, { status: 409 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, contact: data });

    } catch {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// DELETE: Remove emergency contact
export async function DELETE(req: Request) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get('id');

    if (!contactId) {
        return NextResponse.json({ error: 'Missing contact id' }, { status: 400 });
    }

    const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', contactId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
