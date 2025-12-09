import { useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';

interface UseEditVaultProps {
    vault: {
        publicKey: PublicKey;
        recipient: PublicKey;
        timeInterval: BN;
        name?: string;
    };
    onSuccess: () => void;
}

export function useEditVault({ vault, onSuccess }: UseEditVaultProps) {
    const { publicKey, signTransaction, signAllTransactions } = useWallet();
    const { connection } = useConnection();

    // Form State
    const [recipientAddress, setRecipientAddress] = useState(vault.recipient.toBase58());
    const [timeInterval, setTimeInterval] = useState(vault.timeInterval.toNumber());
    const [vaultName, setVaultName] = useState(vault.name || '');

    // Status State
    const [status, setStatus] = useState<'idle' | 'updating' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    // Duress Settings (Local Storage)
    const [duressEnabled, setDuressEnabled] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(`duress_enabled_${vault.publicKey.toBase58()}`);
            return saved === 'true';
        }
        return false;
    });
    const [emergencyEmail, setEmergencyEmail] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(`duress_email_${vault.publicKey.toBase58()}`) || '';
        }
        return '';
    });

    const handleUpdate = useCallback(async () => {
        if (!publicKey || !signTransaction || !signAllTransactions) {
            setError('Wallet not connected');
            return;
        }

        // Validate recipient address
        let recipientPubkey: PublicKey;
        try {
            recipientPubkey = new PublicKey(recipientAddress);
        } catch {
            setError('Invalid recipient address');
            return;
        }

        setStatus('updating');
        setError(null);

        try {
            const provider = new AnchorProvider(
                connection,
                { publicKey, signTransaction, signAllTransactions },
                { commitment: 'confirmed' }
            );

            // Dynamic import to avoid SSR issues
            const idl = await import('@/idl/deadmans_switch.json');
            const program = new Program(idl as any, provider);

            // Determine what changed
            const recipientChanged = recipientAddress !== vault.recipient.toBase58();
            const intervalChanged = timeInterval !== vault.timeInterval.toNumber();
            const nameChanged = vaultName !== (vault.name || '');

            if (recipientChanged || intervalChanged || nameChanged) {
                await (program.methods as any)
                    .updateVault(
                        recipientChanged ? recipientPubkey : null,
                        intervalChanged ? new BN(timeInterval) : null,
                        nameChanged ? vaultName : null
                    )
                    .accounts({
                        vault: vault.publicKey,
                        owner: publicKey,
                    })
                    .rpc();
            } else {
                // If nothing on-chain changed, we still process the local storage updates below
                // Maybe we should simulate a delay or clarify behavior?
                // For now, let's just proceed to success if they just changed duress settings.
            }

            // Save Duress Settings to Supabase
            if (duressEnabled && emergencyEmail) {
                try {
                    await fetch('/api/vault/contact', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            vaultAddress: vault.publicKey.toBase58(),
                            contactEmail: emergencyEmail,
                            contactName: null, // Could add name field later
                            duressEnabled: duressEnabled
                        })
                    });
                } catch (e) {
                    console.error('Failed to save emergency contact:', e);
                    // Non-blocking - continue with success
                }
            }

            // Also save to localStorage as backup/cache
            if (typeof window !== 'undefined') {
                localStorage.setItem(`duress_enabled_${vault.publicKey.toBase58()}`, String(duressEnabled));
                localStorage.setItem(`duress_email_${vault.publicKey.toBase58()}`, emergencyEmail);
            }

            setStatus('success');
            setTimeout(() => {
                onSuccess();
            }, 1000);
        } catch (err: any) {
            console.error('Update failed:', err);
            setError(err.message || 'Failed to update vault');
            setStatus('error');
        }
    }, [
        publicKey, connection, signTransaction, signAllTransactions,
        vault, recipientAddress, timeInterval, vaultName,
        duressEnabled, emergencyEmail, onSuccess
    ]);

    return {
        // Form Data
        recipientAddress, setRecipientAddress,
        timeInterval, setTimeInterval,
        vaultName, setVaultName,

        // Duress Data
        duressEnabled, setDuressEnabled,
        emergencyEmail, setEmergencyEmail,

        // Status
        status,
        error,
        handleUpdate
    };
}
