import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';

// Program ID - Update this after deploying to devnet
export const PROGRAM_ID = new PublicKey('HnFEhMS84CabpztHCDdGGN8798NxNse7NtXW4aG17XpB');

// Network configuration
export const NETWORK = 'devnet' as const;
export const RPC_ENDPOINT = clusterApiUrl(NETWORK);

// Connection singleton
let connectionInstance: Connection | null = null;

export const getConnection = (): Connection => {
    if (!connectionInstance) {
        connectionInstance = new Connection(RPC_ENDPOINT, 'confirmed');
    }
    return connectionInstance;
};

import { BN } from '@coral-xyz/anchor';

// Vault PDA helper
export const getVaultPDA = (owner: PublicKey, seed: BN): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from('vault'),
            owner.toBuffer(),
            seed.toArrayLike(Buffer, 'le', 8)
        ],
        PROGRAM_ID
    );
};

// IDL will be imported after anchor build generates it
// For now, we export the type for use in hooks
export interface VaultAccount {
    owner: PublicKey;
    recipient: PublicKey;
    ipfsCid: string;
    encryptedKey: string;
    timeInterval: bigint;
    lastCheckIn: bigint;
    isReleased: boolean;
    bump: number;
    lockedLamports: BN;
    tokenMint: PublicKey | null;
    lockedTokens: BN;
}

// Helper to calculate time until expiry
export const getTimeUntilExpiry = (lastCheckIn: bigint, timeInterval: bigint): number => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const expiry = lastCheckIn + timeInterval;
    const remaining = expiry - now;
    return remaining > BigInt(0) ? Number(remaining) : 0;
};

// Helper to check if vault is expired
export const isVaultExpired = (lastCheckIn: bigint, timeInterval: bigint): boolean => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    return now > lastCheckIn + timeInterval;
};
