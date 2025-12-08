'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

type SpiritState = 'happy' | 'neutral' | 'sick' | 'ghost';

interface KeeperSpiritProps {
    /** Health status from vault */
    healthStatus: 'healthy' | 'warning' | 'critical';
    /** Is the vault released/expired */
    isReleased?: boolean;
    /** Streak count (days of consecutive check-ins) */
    streak?: number;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Show streak counter */
    showStreak?: boolean;
    className?: string;
}

export default function KeeperSpirit({
    healthStatus,
    isReleased = false,
    streak = 0,
    size = 'md',
    showStreak = true,
    className = '',
}: KeeperSpiritProps) {
    // Determine spirit state based on health
    const spiritState: SpiritState = useMemo(() => {
        if (isReleased) return 'ghost';
        switch (healthStatus) {
            case 'healthy': return 'happy';
            case 'warning': return 'neutral';
            case 'critical': return 'sick';
            default: return 'neutral';
        }
    }, [healthStatus, isReleased]);

    // Size classes
    const sizeClasses = {
        sm: 'w-16 h-16',
        md: 'w-24 h-24',
        lg: 'w-32 h-32',
    };

    // State-specific styles
    const stateConfig = {
        happy: {
            coreColor: 'from-safe-green via-emerald-400 to-teal-300',
            glowColor: 'rgba(74, 222, 128, 0.6)',
            eyeColor: '#065f46',
            particleColor: '#4ade80',
            expression: '◠‿◠',
        },
        neutral: {
            coreColor: 'from-amber-400 via-yellow-500 to-orange-400',
            glowColor: 'rgba(251, 191, 36, 0.5)',
            eyeColor: '#92400e',
            particleColor: '#fbbf24',
            expression: '• ᴥ •',
        },
        sick: {
            coreColor: 'from-red-400 via-rose-500 to-pink-400',
            glowColor: 'rgba(248, 113, 113, 0.4)',
            eyeColor: '#991b1b',
            particleColor: '#f87171',
            expression: '╥﹏╥',
        },
        ghost: {
            coreColor: 'from-dark-400 via-dark-500 to-dark-600',
            glowColor: 'rgba(115, 115, 115, 0.3)',
            eyeColor: '#525252',
            particleColor: '#737373',
            expression: '✧ ‿ ✧',
        },
    };

    const config = stateConfig[spiritState];

    return (
        <div className={`relative flex flex-col items-center ${className}`}>
            {/* Main Spirit Container */}
            <div className={`relative ${sizeClasses[size]}`}>
                {/* Glow Effect */}
                <motion.div
                    className="absolute inset-0 rounded-full blur-xl"
                    style={{ background: config.glowColor }}
                    animate={{
                        scale: spiritState === 'happy' ? [1, 1.3, 1] : spiritState === 'sick' ? [1, 0.9, 1] : [1, 1.1, 1],
                        opacity: spiritState === 'ghost' ? [0.3, 0.1, 0.3] : [0.6, 0.8, 0.6],
                    }}
                    transition={{
                        duration: spiritState === 'sick' ? 0.8 : 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />

                {/* Spirit Core */}
                <motion.div
                    className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.coreColor} shadow-lg`}
                    animate={{
                        scale: spiritState === 'sick' ? [1, 0.95, 1] : [1, 1.02, 1],
                        rotate: spiritState === 'ghost' ? [0, 5, -5, 0] : 0,
                    }}
                    transition={{
                        duration: spiritState === 'sick' ? 0.5 : 3,
                        repeat: Infinity,
                        ease: spiritState === 'sick' ? 'easeInOut' : 'linear',
                    }}
                    style={{
                        filter: spiritState === 'ghost' ? 'grayscale(100%) brightness(0.7)' : 'none',
                    }}
                >
                    {/* Inner Shine */}
                    <div className="absolute inset-[15%] rounded-full bg-white/30 blur-sm" />

                    {/* Face Expression */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center text-xl font-bold select-none"
                        style={{ color: config.eyeColor }}
                        animate={{
                            y: spiritState === 'happy' ? [0, -3, 0] : spiritState === 'sick' ? [0, 2, 0] : 0,
                        }}
                        transition={{
                            duration: spiritState === 'happy' ? 0.8 : 1.2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    >
                        <span className={size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}>
                            {config.expression}
                        </span>
                    </motion.div>
                </motion.div>

                {/* Floating Particles (Happy state only) */}
                {spiritState === 'happy' && (
                    <>
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-1.5 h-1.5 rounded-full"
                                style={{
                                    background: config.particleColor,
                                    left: '50%',
                                    top: '50%',
                                }}
                                animate={{
                                    x: [0, Math.cos(i * 60 * Math.PI / 180) * 40, 0],
                                    y: [0, Math.sin(i * 60 * Math.PI / 180) * 40 - 20, 0],
                                    opacity: [0, 1, 0],
                                    scale: [0, 1, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    delay: i * 0.3,
                                    repeat: Infinity,
                                    ease: 'easeOut',
                                }}
                            />
                        ))}
                    </>
                )}

                {/* Wobble effect for Sick state */}
                {spiritState === 'sick' && (
                    <motion.div
                        className="absolute inset-0 rounded-full border-2 border-red-400/30"
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                        }}
                    />
                )}

                {/* Ethereal trail for Ghost state */}
                {spiritState === 'ghost' && (
                    <motion.div
                        className="absolute inset-x-[20%] -bottom-4 h-8 bg-gradient-to-b from-dark-500/50 to-transparent rounded-full blur-sm"
                        animate={{
                            opacity: [0.3, 0.6, 0.3],
                            scaleY: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                        }}
                    />
                )}
            </div>

            {/* Streak Counter */}
            {showStreak && streak > 0 && !isReleased && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-center gap-1 bg-dark-700/80 px-2 py-1 rounded-full"
                >
                    <span className="text-amber-400">🔥</span>
                    <span className="text-xs font-mono text-white">{streak}</span>
                    <span className="text-[10px] text-dark-400 uppercase">days</span>
                </motion.div>
            )}

            {/* Spirit Label */}
            <motion.div
                className="mt-2 text-center"
                animate={{
                    opacity: spiritState === 'ghost' ? [0.5, 0.3, 0.5] : 1,
                }}
                transition={{
                    duration: 2,
                    repeat: spiritState === 'ghost' ? Infinity : 0,
                }}
            >
                <span className={`text-[10px] font-mono uppercase tracking-wider ${spiritState === 'happy' ? 'text-safe-green' :
                        spiritState === 'neutral' ? 'text-amber-400' :
                            spiritState === 'sick' ? 'text-red-400' :
                                'text-dark-500'
                    }`}>
                    {spiritState === 'happy' && 'THRIVING'}
                    {spiritState === 'neutral' && 'WAITING'}
                    {spiritState === 'sick' && 'FADING'}
                    {spiritState === 'ghost' && 'RELEASED'}
                </span>
            </motion.div>
        </div>
    );
}
