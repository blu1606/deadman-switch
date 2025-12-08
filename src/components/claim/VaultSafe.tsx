'use client';

import { motion } from 'framer-motion';

interface VaultSafeProps {
    state: 'locked' | 'unlocking' | 'open';
    className?: string;
}

export default function VaultSafe({ state, className = '' }: VaultSafeProps) {
    const isLocked = state === 'locked';
    const isUnlocking = state === 'unlocking';
    const isOpen = state === 'open';

    return (
        <div className={`relative ${className}`}>
            {/* Main Safe Container */}
            <motion.div
                className="relative w-48 h-48 md:w-64 md:h-64 mx-auto"
                style={{ perspective: '1000px' }}
                animate={{
                    scale: isUnlocking ? [1, 1.05, 0.95, 1] : 1,
                    rotateY: isOpen ? 15 : 0,
                }}
                transition={{
                    duration: isUnlocking ? 1.5 : 0.5,
                    ease: 'easeInOut',
                }}
            >
                {/* Safe Body */}
                <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-dark-600 via-dark-700 to-dark-800 border-4 border-dark-500 shadow-2xl overflow-hidden"
                    style={{
                        transformStyle: 'preserve-3d',
                        boxShadow: isLocked
                            ? '0 20px 60px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.1)'
                            : isUnlocking
                                ? '0 20px 80px rgba(139, 92, 246, 0.3), 0 0 60px rgba(139, 92, 246, 0.2)'
                                : '0 10px 40px rgba(0,0,0,0.3)',
                    }}
                    animate={{
                        borderColor: isUnlocking ? ['#525252', '#8b5cf6', '#525252'] : '#525252',
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: isUnlocking ? Infinity : 0,
                    }}
                >
                    {/* Metallic Texture Lines */}
                    <div className="absolute inset-0 opacity-10">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-full h-px bg-gradient-to-r from-transparent via-white to-transparent"
                                style={{ top: `${(i + 1) * 12}%` }}
                            />
                        ))}
                    </div>

                    {/* Safe Door Details */}
                    <div className="absolute inset-4 rounded-xl border-2 border-dark-500/50 bg-dark-700/50">
                        {/* Handle */}
                        <motion.div
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                            animate={{
                                rotate: isUnlocking ? [0, -90, -180, -270, -360] : isOpen ? -90 : 0,
                            }}
                            transition={{
                                duration: isUnlocking ? 2 : 0.8,
                                ease: 'easeInOut',
                            }}
                        >
                            {/* Dial Base */}
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-dark-500 to-dark-700 border-4 border-dark-400 shadow-lg flex items-center justify-center">
                                {/* Dial Center */}
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-dark-600 to-dark-800 border-2 border-dark-500 flex items-center justify-center">
                                    {/* Lock Icon */}
                                    <motion.div
                                        animate={{
                                            opacity: isOpen ? 0 : 1,
                                            scale: isOpen ? 0.5 : 1,
                                        }}
                                    >
                                        <svg
                                            className="w-6 h-6 md:w-8 md:h-8 text-dark-400"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M12 1C8.676 1 6 3.676 6 7v2H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V11a2 2 0 00-2-2h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4zm0 10a2 2 0 110 4 2 2 0 010-4z" />
                                        </svg>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Handle Bar */}
                            <div className="absolute top-1/2 right-0 w-8 md:w-10 h-3 bg-gradient-to-r from-dark-400 to-dark-500 rounded-r-full transform -translate-y-1/2 translate-x-full shadow-md" />
                        </motion.div>

                        {/* Bolt Details */}
                        {[
                            'top-3 left-3',
                            'top-3 right-3',
                            'bottom-3 left-3',
                            'bottom-3 right-3',
                        ].map((pos, i) => (
                            <div
                                key={i}
                                className={`absolute ${pos} w-3 h-3 rounded-full bg-dark-500 border border-dark-400`}
                            />
                        ))}
                    </div>

                    {/* Breathing Glow Effect */}
                    {isLocked && (
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-t from-primary-500/10 to-transparent"
                            animate={{
                                opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                    )}

                    {/* Unlock Particles */}
                    {isUnlocking && (
                        <>
                            {Array.from({ length: 12 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-2 h-2 rounded-full bg-primary-400"
                                    style={{
                                        left: '50%',
                                        top: '50%',
                                    }}
                                    animate={{
                                        x: [0, (Math.random() - 0.5) * 200],
                                        y: [0, (Math.random() - 0.5) * 200],
                                        opacity: [1, 0],
                                        scale: [1, 0],
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        delay: i * 0.1,
                                        repeat: Infinity,
                                    }}
                                />
                            ))}
                        </>
                    )}
                </motion.div>

                {/* Open State - Door Swinging */}
                {isOpen && (
                    <motion.div
                        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-dark-600 via-dark-700 to-dark-800 border-4 border-dark-500"
                        style={{
                            transformOrigin: 'left center',
                            backfaceVisibility: 'hidden',
                        }}
                        initial={{ rotateY: 0 }}
                        animate={{ rotateY: -120 }}
                        transition={{
                            duration: 1.2,
                            ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                    />
                )}

                {/* Inner Glow (Revealed) */}
                {isOpen && (
                    <motion.div
                        className="absolute inset-8 rounded-lg bg-gradient-to-br from-primary-500/30 to-secondary-500/20 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                    >
                        <motion.div
                            className="text-4xl"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.8, type: 'spring' }}
                        >
                            ✨
                        </motion.div>
                    </motion.div>
                )}
            </motion.div>

            {/* Label */}
            <motion.div
                className="text-center mt-6"
                animate={{
                    opacity: isUnlocking ? [1, 0.5, 1] : 1,
                }}
                transition={{
                    duration: 1,
                    repeat: isUnlocking ? Infinity : 0,
                }}
            >
                <span className="text-xs font-mono uppercase tracking-widest text-dark-400">
                    {isLocked && 'LEGACY VAULT • SEALED'}
                    {isUnlocking && 'DECRYPTING...'}
                    {isOpen && 'VAULT OPENED'}
                </span>
            </motion.div>
        </div>
    );
}
