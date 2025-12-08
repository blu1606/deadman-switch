
import 'dotenv/config'; // Load .env for local testing
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from '@/utils/anchor';
import { getSupabaseAdmin } from '@/utils/supabase';
import { sendOwnerReminder, sendRecipientNotification } from '@/utils/email';

// Vault status interface
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

async function main() {
    console.log('--- Starting Vault Check Cron Job ---');

    // Check required env vars
    const requiredEnv = ['NEXT_PUBLIC_RPC_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY'];
    const missing = requiredEnv.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.error(`ERROR: Missing environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }

    try {
        const connection = new Connection(
            process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com',
            'confirmed'
        );

        console.log(`Connected to RPC. Fetching accounts for program: ${PROGRAM_ID.toString()}`);

        const accounts = await connection.getProgramAccounts(PROGRAM_ID);
        console.log(`Found ${accounts.length} total accounts.`);

        const now = Math.floor(Date.now() / 1000);
        const vaultStatuses: VaultStatus[] = [];
        const expiredVaults: VaultStatus[] = [];
        const warningVaults: { vault: VaultStatus; urgency: string }[] = [];

        for (const account of accounts) {
            try {
                const data = account.account.data;

                // Minimum size check (discriminator + owner + recipient + ...)
                if (data.length < 80) continue;

                // Parse vault data manually because using Program/IDL in script context can be tricky with types
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
                // Ignore parsing errors for non-vault accounts
            }
        }

        console.log(`Analyzed ${vaultStatuses.length} valid vaults.`);
        console.log(`Expired: ${expiredVaults.length} | Warnings: ${warningVaults.length}`);

        if (expiredVaults.length === 0 && warningVaults.length === 0) {
            console.log('No actions needed. Exiting.');
            process.exit(0);
        }

        // Initialize Supabase for contact lookup
        const supabase = getSupabaseAdmin();
        if (!supabase) {
            throw new Error("Supabase init failed");
        }

        // Helper: Get contacts
        const allAddresses = [
            ...expiredVaults.map(v => v.address),
            ...warningVaults.map(v => v.vault.address)
        ];

        const { data } = await supabase
            .from('vault_contacts')
            .select('vault_address, owner_email, recipient_email')
            .in('vault_address', allAddresses);

        const contactsMap: Record<string, any> = {};
        if (data) {
            data.forEach((curr: any) => {
                contactsMap[curr.vault_address] = {
                    ownerEmail: curr.owner_email,
                    recipientEmail: curr.recipient_email
                };
            });
        }

        // 1. Notify Recipients of Expired Vaults
        let recipientEmailsSent = 0;
        for (const vault of expiredVaults) {
            const contacts = contactsMap[vault.address];
            if (contacts?.recipientEmail) {
                console.log(`[Expired] Sending notification to recipient for vault ${vault.address}`);
                const sent = await sendRecipientNotification(
                    contacts.recipientEmail,
                    vault.address,
                    vault.owner
                );
                if (sent) recipientEmailsSent++;
            }
        }

        // 2. Notify Owners of Upcoming Expiry
        let ownerEmailsSent = 0;
        for (const { vault, urgency } of warningVaults) {
            const contacts = contactsMap[vault.address];
            if (contacts?.ownerEmail) {
                console.log(`[Warning] Sending ${urgency} reminder to owner for vault ${vault.address}`);
                const sent = await sendOwnerReminder(
                    contacts.ownerEmail,
                    vault.address,
                    vault.daysUntilExpiry,
                    urgency as any
                );
                if (sent) ownerEmailsSent++;
            }
        }

        console.log(`--- Run Complete ---`);
        console.log(`Emails Sent -> Recipients: ${recipientEmailsSent} | Owners: ${ownerEmailsSent}`);
        process.exit(0);

    } catch (err) {
        console.error('CRITICAL ERROR:', err);
        process.exit(1);
    }
}

main();
