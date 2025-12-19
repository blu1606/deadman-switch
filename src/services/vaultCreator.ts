import { BN, Program, AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, Connection } from '@solana/web3.js';
import { getVaultPDA } from '@/utils/anchor';
import { DeadmansSwitch } from '@/types/deadmans-switch';

export interface InitializeVaultParams {
    connection: Connection;
    wallet: {
        publicKey: PublicKey;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signTransaction: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signAllTransactions: any;
    };
    seed: BN;
    cid: string;
    keyInfo: string;
    recipientAddress: string;
    timeInterval: number;
    vaultName: string;
    lockedSol: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendTransaction: (tx: any, connection: Connection) => Promise<string>;
}

export async function initializeSolanaVault({
    connection,
    wallet,
    seed,
    cid,
    keyInfo,
    recipientAddress,
    timeInterval,
    vaultName,
    lockedSol,
    sendTransaction
}: InitializeVaultParams) {
    const provider = new AnchorProvider(
        connection,
        wallet,
        { commitment: 'confirmed' }
    );

    const [vaultPda] = getVaultPDA(wallet.publicKey, seed);
    const recipientPubkey = new PublicKey(recipientAddress);

    const idl = await import('@/idl/deadmans_switch.json');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = new Program<DeadmansSwitch>(idl as any, provider);

    const transaction = await program.methods
        .initializeVault(
            seed,
            cid,
            keyInfo,
            recipientPubkey,
            new BN(timeInterval),
            new BN(1_000_000), // 0.001 SOL bounty
            vaultName || 'Untitled Vault',
            new BN(lockedSol * 1_000_000_000)
        )
        .accounts({
            vault: vaultPda,
            owner: wallet.publicKey,
            systemProgram: SystemProgram.programId,
        })
        .transaction();

    const tx = await sendTransaction(transaction, connection);

    return { tx, vaultPda };
}
