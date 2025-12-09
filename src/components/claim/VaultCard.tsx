'use client';

import { motion } from 'framer-motion';
import VaultSafe3D from './VaultSafe3D';
import NotifyMeForm from './NotifyMeForm';

interface VaultCardProps {
    vault: any;
    onClaim: (vault: any) => void;
}

export default function VaultCard({ vault, onClaim }: VaultCardProps) {
    const isReleased = vault.isReleased;

    // Calculate status
    const now = Math.floor(Date.now() / 1000);
    const lastCheckIn = vault.lastCheckIn.toNumber();
    const interval = vault.timeInterval.toNumber();
    const expiry = lastCheckIn + interval;
    const isExpired = now > expiry;
    const timeRemaining = Math.max(0, expiry - now);

    const canClaim = isReleased || isExpired;

    const getStatusLabel = () => {
        if (isReleased) return '📭 LEGACY RELEASED';
        if (isExpired) return '🔓 READY TO CLAIM';

        // Format time remaining
        const days = Math.floor(timeRemaining / 86400);
        if (days > 0) return `⏳ ${days} DAYS REMAINING`;

        const hours = Math.floor(timeRemaining / 3600);
        if (hours > 0) return `⏳ ${hours} HOURS REMAINING`;

        return `⏳ ${Math.floor(timeRemaining / 60)} MINS REMAINING`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={canClaim ? { scale: 1.05 } : { scale: 1.02 }}
            whileTap={canClaim ? { scale: 0.95 } : {}}
            onClick={() => canClaim && onClaim(vault)}
            className={`relative group flex flex-col items-center justify-center p-6 rounded-3xl transition-all duration-500 ${canClaim
                ? 'cursor-pointer'
                : 'cursor-not-allowed opacity-80 grayscale-[0.3]'
                }`}
        >
            {/* Background Glow for Claimable */}
            {canClaim && (
                <div className="absolute inset-0 bg-primary-500/10 rounded-3xl blur-2xl group-hover:bg-primary-500/20 transition-all duration-500" />
            )}

            {/* The Safe Visual */}
            <div className="relative z-10 pointer-events-none">
                <VaultSafe3D
                    isUnlocking={false}
                    label={getStatusLabel()}
                />
            </div>

            {/* Notify Me Form for Pending Vaults (C.2) */}
            {!canClaim && (
                <div className="relative z-20 mt-4 w-full" onClick={(e) => e.stopPropagation()}>
                    <NotifyMeForm
                        vaultAddress={vault.publicKey?.toBase58() || ''}
                        releaseTimestamp={expiry}
                    />
                </div>
            )}

            {/* Hover Info Overlay (Optional) */}
            {!canClaim && (
                <div className="absolute inset-x-0 bottom-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-xs text-dark-400 font-mono bg-dark-900/80 inline-block px-3 py-1 rounded-full border border-dark-700">
                        Owner Active • Locked
                    </p>
                </div>
            )}
        </motion.div>
    );
}

