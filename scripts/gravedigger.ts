#!/usr/bin/env node
/**
 * 🪦 GRAVEDIGGER SDK
 * 
 * A community-powered bot that monitors expired vaults and triggers their release
 * to collect bounty rewards. This replaces the need for centralized cron jobs.
 * 
 * Usage:
 *   npx ts-node gravedigger.ts
 *   
 * Environment Variables:
 *   RPC_URL - Solana RPC endpoint (default: devnet)
 *   PRIVATE_KEY - Base58 encoded wallet private key for signing transactions
 *   POLL_INTERVAL - Seconds between scans (default: 300 = 5 minutes)
 *   MIN_BOUNTY - Minimum bounty in SOL to consider (default: 0.001)
 */

import { Connection, PublicKey, Keypair, TransactionInstruction, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
// @ts-ignore - bs58 types
import bs58 from 'bs58';

// Program ID (from lib.rs)
const PROGRAM_ID = new PublicKey('HnFEhMS84CabpztHCDdGGN8798NxNse7NtXW4aG17XpB');

// Vault account discriminator (first 8 bytes of account data for Vault type)
const VAULT_DISCRIMINATOR = Buffer.from([211, 8, 232, 43, 2, 152, 117, 119]);

// Config
const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '300') * 1000;
const MIN_BOUNTY = parseFloat(process.env.MIN_BOUNTY || '0.001') * 1e9;

interface VaultData {
    publicKey: PublicKey;
    lastCheckIn: number;
    timeInterval: number;
    isReleased: boolean;
    bountyLamports: number;
    name: string;
}

function parseVaultAccount(pubkey: PublicKey, data: Buffer): VaultData | null {
    try {
        // Check discriminator
        if (!data.slice(0, 8).equals(VAULT_DISCRIMINATOR)) {
            return null;
        }

        let offset = 8;

        // owner: Pubkey (32)
        offset += 32;

        // recipient: Pubkey (32)
        offset += 32;

        // ipfs_cid: String (4 + len)
        const ipfsCidLen = data.readUInt32LE(offset);
        offset += 4 + ipfsCidLen;

        // encrypted_key: String (4 + len)
        const encKeyLen = data.readUInt32LE(offset);
        offset += 4 + encKeyLen;

        // time_interval: i64 (8)
        const timeInterval = Number(data.readBigInt64LE(offset));
        offset += 8;

        // last_check_in: i64 (8)
        const lastCheckIn = Number(data.readBigInt64LE(offset));
        offset += 8;

        // is_released: bool (1)
        const isReleased = data[offset] === 1;
        offset += 1;

        // vault_seed: u64 (8)
        offset += 8;

        // bump: u8 (1)
        offset += 1;

        // delegate: Option<Pubkey> (1 + 32)
        offset += 33;

        // bounty_lamports: u64 (8)
        const bountyLamports = Number(data.readBigUInt64LE(offset));
        offset += 8;

        // name: String (4 + len)
        const nameLen = data.readUInt32LE(offset);
        offset += 4;
        const name = data.slice(offset, offset + nameLen).toString('utf8').replace(/\x00/g, '').trim();

        return {
            publicKey: pubkey,
            lastCheckIn,
            timeInterval,
            isReleased,
            bountyLamports,
            name
        };
    } catch (e) {
        return null;
    }
}

async function getExpiredVaults(connection: Connection): Promise<VaultData[]> {
    console.log('🔍 Scanning for expired vaults...');

    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
        filters: [
            { dataSize: 424 } // Vault account size
        ]
    });

    const now = Math.floor(Date.now() / 1000);
    const expiredVaults: VaultData[] = [];

    for (const { pubkey, account } of accounts) {
        const vault = parseVaultAccount(pubkey, account.data as Buffer);

        if (!vault) continue;
        if (vault.isReleased) continue;
        if (vault.bountyLamports < MIN_BOUNTY) continue;

        const deadline = vault.lastCheckIn + vault.timeInterval;
        if (now > deadline) {
            expiredVaults.push(vault);
        }
    }

    return expiredVaults;
}

