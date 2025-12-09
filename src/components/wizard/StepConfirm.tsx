'use client';

import { FC, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { VaultFormData } from '@/app/create/page';
import { uploadToIPFSWithRetry } from '@/utils/ipfs';
import { PROGRAM_ID, getVaultPDA } from '@/utils/anchor';
import { createEmptyBundle, addItemToBundle, bundleToBlob } from '@/utils/vaultBundle';

interface Props {
    formData: VaultFormData;
    onBack: () => void;
    onSuccess: () => void;
}

type Status = 'idle' | 'uploading' | 'confirming' | 'success' | 'error';

const StepConfirm: FC<Props> = ({ formData, onBack, onSuccess }) => {
    const { publicKey, signTransaction, signAllTransactions } = useWallet();
    const { connection } = useConnection();

    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState<string | null>(null);
    const [ipfsCid, setIpfsCid] = useState<string | null>(null);
    const [txSignature, setTxSignature] = useState<string | null>(null);

    // Vault name state (10.1)
    const [vaultName, setVaultName] = useState(formData.vaultName || '');

    // Email state
    const [ownerEmail, setOwnerEmail] = useState('');
    const [recipientEmail, setRecipientEmail] = useState('');

    // Locked SOL state
    const [lockedSol, setLockedSol] = useState<number>(0);

    const formatInterval = (seconds: number): string => {
        const days = Math.floor(seconds / (24 * 60 * 60));
        if (days >= 365) return `${Math.floor(days / 365)} year`;
        if (days >= 30) return `${Math.floor(days / 30)} months`;
        return `${days} days`;
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const truncateAddress = (address: string): string => {
        return `${address.slice(0, 6)}...${address.slice(-6)}`;
    };

    const handleCreateVault = async () => {
        if (!publicKey || !signTransaction || !signAllTransactions) {
            setError('Wallet not connected properly');
            return;
        }

        // Check for any content: bundleItems OR file OR encryptedBlob
        const hasContent = (formData.bundleItems && formData.bundleItems.length > 0) || formData.file || formData.encryptedBlob;
        if (!hasContent) {
            setError('No content to encrypt');
            return;
        }

        setStatus('uploading');
        setError(null);

        try {
            let blobToUpload = formData.encryptedBlob;
            const seed = new BN(Date.now());

            // 10.2: Handle Bundle Encryption (if not already encrypted)
            if (!blobToUpload) {
                // Determine source file: either a bundle of items OR legacy single file
                let fileToEncrypt: File | null = formData.file;

                if (formData.bundleItems && formData.bundleItems.length > 0) {
                    // Create Bundle
                    let bundle = createEmptyBundle();
                    // Assuming items are already fully formed VaultItems (from VaultContentEditor)
                    // We just need to add them to the bundle struct correctly
                    // VaultContentEditor returns full VaultItems, but addItemToBundle expects Omit<VaultItem, id|createdAt>
                    // Actually, VaultContentEditor creates full items. We can just push them to bundle.items if we trust them, 
                    // or re-add them. For simplicity, let's assemble manually to match util expectations or just use the utility

                    // Re-constructing mostly to ensure metadata is fresh
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
                    // Wallet Mode
                    const { createWalletProtectedVaultPackage } = await import('@/utils/crypto');
                    const result = await createWalletProtectedVaultPackage(
                        fileToEncrypt,
                        formData.recipientAddress,
                        seed.toString()
                    );
                    blobToUpload = result.blob;
                } else if (formData.encryptionMode === 'password') {
                    // Password Mode (Late encryption if needed, though usually StepUploadSecret does this)
                    // If StepUploadSecret did NOT encrypt yet (e.g. we changed flow), do it here.
                    // IMPORTANT: StepUploadSecret current logic asks for password map, but if we moved to lazy encryption, we need password here.
                    // The new StepUploadSecret passes 'password' in formData but didn't encrypt yet.
                    if (!formData.password) throw new Error('Password required for encryption');

                    const { createPasswordProtectedVaultPackage } = await import('@/utils/crypto');
                    const result = await createPasswordProtectedVaultPackage(
                        fileToEncrypt,
                        formData.password
                    );
                    blobToUpload = result.blob;
                }
            }

            if (!blobToUpload) {
                throw new Error('Failed to create encrypted package');
            }

            // Step 1: Upload to IPFS
            const cid = await uploadToIPFSWithRetry(blobToUpload, 'vault-data.json');
            setIpfsCid(cid);

            // Step 2: Call smart contract
            setStatus('confirming');

            const provider = new AnchorProvider(
                connection,
                { publicKey, signTransaction, signAllTransactions },
                { commitment: 'confirmed' }
            );

            const [vaultPda] = getVaultPDA(publicKey, seed);
            const recipientPubkey = new PublicKey(formData.recipientAddress);

            const idl = await import('@/idl/deadmans_switch.json');
            const program = new Program(idl as any, provider);

            // For wallet mode, store the seed in the encrypted_key field
            const keyInfo = formData.encryptionMode === 'wallet'
                ? `wallet:${seed.toString()}`
                : formData.aesKeyBase64;

            const tx = await (program.methods as any)
                .initializeVault(
                    seed,
                    cid,
                    keyInfo,
                    recipientPubkey,
                    new BN(formData.timeInterval),
                    new BN(1_000_000), // 0.001 SOL bounty (~2x gas fee)
                    vaultName || 'Untitled Vault', // 10.1: Vault name
                    new BN(lockedSol * 1_000_000_000) // T.1: locked_lamports (SOL -> lamports)
                )
                .accounts({
                    vault: vaultPda,
                    owner: publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            setTxSignature(tx);

            await saveContacts(vaultPda.toBase58());

            setStatus('success');

            setTimeout(() => {
                onSuccess();
            }, 3000);
        } catch (err: any) {
            console.error('Vault creation failed:', err);
            setError(err.message || 'Failed to create vault');
            setStatus('error');
        }
    };

    const saveContacts = async (vaultAddress: string) => {
        if (!ownerEmail && !recipientEmail) return;

        try {
            await fetch('/api/vault/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vaultAddress,
                    ownerEmail,
                    recipientEmail,
                }),
            });
        } catch (err) {
            console.error('Failed to save contacts:', err);
            // Don't block success flow if email save fails
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-2">Review & Confirm</h2>
                <p className="text-dark-400 text-sm">
                    Review your vault settings before creating.
                </p>
            </div>

            {/* Vault Name Input - 10.1 */}
            <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
                <label className="block text-sm text-dark-400 mb-2">Vault Name (optional)</label>
                <input
                    type="text"
                    placeholder="My Vault"
                    maxLength={32}
                    value={vaultName}
                    onChange={(e) => setVaultName(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-dark-500 mt-1">Give your vault a memorable name</p>
            </div>

            {/* Summary Cards */}
            <div className="space-y-3">
                {/* File Info */}
                <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-dark-400">Encrypted File</p>
                                <p className="font-medium">{formData.file?.name || 'Unknown'}</p>
                            </div>
                        </div>
                        <span className="text-dark-400 text-sm">
                            {formData.file ? formatFileSize(formData.file.size) : '-'}
                        </span>
                    </div>
                </div>

                {/* Recipient */}
                <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-dark-400">Recipient</p>
                            <p className="font-medium font-mono">
                                {truncateAddress(formData.recipientAddress)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Interval */}
                <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-dark-400">Check-in Interval</p>
                            <p className="font-medium">{formatInterval(formData.timeInterval)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lock SOL (T.1) */}
            <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <span className="text-xl">💰</span>
                    Lock Asset (Phase 1: SOL Only)
                </h3>
                <p className="text-sm text-dark-400">
                    Optionally lock SOL in the vault. The recipient can claim this amount ONLY after the vault is released.
                </p>

                <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-600/50">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-white">Amount (SOL)</label>
                        <span className="text-xs text-dark-400">Balance: ...</span>
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            onChange={(e) => setLockedSol(parseFloat(e.target.value) || 0)}
                            className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white font-mono focus:border-primary-500 focus:outline-none transition-colors"
                        />
                        <span className="absolute right-4 top-3 text-dark-400 font-mono">SOL</span>
                    </div>
                    <p className="text-xs text-dark-500 mt-2">
                        This amount will be transferred from your wallet to the vault upon creation.
                    </p>
                </div>
            </div>

            {/* Bounty Hunter (Optional) */}
            <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    Release Bounty (Optional)
                </h3>
                <p className="text-sm text-dark-400">
                    Tip the network to auto-release your vault when the timer expires.
                    Higher bounty = faster, guaranteed trigger.
                </p>

                <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-600/50">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-white">Bounty Amount</span>
                        <span className="font-mono text-primary-400 text-lg">0.001 SOL</span>
                    </div>

                    <div className="relative h-2 bg-dark-700 rounded-full mb-2">
                        <div className="absolute left-0 top-0 h-full bg-primary-500 rounded-full w-[1%]" />
                    </div>

                    <div className="flex justify-between text-xs text-dark-500 font-mono">
                        <span>0.001 SOL</span>
                        <span>0.10 SOL</span>
                    </div>

                    <p className="text-xs text-dark-400 mt-3 text-center">
                        ≈ $0.20 (Covers 2x gas fee)
                    </p>
                </div>
            </div>

            {/* Email Notifications (Opt-in) */}
            <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Email Notifications (Optional)
                </h3>
                <p className="text-sm text-dark-400">
                    Get reminders to check in, and notify the recipient when the vault is released.
                    Emails are stored securely off-chain.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-dark-400 mb-1">Your Email (for reminders)</label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={ownerEmail}
                            onChange={(e) => setOwnerEmail(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-dark-400 mb-1">Recipient Email (for release)</label>
                        <input
                            type="email"
                            placeholder="heir@example.com"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Status Messages */}
            {status === 'uploading' && (
                <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-primary-400">Uploading to IPFS...</span>
                    </div>
                </div>
            )}

            {status === 'confirming' && (
                <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        <div>
                            <span className="text-primary-400">Confirming transaction...</span>
                            {ipfsCid && (
                                <p className="text-dark-400 text-sm mt-1">IPFS CID: {ipfsCid.slice(0, 20)}...</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {status === 'success' && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-green-400 font-medium">Vault Created Successfully!</p>
                            {txSignature && (
                                <a
                                    href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-dark-400 text-sm hover:text-primary-400"
                                >
                                    View Transaction →
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {status === 'error' && error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
                <button
                    onClick={onBack}
                    disabled={status === 'uploading' || status === 'confirming'}
                    className={`btn-secondary ${status === 'uploading' || status === 'confirming' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    ← Back
                </button>
                <button
                    onClick={handleCreateVault}
                    disabled={status !== 'idle' && status !== 'error'}
                    className={`btn-primary ${status !== 'idle' && status !== 'error' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {status === 'idle' || status === 'error' ? '🔐 Create Vault' : 'Processing...'}
                </button>
            </div>
        </div>
    );
};

export default StepConfirm;
