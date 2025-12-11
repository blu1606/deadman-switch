'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Simple particle types
const PARTICLES = ['❤️', '✨', '⚡', '💖', '🌟'];

interface KipParticlesProps {
    trigger: boolean;
}

export default function KipParticles({ trigger }: KipParticlesProps) {
    const [items, setItems] = useState<{ id: number; x: number; y: number; char: string }[]>([]);

    useEffect(() => {
        if (trigger) {
            // Generate burst
            const newParticles = Array.from({ length: 12 }).map((_, i) => ({
                id: Date.now() + i,
                x: (Math.random() - 0.5) * 100, // Random spread X
                y: (Math.random() - 1) * 100,   // Upward spread Y
                char: PARTICLES[Math.floor(Math.random() * PARTICLES.length)]
            }));
            setItems(newParticles);

            // Cleanup
            const timer = setTimeout(() => setItems([]), 2000);
            return () => clearTimeout(timer);
        }
    }, [trigger]);

    return (
        <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-visible">
            {items.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute text-xl select-none"
                    initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                    animate={{
                        scale: [0, 1.5, 0],
                        x: p.x,
                        y: p.y - 50, // Move up
                        opacity: [1, 1, 0],
                        rotate: Math.random() * 360
                    }}
                    transition={{
                        duration: 1 + Math.random(),
                        ease: "easeOut"
                    }}
                >
                    {p.char}
                </motion.div>
            ))}
        </div>
    );
}