async function triggerRelease(
    connection: Connection,
    wallet: Keypair,
    vault: VaultData
): Promise<boolean> {
    console.log(`\n💀 Triggering vault: ${vault.publicKey.toBase58()}`);
    console.log(`   Name: ${vault.name || 'Unnamed'}`);
    console.log(`   Bounty: ${(vault.bountyLamports / 1e9).toFixed(4)} SOL`);

    try {
        // Build trigger_release instruction manually
        // Instruction discriminator for "trigger_release" (first 8 bytes of sha256("global:trigger_release"))
        const discriminator = Buffer.from([88, 90, 186, 176, 161, 164, 227, 59]);

        const instruction = new TransactionInstruction({
            keys: [
                { pubkey: vault.publicKey, isSigner: false, isWritable: true },
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            ],
            programId: PROGRAM_ID,
            data: discriminator,
        });

        const tx = new Transaction().add(instruction);
        tx.feePayer = wallet.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const signature = await sendAndConfirmTransaction(connection, tx, [wallet], {
            commitment: 'confirmed',
        });

        console.log(`   ✅ Released! TX: ${signature}`);
        console.log(`   💰 Bounty collected: ${(vault.bountyLamports / 1e9).toFixed(4)} SOL`);
        return true;
    } catch (e: any) {
        console.log(`   ❌ Failed: ${e.message}`);
        return false;
    }
}

async function hunt(connection: Connection, wallet: Keypair) {
    const expiredVaults = await getExpiredVaults(connection);

    if (expiredVaults.length === 0) {
        console.log('😴 No expired vaults with bounty found.\n');
        return;
    }

    console.log(`\n🎯 Found ${expiredVaults.length} expired vault(s) with bounty!\n`);

    let totalBounty = 0;
    let successCount = 0;

    for (const vault of expiredVaults) {
        const success = await triggerRelease(connection, wallet, vault);
        if (success) {
            totalBounty += vault.bountyLamports;
            successCount++;
        }
    }

    if (successCount > 0) {
        console.log(`\n🏆 Session summary:`);
        console.log(`   Vaults triggered: ${successCount}/${expiredVaults.length}`);
        console.log(`   Total bounty: ${(totalBounty / 1e9).toFixed(4)} SOL`);
    }
}

async function main() {
    console.log('');
    console.log('🪦 ═══════════════════════════════════════════');
    console.log('   GRAVEDIGGER SDK - Bounty Hunter Protocol');
    console.log('   "Your vault is triggered by market incentives"');
    console.log('═══════════════════════════════════════════════');
    console.log('');

    // Load wallet
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        console.error('❌ PRIVATE_KEY environment variable not set');
        console.log('   Set it with: export PRIVATE_KEY=<base58_encoded_private_key>');
        process.exit(1);
    }

    let wallet: Keypair;
    try {
        wallet = Keypair.fromSecretKey(bs58.decode(privateKey));
    } catch (e) {
        console.error('❌ Invalid PRIVATE_KEY format');
        process.exit(1);
    }

    const connection = new Connection(RPC_URL, 'confirmed');

    console.log(`🌐 RPC: ${RPC_URL}`);
    console.log(`👛 Hunter: ${wallet.publicKey.toBase58()}`);
    console.log(`⏱️  Poll interval: ${POLL_INTERVAL / 1000}s`);
    console.log(`💰 Min bounty: ${MIN_BOUNTY / 1e9} SOL`);
    console.log('');

    // Initial hunt
    await hunt(connection, wallet);

    // Continuous hunting
    console.log(`\n🔁 Starting continuous scan every ${POLL_INTERVAL / 1000} seconds...`);
    console.log('   Press Ctrl+C to stop.\n');

    setInterval(() => hunt(connection, wallet), POLL_INTERVAL);
}

main().catch(console.error);
