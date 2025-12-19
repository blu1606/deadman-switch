'use client';

import { FC } from 'react';
import { motion } from 'framer-motion';
import VaultSafe from '../VaultSafe';
import VaultTimeline from '../VaultTimeline';
import { getCreatedDate } from '@/lib/utils';
import { PublicKey } from '@solana/web3.js';

interface Props {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vault: any;
    publicKey: PublicKey | null;
    encryptionMode: 'password' | 'wallet' | null;
    password: string;
    setPassword: (val: string) => void;
    error: string | null;
    loadingMetadata: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipfsData: any;
    onUnlock: () => void;
    onClose: () => void;
}

const truncateAddress = (address: string): string => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export const ClaimInputState: FC<Props> = ({
    vault,
    publicKey,
    encryptionMode,
    password,
    setPassword,
    error,
    loadingMetadata,
    ipfsData,
    onUnlock,
    onClose
}) => {
    const isGaslessEligible = vault?.gasTank && parseInt(vault.gasTank) > 0;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Safe Preview */}
            <div className="mb-8">
                <VaultSafe state="locked" />
                <div className="mt-8">
                    <VaultTimeline
                        createdAt={getCreatedDate(vault.vaultSeed)}
                        releasedAt={new Date((vault.lastCheckIn.toNumber() + vault.timeInterval.toNumber()) * 1000)}
                        senderAddress={vault.owner.toBase58()}
                        isReleased={vault.isReleased}
                    />
                </div>
            </div>

            {/* Gasless Claim Indicator */}
            {isGaslessEligible && (
                <div className="mb-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <span className="text-xl">⚡</span>
                        </div>
                        <div>
                            <p className="text-amber-400 font-medium">Premium Vault</p>
                            <p className="text-dark-400 text-sm">Gas fees are pre-paid. Claim for free!</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading Metadata */}
            {loadingMetadata && (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-dark-400 text-sm">Fetching vault security data...</p>
                </div>
            )}

            {/* Encryption Mode Info */}
            {!loadingMetadata && (
                <div className="mb-6 animate-fade-in">
                    {encryptionMode === 'wallet' ? (
                        <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-6 text-center">
                            <div className="text-4xl mb-4 bg-primary-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto">🔑</div>
                            <h3 className="text-xl font-bold text-white mb-2">Wallet Protected</h3>
                            <p className="text-primary-200">
                                This vault is secured by your wallet address.
                            </p>
                            <div className="mt-4 inline-block px-3 py-1 bg-dark-900/50 rounded-full text-xs font-mono text-dark-300">
                                {truncateAddress(publicKey ? publicKey.toBase58() : '...')}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-dark-800 border border-dark-700 mb-3">
                                    <span className="text-2xl">🔒</span>
                                </div>
                                <h3 className="text-lg font-medium text-white">Enter Password</h3>
                                <p className="text-dark-400 text-sm">
                                    The owner set a password for this vault.
                                </p>
                            </div>

                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && onUnlock()}
                                    className="w-full bg-dark-900/80 border border-dark-600 rounded-xl px-4 py-4 text-center text-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder:text-dark-600"
                                    placeholder="••••••••••••"
                                    autoFocus
                                />
                            </div>

                            {/* Password Hint Display */}
                            {ipfsData?.metadata?.hint && (
                                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 text-center">
                                    <span className="text-xs text-yellow-500/70 font-bold uppercase tracking-wider block mb-1">
                                        💡 Hint
                                    </span>
                                    <p className="text-yellow-200/90 text-sm font-medium">
                                        &quot;{ipfsData.metadata.hint}&quot;
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Error */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 mb-6 text-red-400 text-sm"
                >
                    ⚠️ {error}
                </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 btn-secondary">
                    Cancel
                </button>
                <button onClick={onUnlock} className="flex-1 btn-primary">
                    {encryptionMode === 'wallet' ? '🔓 Unlock with Wallet' : '🔓 Unlock Vault'}
                </button>
            </div>
        </motion.div>
    );
};
