import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';

/**
 * Dynamic NFT Image API
 * 
 * Returns a spirit image based on the vault's current state:
 * - Happy: Last check-in < 24 hours ago
 * - Neutral: Last check-in between 24h and 7 days
 * - Sick: Last check-in > 7 days ago
 * - Ghost: Vault has been released
 */

type SpiritState = 'happy' | 'neutral' | 'sick' | 'ghost';

function getSpiritState(vault: any): SpiritState {
    if (vault.isReleased) {
        return 'ghost';
    }

    const lastCheckIn = vault.lastCheckIn.toNumber() * 1000; // Convert to milliseconds
    const now = Date.now();
    const hoursSinceCheckIn = (now - lastCheckIn) / (1000 * 60 * 60);

    if (hoursSinceCheckIn < 24) {
        return 'happy';
    } else if (hoursSinceCheckIn < 24 * 7) { // 7 days
        return 'neutral';
    } else {
        return 'sick';
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { vault: string } }
) {
    try {
        const vaultAddress = params.vault;

        // Validate the vault address
        let vaultPubkey: PublicKey;
        try {
            vaultPubkey = new PublicKey(vaultAddress);
        } catch {
            return NextResponse.json(
                { error: 'Invalid vault address' },
                { status: 400 }
            );
        }

        // Connect to Solana
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';
        const connection = new Connection(rpcUrl, 'confirmed');

        // Load the program IDL
        const idl = await import('@/idl/deadmans_switch.json');
        const programId = new PublicKey(idl.address);

        // Create a read-only provider (no wallet needed for reading)
        const provider = {
            connection,
            publicKey: null,
        };

        // Fetch the vault account data directly
        const accountInfo = await connection.getAccountInfo(vaultPubkey);

        if (!accountInfo) {
            // Vault not found - return a placeholder
            const baseUrl = request.nextUrl.origin;
            return NextResponse.redirect(`${baseUrl}/spirits/ghost.png`);
        }

        // Parse the vault data manually (simplified - assumes standard layout)
        // A proper implementation would use the Anchor program for decoding
        const data = accountInfo.data;

        // Try to determine state from raw data
        // Vault struct layout (approximate offsets):
        // - 8 bytes discriminator
        // - 32 bytes owner
        // - 32 bytes recipient
        // - 4 + 64 bytes ipfs_cid (String)
        // - 4 + 128 bytes encrypted_key (String)
        // - 8 bytes time_interval
        // - 8 bytes last_check_in
        // - 1 byte is_released

        let spiritState: SpiritState = 'neutral';

        try {
            // Skip to is_released (offset is variable due to strings, so we check from end)
            // For a simpler approach, let's try to use the Program to decode
            const Program = (await import('@coral-xyz/anchor')).Program;

            // Create a minimal provider for reading
            const readProvider = new AnchorProvider(
                connection,
                { publicKey: PublicKey.default, signTransaction: async (tx) => tx, signAllTransactions: async (txs) => txs },
                { commitment: 'confirmed' }
            );

            const program = new Program(idl as any, readProvider);
            const vault = await (program.account as any).vault.fetch(vaultPubkey);

            spiritState = getSpiritState(vault);
        } catch (e) {
            // If we can't decode, default to neutral
            console.error('Failed to decode vault:', e);
            spiritState = 'neutral';
        }

        // Redirect to the appropriate spirit image
        const baseUrl = request.nextUrl.origin;
        return NextResponse.redirect(`${baseUrl}/spirits/${spiritState}.png`);

    } catch (error: any) {
        console.error('Spirit NFT API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch vault state', details: error.message },
            { status: 500 }
        );
    }
}

// Also provide metadata endpoint for NFT standards
export async function HEAD(request: NextRequest) {
    return new NextResponse(null, {
        headers: {
            'Content-Type': 'image/png',
        },
    });
}
