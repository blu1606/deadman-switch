import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// Vault data structure matching on-chain account
export interface VaultData {
    publicKey: PublicKey;
    owner: PublicKey;
    recipient: PublicKey;
    ipfsCid: string;
    encryptedKey: string;
    timeInterval: BN;
    lastCheckIn: BN;
    isReleased: boolean;
    vaultSeed: BN;
    bump: number;
    delegate?: PublicKey | null;
    bountyLamports: BN; // Added: bounty for release trigger
    name: string; // 10.1: vault name
    lockedLamports: BN; // T.1
    tokenMint?: PublicKey | null; // T.2
    lockedTokens: BN; // T.2
}

export function parseVaultAccount(pubkey: PublicKey, data: Buffer): VaultData {
    let offset = 8; // Skip discriminator

    const owner = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;

    const recipient = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;

    const ipfsCidLen = data.readUInt32LE(offset);
    offset += 4;
    const ipfsCid = data.slice(offset, offset + ipfsCidLen).toString('utf-8');
    offset += ipfsCidLen;

    const encryptedKeyLen = data.readUInt32LE(offset);
    offset += 4;
    const encryptedKey = data.slice(offset, offset + encryptedKeyLen).toString('utf-8');
    offset += encryptedKeyLen;

    const timeInterval = new BN(data.slice(offset, offset + 8), 'le');
    offset += 8;

    const lastCheckIn = new BN(data.slice(offset, offset + 8), 'le');
    offset += 8;

    const isReleased = data[offset] === 1;
    offset += 1;

    const vaultSeed = new BN(data.slice(offset, offset + 8), 'le');
    offset += 8;

    const bump = data[offset];
    offset += 1;

    // Option<Pubkey> is serialized as: 1 byte (0=None, 1=Some) + 32 bytes if Some
    const hasDelegate = data[offset] === 1;
    offset += 1;
    let delegate: PublicKey | null = null;
    if (hasDelegate) {
        delegate = new PublicKey(data.slice(offset, offset + 32));
        offset += 32;
    }

    // bounty_lamports: u64
    const bountyLamports = new BN(data.slice(offset, offset + 8), 'le');
    offset += 8;

    // name: String (4 bytes length + UTF-8 content)
    let name = '';
    if (offset + 4 <= data.length) {
        const nameLen = data.readUInt32LE(offset);
        offset += 4;
        if (offset + nameLen <= data.length) {
            name = data.slice(offset, offset + nameLen).toString('utf-8');
            offset += nameLen;
        }
    }

    // locked_lamports: u64 (New T.1)
    let lockedLamports = new BN(0);
    if (offset + 8 <= data.length) {
        lockedLamports = new BN(data.slice(offset, offset + 8), 'le');
        offset += 8;
    }

    // token_mint: Option<Pubkey> (New T.2)
    let tokenMint: PublicKey | null = null;
    if (offset + 1 <= data.length) {
        const hasTokenMint = data[offset] === 1;
        offset += 1;
        if (hasTokenMint && offset + 32 <= data.length) {
            tokenMint = new PublicKey(data.slice(offset, offset + 32));
            offset += 32;
        }
    }

    // locked_tokens: u64 (New T.2)
    let lockedTokens = new BN(0);
    if (offset + 8 <= data.length) {
        lockedTokens = new BN(data.slice(offset, offset + 8), 'le');
        offset += 8;
    }

    return {
        publicKey: pubkey,
        owner,
        recipient,
        ipfsCid,
        encryptedKey,
        timeInterval,
        lastCheckIn,
        isReleased,
        vaultSeed,
        bump,
        delegate,
        bountyLamports,
        name,
        lockedLamports,
        tokenMint,
        lockedTokens
    };
}

