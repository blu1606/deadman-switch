'use client';

import { FC, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';

interface DelegateModalProps {
    vault: {
        publicKey: PublicKey;
        delegate?: PublicKey | null;
    };
    onClose: () => void;
    onSuccess: () => void;
}

const DelegateModal: FC<DelegateModalProps> = ({ vault, onClose, onSuccess }) => {
    const { publicKey, signTransaction, signAllTransactions } = useWallet();
    const { connection } = useConnection();

    const [delegateAddress, setDelegateAddress] = useState(
        vault.delegate?.toBase58() || ''
    );
    const [status, setStatus] = useState<'idle' | 'setting' | 'clearing' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const handleSetDelegate = async () => {
        if (!publicKey || !signTransaction || !signAllTransactions) {
            setError('Wallet not connected');
            return;
        }

        if (!delegateAddress.trim()) {
            setError('Please enter a delegate address');
            return;
        }

        // Validate delegate address
        let delegatePubkey: PublicKey;
        try {
            delegatePubkey = new PublicKey(delegateAddress);
        } catch {
            setError('Invalid delegate address');
            return;
        }

        // Don't allow setting self as delegate
        if (delegatePubkey.equals(publicKey)) {
            setError('Cannot delegate to yourself');
            return;
        }

        setStatus('setting');
        setError(null);

        try {
            const provider = new AnchorProvider(
                connection,
                { publicKey, signTransaction, signAllTransactions },
                { commitment: 'confirmed' }
            );

            const idl = await import('@/idl/deadmans_switch.json');
            const program = new Program(idl as any, provider);

            await (program.methods as any)
                .setDelegate(delegatePubkey)
                .accounts({
                    vault: vault.publicKey,
                    owner: publicKey,
                })
                .rpc();

            setStatus('success');
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err: any) {
            console.error('Set delegate failed:', err);
            setError(err.message || 'Failed to set delegate');
            setStatus('error');
        }
    };

    const handleClearDelegate = async () => {
        if (!publicKey || !signTransaction || !signAllTransactions) {
            setError('Wallet not connected');
            return;
        }

        setStatus('clearing');
        setError(null);

        try {
            const provider = new AnchorProvider(
                connection,
                { publicKey, signTransaction, signAllTransactions },
                { commitment: 'confirmed' }
            );

            const idl = await import('@/idl/deadmans_switch.json');
            const program = new Program(idl as any, provider);

            await (program.methods as any)
                .setDelegate(null)
                .accounts({
                    vault: vault.publicKey,
                    owner: publicKey,
                })
                .rpc();

            setStatus('success');
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err: any) {
            console.error('Clear delegate failed:', err);
            setError(err.message || 'Failed to clear delegate');
            setStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-dark-800 rounded-xl max-w-md w-full p-6 border border-dark-700 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">👤 Manage Delegate</h2>
                    <button onClick={onClose} className="text-dark-400 hover:text-white transition-colors">✕</button>
                </div>

                {status === 'success' ? (
                    <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-6 text-center animate-fade-in">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">✓</span>
                        </div>
                        <h3 className="text-green-400 font-bold text-lg">Delegate Updated!</h3>
                    </div>
                ) : (
                    <>
                        {/* Info box */}
                        <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 mb-6">
                            <p className="text-sm text-primary-300">
                                <strong>🔐 What is a delegate?</strong>
                            </p>
                            <p className="text-xs text-dark-400 mt-2">
                                A delegate is a secondary wallet (like a mobile "hot wallet") that can perform
                                check-ins on your behalf. The delegate can <strong>only ping</strong> — they
                                cannot update vault settings, close the vault, or access your encrypted data.
                            </p>
                        </div>

                        {/* Current delegate */}
                        {vault.delegate && (
                            <div className="bg-dark-900 rounded-lg p-3 mb-4">
                                <p className="text-xs text-dark-500 mb-1">Current Delegate</p>
                                <p className="font-mono text-sm text-white truncate">
                                    {vault.delegate.toBase58()}
                                </p>
                            </div>
                        )}

                        {/* Delegate input */}
                        <div className="mb-6">
                            <label className="block text-xs font-medium text-dark-300 mb-1">
                                Delegate Wallet Address
                            </label>
                            <input
                                type="text"
                                value={delegateAddress}
                                onChange={(e) => setDelegateAddress(e.target.value)}
                                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white font-mono text-sm"
                                placeholder="Enter Solana wallet address..."
                                disabled={status === 'setting' || status === 'clearing'}
                            />
                            <p className="text-xs text-dark-500 mt-2">
                                This wallet will be able to check-in on your behalf.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-4 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            {vault.delegate && (
                                <button
                                    onClick={handleClearDelegate}
                                    disabled={status === 'setting' || status === 'clearing'}
                                    className="btn-danger flex-1"
                                >
                                    {status === 'clearing' ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Clearing...
                                        </span>
                                    ) : (
                                        '🗑️ Clear'
                                    )}
                                </button>
                            )}
                            <button
                                onClick={handleSetDelegate}
                                disabled={status === 'setting' || status === 'clearing' || !delegateAddress.trim()}
                                className="btn-primary flex-1"
                            >
                                {status === 'setting' ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Setting...
                                    </span>
                                ) : (
                                    '✓ Set Delegate'
                                )}
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            disabled={status === 'setting' || status === 'clearing'}
                            className="w-full mt-3 btn-secondary"
                        >
                            Cancel
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default DelegateModal;
