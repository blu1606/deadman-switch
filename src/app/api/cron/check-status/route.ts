import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { PROGRAM_ID } from '@/utils/anchor';

// Vault status classification
interface VaultStatus {
    address: string;
    owner: string;
    recipient: string;
    isExpired: boolean;
    isReleased: boolean;
    daysUntilExpiry: number;
    lastCheckIn: Date;
    deadline: Date;
}

export async function GET(request: NextRequest) {
    // Verify cron secret (security for Vercel)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const connection = new Connection(
            process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com',
            'confirmed'
        );

        // Fetch all vault accounts using getProgramAccounts
        const accounts = await connection.getProgramAccounts(PROGRAM_ID);

        const now = Math.floor(Date.now() / 1000);
        const vaultStatuses: VaultStatus[] = [];

        const expiredVaults: VaultStatus[] = [];
        const warningVaults: { vault: VaultStatus; urgency: string }[] = [];

        for (const account of accounts) {
            try {
                const data = account.account.data;

                // Minimum size check (discriminator + owner + recipient + ...)
                if (data.length < 80) continue;

                // Parse vault data (simplified parsing)
                // Offset: 8 (discriminator) + 32 (owner) + 32 (recipient) = 72
                const owner = new PublicKey(data.slice(8, 40));
                const recipient = new PublicKey(data.slice(40, 72));

                // Read ipfs_cid string length and skip
                const ipfsCidLen = data.readUInt32LE(72);
                const ipfsCidEnd = 76 + ipfsCidLen;

                // Read encrypted_key string length and skip
                const encKeyLen = data.readUInt32LE(ipfsCidEnd);
                const encKeyEnd = ipfsCidEnd + 4 + encKeyLen;

                // Read time_interval (i64) and last_check_in (i64)
                const timeInterval = Number(data.readBigInt64LE(encKeyEnd));
                const lastCheckIn = Number(data.readBigInt64LE(encKeyEnd + 8));
                const isReleased = data[encKeyEnd + 16] === 1;

                const deadline = lastCheckIn + timeInterval;
                const secondsUntilExpiry = deadline - now;
                const daysUntilExpiry = secondsUntilExpiry / 86400;

                const status: VaultStatus = {
                    address: account.pubkey.toBase58(),
                    owner: owner.toBase58(),
                    recipient: recipient.toBase58(),
                    isExpired: secondsUntilExpiry <= 0,
                    isReleased,
                    daysUntilExpiry,
                    lastCheckIn: new Date(lastCheckIn * 1000),
                    deadline: new Date(deadline * 1000),
                };

                vaultStatuses.push(status);

                // Classify vaults for notification
                if (!isReleased) {
                    if (secondsUntilExpiry <= 0) {
                        expiredVaults.push(status);
                    } else if (daysUntilExpiry <= 1) {
                        warningVaults.push({ vault: status, urgency: 'final' });
                    } else if (daysUntilExpiry <= 3) {
                        warningVaults.push({ vault: status, urgency: 'urgent' });
                    } else if (daysUntilExpiry <= 7) {
                        warningVaults.push({ vault: status, urgency: 'warning' });
                    }
                }
            } catch (parseErr) {
                console.error('Failed to parse vault:', account.pubkey.toBase58(), parseErr);
            }
        }

        // Log summary
        console.log(`[Cron] Checked ${vaultStatuses.length} vaults`);
        console.log(`[Cron] Expired: ${expiredVaults.length}, Warnings: ${warningVaults.length}`);

        // Send emails for expired vaults (notify recipients)
        const emailResults = { ownerReminders: 0, recipientNotifications: 0 };

        // For expired vaults, notify recipients
        for (const vault of expiredVaults) {
            console.log(`[Cron] EXPIRED: ${vault.address} (Owner: ${vault.owner})`);
            // Note: We need recipient email stored somewhere - for now just log
            // In production, you'd look up email from a database
            // await sendRecipientNotification(recipientEmail, vault.address, vault.owner);
        }

        // For warning vaults, notify owners
        for (const { vault, urgency } of warningVaults) {
            console.log(`[Cron] ${urgency.toUpperCase()}: ${vault.address} expires in ${vault.daysUntilExpiry.toFixed(1)} days`);
            // Note: We need owner email stored somewhere - for now just log
            // In production, you'd look up email from a database
            // await sendOwnerReminder(ownerEmail, vault.address, vault.daysUntilExpiry, urgency as any);
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            summary: {
                totalVaults: vaultStatuses.length,
                expiredCount: expiredVaults.length,
                warningCount: warningVaults.length,
            },
            expired: expiredVaults.map(v => ({
                address: v.address,
                owner: v.owner,
                recipient: v.recipient,
            })),
            warnings: warningVaults.map(({ vault, urgency }) => ({
                address: vault.address,
                urgency,
                daysRemaining: vault.daysUntilExpiry.toFixed(1),
            })),
        });
    } catch (err: any) {
        console.error('[Cron] Error:', err);
        return NextResponse.json({
            error: 'Cron job failed',
            message: err.message
        }, { status: 500 });
    }
}

// Also allow POST for manual triggering
export async function POST(request: NextRequest) {
    return GET(request);
}
