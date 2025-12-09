'use client';

import { FC, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';

interface EditVaultModalProps {
    vault: {
        publicKey: PublicKey;
        recipient: PublicKey;
        timeInterval: BN;
    };
    onClose: () => void;
    onSuccess: () => void;
}

const INTERVAL_OPTIONS = [
    { label: '30 Seconds (Testing)', value: 30 },
    { label: '1 Day', value: 86400 },
    { label: '7 Days', value: 7 * 86400 },
    { label: '30 Days', value: 30 * 86400 },
    { label: '90 Days', value: 90 * 86400 },
    { label: '1 Year', value: 365 * 86400 },
];

const EditVaultModal: FC<EditVaultModalProps> = ({ vault, onClose, onSuccess }) => {
    const { publicKey, signTransaction, signAllTransactions } = useWallet();
    const { connection } = useConnection();

    const [recipientAddress, setRecipientAddress] = useState(vault.recipient.toBase58());
    const [timeInterval, setTimeInterval] = useState(vault.timeInterval.toNumber());
    const [status, setStatus] = useState<'idle' | 'updating' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    // Duress Settings (Local Storage for MVP)
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

    const handleUpdate = async () => {
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

            const idl = await import('@/idl/deadmans_switch.json');
            const program = new Program(idl as any, provider);

            // Determine what changed
            const recipientChanged = recipientAddress !== vault.recipient.toBase58();
            const intervalChanged = timeInterval !== vault.timeInterval.toNumber();

            await (program.methods as any)
                .updateVault(
                    recipientChanged ? recipientPubkey : null,
                    intervalChanged ? new BN(timeInterval) : null
                )
                .accounts({
                    vault: vault.publicKey,
                    owner: publicKey,
                })
                .rpc();

            // Save Duress Settings (Local Only)
            if (typeof window !== 'undefined') {
                localStorage.setItem(`duress_enabled_${vault.publicKey.toBase58()}`, String(duressEnabled));
                localStorage.setItem(`duress_email_${vault.publicKey.toBase58()}`, emergencyEmail);
            }

            setStatus('success');
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err: any) {
            console.error('Update failed:', err);
            setError(err.message || 'Failed to update vault');
            setStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-dark-800 rounded-xl max-w-md w-full p-6 border border-dark-700 shadow-2xl">
                <h2 className="text-xl font-bold mb-4">Edit Vault Settings</h2>

                {status === 'success' ? (
                    <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-6 text-center animate-fade-in">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">✓</span>
                        </div>
                        <h3 className="text-green-400 font-bold text-lg">Vault Updated!</h3>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4 mb-6">
                            {/* Recipient Address */}
                            <div>
                                <label className="block text-xs font-medium text-dark-300 mb-1">
                                    Recipient Wallet Address
                                </label>
                                <input
                                    type="text"
                                    value={recipientAddress}
                                    onChange={(e) => setRecipientAddress(e.target.value)}
                                    className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white font-mono text-sm"
                                    placeholder="Solana wallet address..."
                                />
                            </div>

                            {/* Time Interval */}
                            <div>
                                <label className="block text-xs font-medium text-dark-300 mb-1">
                                    Check-in Interval
                                </label>
                                <select
                                    value={timeInterval}
                                    onChange={(e) => setTimeInterval(Number(e.target.value))}
                                    className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white"
                                >
                                    {INTERVAL_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-4 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="border-t border-dark-700 pt-6 mb-6">
                            <h3 className="text-sm font-bold text-dark-300 mb-4 uppercase tracking-wider">Silent Alarm (Duress Mode)</h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-white">Enable Duress Mode</label>
                                    <button
                                        onClick={() => setDuressEnabled(!duressEnabled)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${duressEnabled ? 'bg-red-500' : 'bg-dark-600'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${duressEnabled ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                {duressEnabled && (
                                    <div className="animate-fade-in">
                                        <label className="block text-xs font-medium text-dark-300 mb-1">
                                            Emergency Contact (Email)
                                        </label>
                                        <input
                                            type="email"
                                            value={emergencyEmail}
                                            onChange={(e) => setEmergencyEmail(e.target.value)}
                                            className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white text-sm"
                                            placeholder="sos@example.com"
                                        />
                                        <p className="text-[10px] text-dark-400 mt-2">
                                            ⚠️ Holding the check-in button for 5 seconds will trigger a silent alarm to this email instead of checking in.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={status === 'updating'}
                                className="flex-1 btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={status === 'updating'}
                                className="flex-1 btn-primary"
                            >
                                {status === 'updating' ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Updating...
                                    </span>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default EditVaultModal;
