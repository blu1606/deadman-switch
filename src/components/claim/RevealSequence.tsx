'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import dynamic from 'next/dynamic';
const VaultSafe = dynamic(() => import('./VaultSafe3D'), { ssr: false });

interface RevealSequenceProps {
    isDecrypting: boolean;
    isDecrypted: boolean;
    finalMessage?: string;
    fileName?: string;
    children: React.ReactNode; // The actual content (media/text viewer)
    onContinue?: () => void;
}

type RevealState = 'locked' | 'unlocking' | 'message' | 'assets';

export default function RevealSequence({
    isDecrypting,
    isDecrypted,
    finalMessage,
    fileName,
    children,
    onContinue,
}: RevealSequenceProps) {
    const [revealState, setRevealState] = useState<RevealState>('locked');
    const [showContinue, setShowContinue] = useState(false);

    // State transitions
    useEffect(() => {
        if (isDecrypting && revealState === 'locked') {
            setRevealState('unlocking');
        }
    }, [isDecrypting, revealState]);

    useEffect(() => {
        if (isDecrypted && revealState === 'unlocking') {
            // Delay before showing message
            const timer = setTimeout(() => {
                if (finalMessage) {
                    setRevealState('message');
                } else {
                    setRevealState('assets');
                }
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isDecrypted, revealState, finalMessage]);

    // Custom typewriter effect removed in favor of react-type-animation component

    const handleContinue = () => {
        setRevealState('assets');
        onContinue?.();
    };

    const skipToAssets = () => {
        setShowContinue(true);
    };

    return (
        <div className="relative min-h-[400px] flex flex-col items-center justify-center p-6">
            <AnimatePresence mode="wait">
                {/* LOCKED STATE */}
                {revealState === 'locked' && (
                    <motion.div
                        key="locked"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{ willChange: "transform, opacity" }}
                        className="text-center"
                    >
                        <VaultSafe isUnlocking={false} />
                        <p className="mt-4 text-dark-400 text-sm">
                            Enter credentials to unlock this legacy
                        </p>
                    </motion.div>
                )}

                {/* UNLOCKING STATE */}
                {revealState === 'unlocking' && (
                    <motion.div
                        key="unlocking"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center"
                    >
                        <VaultSafe isUnlocking={revealState === 'unlocking'} />
                        <motion.p
                            className="mt-4 text-primary-400 text-sm font-mono"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        >
                            {isDecrypted ? 'ACCESS GRANTED' : 'DECRYPTING VAULT...'}
                        </motion.p>
                    </motion.div>
                )}

                {/* MESSAGE STATE */}
                {revealState === 'message' && (
                    <motion.div
                        key="message"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="max-w-2xl w-full text-center"
                    >
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mb-8"
                        >
                            <div className="text-4xl mb-4">💌</div>
                            <h2 className="text-xl font-light text-dark-300 italic">
                                A final message awaits you...
                            </h2>
                        </motion.div>

                        {/* Message Box */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-dark-900/80 backdrop-blur-md border border-dark-600 rounded-2xl p-8 mb-6 min-h-[150px] cursor-pointer text-left"
                            onClick={skipToAssets}
                        >
                            <TypeAnimation
                                sequence={[
                                    finalMessage || '',
                                    () => setShowContinue(true),
                                ]}
                                wrapper="div"
                                cursor={true}
                                speed={60}
                                style={{ fontSize: '1.125rem', color: 'white', fontWeight: 300, lineHeight: 1.625, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
                            />
                        </motion.div>

                        {/* Continue Button */}
                        <AnimatePresence>
                            {showContinue && (
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    onClick={handleContinue}
                                    className="btn-primary px-8 py-3"
                                >
                                    View Inheritance →
                                </motion.button>
                            )}
                        </AnimatePresence>

                        <p className="text-xs text-dark-500 mt-4">
                            Click anywhere to skip
                        </p>
                    </motion.div>
                )}

                {/* ASSETS STATE */}
                {revealState === 'assets' && (
                    <motion.div
                        key="assets"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full"
                    >
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-6"
                        >
                            <div className="inline-flex items-center gap-2 bg-safe-green/10 text-safe-green px-4 py-2 rounded-full text-sm mb-4">
                                <span className="w-2 h-2 rounded-full bg-safe-green animate-pulse" />
                                VAULT UNLOCKED
                            </div>
                            {fileName && (
                                <h2 className="text-xl font-bold text-white">
                                    🔓 {fileName}
                                </h2>
                            )}
                        </motion.div>

                        {/* Content from parent */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            {children}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
