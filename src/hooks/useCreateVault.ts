'use client';

import { useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useUnifiedWallet as useWallet } from '@/hooks/useUnifiedWallet';
import { BN } from '@coral-xyz/anchor';
import { VaultFormData } from '@/types/vaultForm';
import { uploadToIPFSWithRetry } from '@/utils/ipfs';
import { createEmptyBundle, bundleToBlob } from '@/utils/vaultBundle';
import { indexVault } from '@/services/vault';

export type CreateStatus = 'idle' | 'uploading' | 'confirming' | 'success' | 'error';

export const useCreateVault = () => {
    const { publicKey, signTransaction, signAllTransactions } = useWallet();
    const { connection } = useConnection();

    const [status, setStatus] = useState<CreateStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [ipfsCid, setIpfsCid] = useState<string | null>(null);
    const [txSignature, setTxSignature] = useState<string | null>(null);

    const createVault = async (formData: VaultFormData, vaultName: string, lockedSol: number, ownerEmail: string, recipientEmail: string) => {
        if (!publicKey || !signTransaction || !signAllTransactions) {
            throw new Error('Wallet not connected properly');
        }

        const hasContent = (formData.bundleItems && formData.bundleItems.length > 0) || formData.file || formData.encryptedBlob;
        if (!hasContent) {
            throw new Error('No content to encrypt');
        }

        setStatus('uploading');
        setError(null);

        try {
            let blobToUpload = formData.encryptedBlob;
            const seed = new BN(Date.now());

            // Handle Bundle/Encryption
            if (!blobToUpload) {
                let fileToEncrypt: File | null = formData.file;

                if (formData.bundleItems && formData.bundleItems.length > 0) {
                    const bundle = createEmptyBundle();
                    bundle.items = formData.bundleItems;
                    bundle.metadata = {
                        totalSize: formData.bundleItems.reduce((acc, item) => acc + item.size, 0),
                        itemCount: formData.bundleItems.length
                    };

                    const bundleBlob = bundleToBlob(bundle);
                    fileToEncrypt = new File([bundleBlob], 'vault_bundle.json', { type: 'application/json' });
                }

                if (!fileToEncrypt) {
                    throw new Error('No content to encrypt');
                }

                if (formData.encryptionMode === 'wallet') {
                    const { createWalletProtectedVaultPackage } = await import('@/utils/crypto');
                    const result = await createWalletProtectedVaultPackage(
                        fileToEncrypt,
                        formData.recipientAddress,
                        seed.toString()
                    );
                    blobToUpload = result.blob;
                } else if (formData.encryptionMode === 'password') {
                    if (!formData.password) throw new Error('Password required for encryption');

                    const { createPasswordProtectedVaultPackage } = await import('@/utils/crypto');
                    const result = await createPasswordProtectedVaultPackage(
                        fileToEncrypt,
                        formData.password,
                        formData.passwordHint
                    );
                    blobToUpload = result.blob;
                }
            }

            if (!blobToUpload) {
                throw new Error('Failed to create encrypted package');
            }

            const cid = await uploadToIPFSWithRetry(blobToUpload, 'vault-data.json');
            setIpfsCid(cid);

            setStatus('confirming');

            const { initializeSolanaVault } = await import('@/services/vaultCreator');

            const keyInfo = formData.encryptionMode === 'wallet'
                ? `wallet:${seed.toString()}`
                : formData.aesKeyBase64;

            const { tx, vaultPda } = await initializeSolanaVault({
                connection,
                wallet: { publicKey, signTransaction, signAllTransactions },
                seed,
                cid,
                keyInfo: keyInfo || '',
                recipientAddress: formData.recipientAddress,
                timeInterval: formData.timeInterval,
                vaultName: vaultName || 'Untitled Vault',
                lockedSol
            });

            setTxSignature(tx);

            // Save contacts
            if (ownerEmail || recipientEmail) {
                try {
                    await fetch('/api/vault/contact', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            vaultAddress: vaultPda.toBase58(),
                            ownerEmail,
                            recipientEmail,
                        }),
                    });
                } catch (err) {
                    console.error('Failed to save contacts:', err);
                }
            }

            // Index vault
            await indexVault(
                vaultPda.toBase58(),
                publicKey.toBase58(),
                formData.recipientAddress
            );

            setStatus('success');
            return tx;
        } catch (err: unknown) {
            const error = err as Error;
            console.error('Vault creation failed:', error);
            const msg = error.message || 'Failed to create vault';
            setError(msg);
            setStatus('error');
            throw error;
        }
    };

    return {
        createVault,
        status,
        error,
        ipfsCid,
        txSignature,
        reset: () => {
            setStatus('idle');
            setError(null);
            setIpfsCid(null);
            setTxSignature(null);
        }
    };
};
