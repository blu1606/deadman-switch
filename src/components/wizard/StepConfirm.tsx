'use client';

import { FC, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { VaultFormData } from '@/app/create/page';
import { uploadToIPFSWithRetry } from '@/utils/ipfs';
import { PROGRAM_ID, getVaultPDA } from '@/utils/anchor';

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
        if (!publicKey || !formData.encryptedBlob || !signTransaction || !signAllTransactions) {
            setError('Wallet not connected properly');
            return;
        }

        setStatus('uploading');
        setError(null);

        try {
            // Step 1: Upload to IPFS
            const cid = await uploadToIPFSWithRetry(formData.encryptedBlob, 'vault-data.json');
            setIpfsCid(cid);

            // Step 2: Call smart contract
            setStatus('confirming');

            // Create provider
            const provider = new AnchorProvider(
                connection,
                { publicKey, signTransaction, signAllTransactions },
                { commitment: 'confirmed' }
            );

            // Generate a unique seed for this vault
            const seed = new BN(Date.now());

            // Get vault PDA
            const [vaultPda] = getVaultPDA(publicKey, seed);

            // Create the instruction manually since we don't have IDL loaded
            // For now, we'll use a simplified approach
            const recipientPubkey = new PublicKey(formData.recipientAddress);

            // Note: In production, we'd load the IDL and use program.methods
            // For MVP, we'll construct the transaction using the IDL types
            const idl = await import('@/idl/deadmans_switch.json');
            const program = new Program(idl as any, provider);

            const tx = await (program.methods as any)
                .initializeVault(
                    seed, // Pass seed as first argument
                    cid,
                    formData.aesKeyBase64,
                    recipientPubkey,
                    new BN(formData.timeInterval)
                )
                .accounts({
                    vault: vaultPda,
                    owner: publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            setTxSignature(tx);
            setStatus('success');

            // Wait a moment then redirect
            setTimeout(() => {
                onSuccess();
            }, 3000);
        } catch (err: any) {
            console.error('Vault creation failed:', err);
            setError(err.message || 'Failed to create vault');
            setStatus('error');
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
