'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
const VaultSafe3D = dynamic(() => import('./VaultSafe3D'), { ssr: false });
import { VaultData } from '@/utils/solanaParsers';
import { truncateAddress } from '@/lib/utils';

interface VaultCardProps {
    vault: VaultData;
    onClaim: (vault: VaultData) => void;
}

export default function VaultCard({ vault, onClaim }: VaultCardProps) {
    const isReleased = vault.isReleased;

    // Calculate status
    const now = Math.floor(Date.now() / 1000);
    const lastCheckIn = vault.lastCheckIn.toNumber();
    const interval = vault.timeInterval.toNumber();
    const expiry = lastCheckIn + interval;
    const isExpired = now > expiry;

    const canClaim = isReleased || isExpired;

    // Dates
    const unlockDate = new Date(expiry * 1000).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    const getStatusLabel = () => {
        if (canClaim) return 'READY TO DECRYPT';
        return `LOCKED UNTIL ${unlockDate.toUpperCase()}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={canClaim ? { y: -5 } : {}}
            onClick={() => canClaim && onClaim(vault)}
            className={`relative z-50 flex flex-col items-center justify-between p-6 rounded-3xl border transition-all duration-300 overflow-hidden min-h-[400px] ${canClaim
                ? 'cursor-pointer border-primary-500/50 bg-dark-800/80 shadow-[0_0_30px_rgba(99,102,241,0.15)] hover:shadow-[0_0_50px_rgba(99,102,241,0.25)] hover:border-primary-500'
                : 'cursor-not-allowed border-dark-700 bg-dark-900/40 grayscale-[0.3]'
                }`}
        >
            {/* Background Glow for Claimable */}
            {canClaim && (
                <div className="absolute inset-0 bg-primary-500/5 rounded-3xl blur-xl group-hover:bg-primary-500/10 transition-all duration-500" />
            )}

            {/* Top Meta: Sender */}
            <div className="relative z-10 w-full flex justify-between items-start mb-4">
                <div className="flex flex-col">
                    <span className="text-[10px] text-dark-500 uppercase tracking-widest font-mono">
                        {canClaim ? 'SENT BY' : 'LOCKED BY'}
                    </span>
                    <span className="text-xs font-mono text-dark-300 border-b border-dark-700/50 pb-0.5">
                        {truncateAddress(vault.owner.toBase58())}
                    </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                    {canClaim && (
                        <span className="text-[10px] font-bold tracking-wider text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 animate-pulse">
                            UNLOCKED
                        </span>
                    )}
                    {/* 11.2: Premium Gas Pre-paid Badge */}
                    {vault.lockedLamports && vault.lockedLamports.toNumber() > 0 && (
                        <span className="text-[10px] font-bold tracking-wider text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 flex items-center gap-1">
                            ⚡ GAS PRE-PAID
                        </span>
                    )}
                </div>
            </div>

            {/* Center: The Safe Visual */}
            <div className="relative z-10 my-auto scale-90">
                <VaultSafe3D
                    isUnlocking={false}
                    label={getStatusLabel()}
                />
            </div>

            {/* Bottom Meta: Name & Action */}
            <div className="relative z-10 w-full mt-6 text-center">
                <h3 className={`text-lg font-bold mb-1 line-clamp-1 ${canClaim ? 'text-white' : 'text-dark-300'}`}>
                    {vault.name || `Vault #${vault.publicKey.toBase58().slice(0, 6)}`}
                </h3>

                {!canClaim && (
                    <p className="text-xs text-primary-400 font-mono">
                        Opens on {unlockDate}
                    </p>
                )}

                {canClaim && (
                    <button
                        className="mt-4 w-full py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2"
                    >
                        <span>🔓</span> Click to Open
                    </button>
                )}
            </div>
        </motion.div>
    );
}
