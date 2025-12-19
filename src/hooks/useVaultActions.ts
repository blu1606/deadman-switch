'use client';

import { useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useUnifiedWallet as useWallet } from '@/hooks/useUnifiedWallet';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

export const useVaultActions = () => {
    const { publicKey, signTransaction, signAllTransactions } = useWallet();
    const { connection } = useConnection();
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const claimSol = async (vault: any) => {
        if (!publicKey || !signTransaction || !signAllTransactions) return;
        setActionLoading(true);
        setActionError(null);
        try {
            const provider = new AnchorProvider(connection, { publicKey, signTransaction, signAllTransactions }, { commitment: 'confirmed' });
            const idl = await import('@/idl/deadmans_switch.json');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const program = new Program(idl as any, provider);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (program.methods as any)
                .claimSol()
                .accounts({
                    vault: vault.publicKey,
                    recipient: publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();
        } catch (err: unknown) {
            const error = err as Error;
            console.error('Claim SOL failed:', error);
            setActionError(error.message || 'Failed to claim SOL');
            throw error;
        } finally {
            setActionLoading(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const claimTokens = async (vault: any) => {
        if (!publicKey || !signTransaction || !signAllTransactions) return;
        setActionLoading(true);
        setActionError(null);
        try {
            const provider = new AnchorProvider(connection, { publicKey, signTransaction, signAllTransactions }, { commitment: 'confirmed' });
            const idl = await import('@/idl/deadmans_switch.json');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const program = new Program(idl as any, provider);

            if (!vault.tokenMint) throw new Error("No token mint found for this vault");
            const tokenMint = new PublicKey(vault.tokenMint);
            const vaultTokenAccount = await getAssociatedTokenAddress(tokenMint, vault.publicKey, true);
            const recipientTokenAccount = await getAssociatedTokenAddress(tokenMint, publicKey);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (program.methods as any)
                .claimTokens()
                .accounts({
                    vault: vault.publicKey,
                    recipient: publicKey,
                    tokenMint: tokenMint,
                    vaultTokenAccount: vaultTokenAccount,
                    recipientTokenAccount: recipientTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();
        } catch (err: unknown) {
            const error = err as Error;
            console.error('Claim Tokens failed:', error);
            setActionError(error.message || 'Failed to claim tokens');
            throw error;
        } finally {
            setActionLoading(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const claimAndClose = async (vault: any) => {
        if (!publicKey || !signTransaction || !signAllTransactions) return;
        setActionLoading(true);
        setActionError(null);
        try {
            const provider = new AnchorProvider(connection, { publicKey, signTransaction, signAllTransactions }, { commitment: 'confirmed' });
            const idl = await import('@/idl/deadmans_switch.json');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const program = new Program(idl as any, provider);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (program.methods as any)
                .claimAndClose()
                .accounts({
                    vault: vault.publicKey,
                    recipient: publicKey,
                })
                .rpc();
        } catch (err: unknown) {
            const error = err as Error;
            console.error('Close failed:', error);
            let errorMessage = 'Failed to close vault';
            const errorString = String(err);
            if (errorString.includes('6000')) errorMessage = 'Only the designated recipient can close this vault.';
            else if (errorString.includes('6001')) errorMessage = 'Vault has not expired yet.';
            else if ((err as Error).message) errorMessage = (err as Error).message;
            setActionError(errorMessage);
            throw err;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        claimSol,
        claimTokens,
        claimAndClose,
        actionLoading,
        actionError
    };
};
