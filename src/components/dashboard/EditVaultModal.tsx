'use client';

import { FC } from 'react';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { useEditVault } from '@/hooks/useEditVault';
import DuressSettings from './DuressSettings';
import MagicLinkSettings from './MagicLinkSettings';

interface EditVaultModalProps {
    vault: {
        publicKey: PublicKey;
        recipient: PublicKey;
        timeInterval: BN;
        name?: string;
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
    const {
        recipientAddress, setRecipientAddress,
        timeInterval, setTimeInterval,
        vaultName, setVaultName,
        duressEnabled, setDuressEnabled,
        emergencyEmail, setEmergencyEmail,
        status,
        error,
        handleUpdate
    } = useEditVault({ vault, onSuccess });

    // Helper for magic link init state
    const magicLinkInitState = (() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(`magic_link_${vault.publicKey.toBase58()}`) === 'true';
        }
        return false;
    })();

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
                            {/* Vault Name */}
                            <div>
                                <label className="block text-xs font-medium text-dark-300 mb-1">
                                    Vault Name
                                </label>
                                <input
                                    type="text"
                                    value={vaultName}
                                    onChange={(e) => setVaultName(e.target.value)}
                                    maxLength={32}
                                    className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white"
                                    placeholder="My Vault"
                                />
                            </div>

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

                        <DuressSettings
                            enabled={duressEnabled}
                            setEnabled={setDuressEnabled}
                            email={emergencyEmail}
                            setEmail={setEmergencyEmail}
                        />

                        <MagicLinkSettings
                            vault={vault}
                            initialEnabled={magicLinkInitState}
                            onError={(msg) => console.error(msg)} // Or handle more visibly
                        />

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
