'use client';

import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

interface VaultSafe3DProps {
    isUnlocking?: boolean;
    onUnlockComplete?: () => void;
}

export default function VaultSafe3D({ isUnlocking = false, onUnlockComplete }: VaultSafe3DProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Mouse position tracking for parallax
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth spring physics for rotation
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { stiffness: 100, damping: 20 });
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { stiffness: 100, damping: 20 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
        setIsHovered(false);
    };

    // Trigger callback after unlock animation completes
    useEffect(() => {
        if (isUnlocking) {
            const timer = setTimeout(() => {
                onUnlockComplete?.();
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [isUnlocking, onUnlockComplete]);

    return (
        <div
            ref={containerRef}
            className="relative w-72 h-72 mx-auto perspective-1000"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            style={{ perspective: '1000px' }}
        >
            {/* Ambient glow effect */}
            <motion.div
                className="absolute inset-0 rounded-3xl"
                animate={{
                    boxShadow: isUnlocking
                        ? ['0 0 60px rgba(16, 185, 129, 0.8)', '0 0 120px rgba(16, 185, 129, 1)', '0 0 200px rgba(16, 185, 129, 0.5)']
                        : isHovered
                            ? '0 0 80px rgba(99, 102, 241, 0.6)'
                            : ['0 0 40px rgba(99, 102, 241, 0.3)', '0 0 60px rgba(99, 102, 241, 0.5)', '0 0 40px rgba(99, 102, 241, 0.3)'],
                }}
                transition={{
                    duration: isUnlocking ? 2 : 2.5,
                    repeat: isUnlocking ? 0 : Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* Main safe body */}
            <motion.div
                className="relative w-full h-full rounded-2xl border-2 overflow-hidden"
                style={{
                    rotateX: isUnlocking ? 0 : rotateX,
                    rotateY: isUnlocking ? 0 : rotateY,
                    transformStyle: 'preserve-3d',
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)',
                    borderColor: isUnlocking ? 'rgba(16, 185, 129, 0.8)' : 'rgba(99, 102, 241, 0.5)',
                }}
                animate={isUnlocking ? {
                    scale: [1, 1.05, 0],
                    opacity: [1, 1, 0],
                    rotateY: [0, 360],
                } : {}}
                transition={{ duration: 2.5, ease: 'easeInOut' }}
            >
                {/* Safe door panels */}
                <div className="absolute inset-4 rounded-xl border border-dark-600/50 bg-dark-900/50">
                    {/* Decorative rivets */}
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-3 h-3 rounded-full bg-dark-600/70 border border-dark-500/50"
                            style={{
                                top: i < 4 ? '8px' : 'auto',
                                bottom: i >= 4 ? '8px' : 'auto',
                                left: (i % 4) === 0 || (i % 4) === 2 ? `${8 + (i % 2) * 200}px` : 'auto',
                                right: (i % 4) === 1 || (i % 4) === 3 ? `${8 + (i % 2) * 0}px` : 'auto',
                            }}
                            animate={{ opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                        />
                    ))}

                    {/* Central lock mechanism */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            className="relative w-32 h-32 rounded-full border-4 flex items-center justify-center"
                            style={{
                                borderColor: isUnlocking ? 'rgba(16, 185, 129, 0.8)' : 'rgba(99, 102, 241, 0.6)',
                                background: 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)',
                            }}
                            animate={isUnlocking ? {
                                rotate: [0, 720],
                                scale: [1, 1.2, 0],
                            } : {
                                rotate: [0, 5, 0, -5, 0],
                            }}
                            transition={isUnlocking ? { duration: 2 } : { duration: 4, repeat: Infinity }}
                        >
                            {/* Lock icon */}
                            <motion.div
                                className="text-5xl"
                                animate={isUnlocking ? { scale: [1, 1.5, 0], opacity: [1, 1, 0] } : {}}
                            >
                                {isUnlocking ? '🔓' : '🔒'}
                            </motion.div>

                            {/* Inner rings */}
                            {[...Array(3)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute rounded-full border"
                                    style={{
                                        width: `${60 + i * 20}%`,
                                        height: `${60 + i * 20}%`,
                                        borderColor: 'rgba(99, 102, 241, 0.2)',
                                    }}
                                    animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                                    transition={{
                                        duration: 20 + i * 5,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                            ))}
                        </motion.div>
                    </div>
                </div>

                {/* Holographic scan line effect */}
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'linear-gradient(180deg, transparent 0%, rgba(99, 102, 241, 0.1) 50%, transparent 100%)',
                        backgroundSize: '100% 20px',
                    }}
                    animate={{ y: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
            </motion.div>

            {/* Particles effect during unlock */}
            {isUnlocking && (
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full bg-emerald-400"
                            style={{
                                left: '50%',
                                top: '50%',
                            }}
                            initial={{ x: 0, y: 0, opacity: 1 }}
                            animate={{
                                x: (Math.random() - 0.5) * 400,
                                y: (Math.random() - 0.5) * 400,
                                opacity: 0,
                                scale: [1, 2, 0],
                            }}
                            transition={{
                                duration: 2,
                                delay: 0.5 + i * 0.05,
                                ease: 'easeOut',
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Status text */}
            <motion.p
                className="absolute -bottom-8 left-0 right-0 text-center text-sm font-medium"
                style={{ color: isUnlocking ? '#10b981' : '#6366f1' }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                {isUnlocking ? '🔓 Unlocking Vault...' : '🔒 Vault Sealed'}
            </motion.p>
        </div>
    );
}
