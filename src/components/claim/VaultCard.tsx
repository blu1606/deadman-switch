'use client';

import { motion } from 'framer-motion';

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
    const percentageRemaining = Math.max(0, Math.min(100, (timeRemaining / interval) * 100));

    const status = isReleased
        ? { label: 'RELEASED', color: 'text-red-400', bg: 'bg-red-500/20', glow: 'shadow-red-500/20' }
        : isExpired
            ? { label: 'UNLOCKABLE', color: 'text-primary-400', bg: 'bg-primary-500/20', glow: 'shadow-primary-500/30' }
            : { label: 'LOCKED', color: 'text-dark-400', bg: 'bg-dark-600/50', glow: '' };

    const canClaim = isReleased || isExpired;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={canClaim ? { scale: 1.02, y: -5 } : {}}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-dark-700/80 to-dark-800/90 backdrop-blur-xl border transition-all duration-300 ${canClaim ? 'border-primary-500/50 hover:border-primary-400' : 'border-dark-600'
                }`}
        >
            {/* Animated Glow for Unlockable */}
            {canClaim && !isReleased && (
                <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-secondary-500/10"
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            )}

            <div className="relative p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        {/* Mini Safe Icon */}
                        <motion.div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${canClaim ? 'bg-primary-500/20' : 'bg-dark-600/50'
                                }`}
                            animate={canClaim ? {
                                boxShadow: ['0 0 0 rgba(139, 92, 246, 0)', '0 0 20px rgba(139, 92, 246, 0.3)', '0 0 0 rgba(139, 92, 246, 0)'],
                            } : {}}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <motion.span
                                className="text-2xl"
                                animate={canClaim ? { rotate: [0, -10, 10, 0] } : {}}
                                transition={{ duration: 0.5, delay: 1, repeat: Infinity, repeatDelay: 3 }}
                            >
                                {isReleased ? '📭' : canClaim ? '🔓' : '🔐'}
                            </motion.span>
                        </motion.div>
                        <div>
                            <h3 className="font-semibold text-lg text-white">Legacy Vault</h3>
                            <p className="text-dark-400 text-xs font-mono">
                                From: {vault.owner.toBase58().slice(0, 8)}...
                            </p>
                        </div>
                    </div>
                    <motion.span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${status.color} ${status.bg}`}
                        animate={canClaim && !isReleased ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        {status.label}
                    </motion.span>
                </div>

                {/* Progress Ring (for locked vaults) */}
                {!isReleased && !isExpired && (
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-dark-400 uppercase tracking-wider">Time Until Release</span>
                            <span className="text-xs text-dark-400">{Math.round(percentageRemaining)}% remaining</span>
                        </div>
                        <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-dark-500 to-dark-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${percentageRemaining}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                            />
                        </div>
                    </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-dark-800/50 rounded-xl p-3 border border-dark-700/50">
                        <div className="text-[10px] text-dark-500 uppercase tracking-wider mb-1">
                            Time Remaining
                        </div>
                        <div className={`font-mono text-sm ${isExpired ? 'text-primary-400' : 'text-white'}`}>
                            {isExpired ? 'Ready to claim' : `${Math.floor(timeRemaining / 86400)}d ${Math.floor((timeRemaining % 86400) / 3600)}h`}
                        </div>
                    </div>
                    <div className="bg-dark-800/50 rounded-xl p-3 border border-dark-700/50">
                        <div className="text-[10px] text-dark-500 uppercase tracking-wider mb-1">
                            Last Check-in
                        </div>
                        <div className="text-sm text-white">
                            {new Date(lastCheckIn * 1000).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <motion.button
                    onClick={() => onClaim(vault)}
                    disabled={!canClaim}
                    whileHover={canClaim ? { scale: 1.02 } : {}}
                    whileTap={canClaim ? { scale: 0.98 } : {}}
                    className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${canClaim
                            ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50'
                            : 'bg-dark-700 text-dark-500 cursor-not-allowed'
                        }`}
                >
                    {canClaim ? (
                        <>
                            <motion.span
                                animate={{ rotate: [0, -20, 20, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                            >
                                🔓
                            </motion.span>
                            Decrypt & Reveal
                        </>
                    ) : (
                        <>
                            🔒 Locked - Owner Active
                        </>
                    )}
                </motion.button>
            </div>
        </motion.div>
    );
}
