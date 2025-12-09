'use client';

import { motion } from 'framer-motion';

export default function KipEmpty() {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 opacity-60 hover:opacity-100 transition-opacity duration-500">
            {/* Sketch Style Kip */}
            <motion.div
                className="relative w-24 h-24 mb-6"
                animate={{
                    y: [0, -5, 0],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                {/* Dashed Border Circle */}
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="6 4"
                        className="text-dark-400"
                    />
                    {/* Face Eyes */}
                    <circle cx="35" cy="45" r="3" className="fill-dark-400" />
                    <circle cx="65" cy="45" r="3" className="fill-dark-400" />
                    {/* Face Mouth (Straight/Neutral) */}
                    <path d="M40 60 Q50 60 60 60" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-dark-400" />
                </svg>
            </motion.div>

            <h3 className="text-lg font-bold text-dark-300 font-mono mb-2">
                I'm a spirit without a home.
            </h3>
            <p className="text-sm text-dark-500 max-w-xs leading-relaxed">
                Create a vault to give me life. I will guard your legacy until the stars fade.
            </p>
        </div>
    );
}
