'use client';

import { motion } from 'framer-motion';

interface StreakCounterProps {
    count: number;
    className?: string;
}

export default function StreakCounter({ count, className = '' }: StreakCounterProps) {
    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="text-xl"
            >
                🔥
            </motion.div>
            <div className="font-mono font-bold text-orange-500 flex flex-col leading-none">
                <span className="text-sm">{count}</span>
                <span className="text-[10px] uppercase opacity-70">Day Streak</span>
            </div>
        </div>
    );
}
