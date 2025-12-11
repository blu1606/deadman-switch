'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface LifeForceRingProps {
    health: number; // 0-100
    className?: string;
    strokeWidth?: number;
}

export default function LifeForceRing({
    health,
    className = '',
    strokeWidth = 3
}: LifeForceRingProps) {

    const { color, state } = useMemo(() => {
        if (health < 20) return { color: '#EF4444', state: 'critical' };
        if (health < 50) return { color: '#EAB308', state: 'warning' };
        return { color: '#10B981', state: 'healthy' };
    }, [health]);

    const isCritical = state === 'critical';

    return (
        <svg
            className={`pointer-events-none overflow-visible -rotate-90 ${className}`}
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
        >
            {/* Background Track */}
            <circle
                className="text-white/10"
                strokeWidth={strokeWidth}
                stroke="currentColor"
                fill="transparent"
                r="46"
                cx="50"
                cy="50"
            />

            {/* Active Life-Force Indicator */}
            <motion.circle
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                fill="transparent"
                r="46"
                cx="50"
                cy="50"
                initial={{ pathLength: 0 }}
                animate={{
                    pathLength: health / 100,
                    stroke: color,
                    // Pulse opacity if critical
                    opacity: isCritical ? [1, 0.5, 1] : 1,
                    // Subtle glow effect
                    filter: `drop-shadow(0 0 ${isCritical ? '4px' : '2px'} ${color})`
                }}
                transition={{
                    pathLength: { duration: 1.5, ease: "easeOut" },
                    stroke: { duration: 0.5 },
                    opacity: isCritical ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : {},
                    filter: { duration: 0.5 }
                }}
            />
        </svg>
    );
}
