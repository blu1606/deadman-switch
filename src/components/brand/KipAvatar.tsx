'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getKipPalette, getKipState } from '@/utils/kip';

import LifeForceRing from '@/components/kip/LifeForceRing';
import KipParticles from '@/components/kip/KipParticles';

interface KipAvatarProps {
    seed: string;
    health: number; // 0-100
    isReleased?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    isCharging?: boolean; // For hold button interaction
    showGlow?: boolean;
    isCelebrating?: boolean;
    className?: string;
}

const SIZE_MAP = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
};

export default function KipAvatar({
    seed,
    health,
    isReleased = false,
    size = 'md',
    isCharging = false,
    showGlow = true,
    isCelebrating = false,
    className = '',
}: KipAvatarProps) {
    const palette = useMemo(() => getKipPalette(seed), [seed]);
    const state = getKipState(health, isReleased);

    // Expressions
    const expressions = {
        healthy: '◠‿◠', // Happy
        hungry: '• ᴥ •',  // Neutral/Hungry
        critical: '> ﹏ <', // Scared/Critical
        ghost: '✧ ‿ ✧',   // Ascended
    };

    // Dynamic Styles based on State override
    // If Critical/Hungry, we might shift the visual slightly irrespective of palette?
    // Spec says: "Critical: Amber (#F59E0B)". "Hungry: Lime (#84CC16)".
    // But also "Unique Kip System". 
    // We will blend the Unique Palette with the Status Color.

    const getGradient = () => {
        if (state === 'ghost') return 'linear-gradient(135deg, #94A3B8, #F8FAFC)'; // Starlight
        if (state === 'critical') return 'linear-gradient(135deg, #EF4444, #F59E0B)'; // Red -> Amber
        // Ideally we keep the palette but maybe desaturate or tint?
        // Let's stick to the spec strictly: "State | Color".
        // If we strictly follow state colors, we lose the uniqueness. 
        // Let's assume Unique Palette applies to Healthy, and Hungry/Critical override for safety.
        if (state === 'hungry') return 'linear-gradient(135deg, #84CC16, #EAB308)'; // Lime -> Yellow

        return `linear-gradient(135deg, ${palette.colors[0]}, ${palette.colors[1]})`;
    };

    const getShadow = () => {
        if (state === 'ghost') return '0 0 30px rgba(248, 250, 252, 0.5)';
        if (state === 'critical') return '0 0 30px rgba(239, 68, 68, 0.6)';
        if (state === 'hungry') return '0 0 20px rgba(132, 204, 22, 0.5)';
        return `0 0 20px ${palette.shadow}`;
    };

    // Animation Variants
    const bodyVariants = {
        idle: {
            y: [0, -8, 0],
            scale: [1, 1.02, 1],
            transition: {
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut' as const
            }
        },
        charging: {
            scale: [1, 0.9, 0.85],
            rotate: [0, -5, 5, 0], // Shake slightly
            transition: {
                duration: 0.5,
                repeat: Infinity,
                repeatType: 'reverse' as const
            }
        },
        critical: {
            x: [-2, 2, -2],
            scale: [1, 0.95, 1],
            transition: {
                duration: 0.2, // Rapid shake
                repeat: Infinity,
            }
        },
        ghost: {
            y: [0, -15, 0],
            opacity: [0.6, 0.8, 0.6],
            filter: ['blur(0px)', 'blur(2px)', 'blur(0px)'],
            transition: {
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut' as const
            }
        }
    };

    const currentAnim = isCharging
        ? 'charging'
        : state === 'critical'
            ? 'critical'
            : state === 'ghost'
                ? 'ghost'
                : isCelebrating
                    ? 'idle' // Or a jump?
                    : 'idle';

    return (
        <div className={`relative flex items-center justify-center ${SIZE_MAP[size]} ${className}`}>
            {/* Glow Layer */}
            {showGlow && (
                <motion.div
                    className="absolute inset-0 rounded-full blur-xl"
                    style={{ background: getShadow().replace(/[\d.]+\)$/, '0.4)') }} // Softer blur
                    animate={{
                        scale: state === 'critical' ? [1, 1.2, 1] : [1, 1.1, 1],
                        opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                        duration: state === 'critical' ? 0.5 : 3,
                        repeat: Infinity,
                    }}
                />
            )}

            {/* Health Ring */}
            {!isReleased && (
                <LifeForceRing
                    health={health}
                    className="absolute inset-[-8px] w-[calc(100%+16px)] h-[calc(100%+16px)]"
                    strokeWidth={3}
                />
            )}

            {/* Main Body */}
            <motion.div
                className="relative w-full h-full rounded-full flex items-center justify-center z-10"
                style={{
                    background: getGradient(),
                    boxShadow: showGlow ? getShadow() : 'none',
                    // Inner bevel/lighting
                }}
                variants={bodyVariants}
                animate={currentAnim}
            >
                {/* Inner Highlight (Glassy look) */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
                <div className="absolute top-[15%] left-[15%] w-[20%] h-[20%] bg-white/40 blur-[2px] rounded-full pointer-events-none" />

                {/* Face Container */}
                <motion.div
                    className="relative text-white font-bold select-none tracking-widest text-center"
                    style={{
                        fontSize: size === 'sm' ? '12px' : size === 'md' ? '16px' : '24px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                >

                    {isCelebrating ? '^ ω ^' : expressions[state]}
                </motion.div>

                {/* Celebration Particles */}
                <KipParticles trigger={isCelebrating} />

                {/* Charging Particles (Suck In Effect) - Simplified */}
                {isCharging && (
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-1 h-1 bg-white rounded-full"
                                initial={{ opacity: 0, scale: 0, x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 }}
                                animate={{
                                    opacity: [0, 1, 0],
                                    scale: [1, 0.5],
                                    x: 0,
                                    y: 0
                                }}
                                transition={{
                                    duration: 0.5,
                                    repeat: Infinity,
                                    delay: i * 0.1,
                                    ease: 'easeIn'
                                }}
                            />
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
