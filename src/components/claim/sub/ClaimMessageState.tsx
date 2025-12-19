'use client';

import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    decryptedText: string;
    onContinue: () => void;
}

export const ClaimMessageState: FC<Props> = ({ decryptedText, onContinue }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [showContinue, setShowContinue] = useState(false);

    useEffect(() => {
        let index = 0;
        setDisplayedText('');
        const interval = setInterval(() => {
            if (index < decryptedText.length && index < 500) {
                setDisplayedText(prev => prev + decryptedText[index]);
                index++;
            } else {
                clearInterval(interval);
                setTimeout(() => setShowContinue(true), 500);
            }
        }, 20);
        return () => clearInterval(interval);
    }, [decryptedText]);

    const skipTypewriter = () => {
        setDisplayedText(decryptedText.slice(0, 500));
        setShowContinue(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
        >
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="text-4xl mb-3">💌</div>
                <h3 className="text-lg font-light text-dark-300 italic">
                    A message awaits you...
                </h3>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-dark-900/80 backdrop-blur-md border border-dark-600 rounded-2xl p-6 mb-6 min-h-[150px] max-h-[250px] overflow-auto cursor-pointer text-left"
                onClick={skipTypewriter}
            >
                <p className="text-white font-light leading-relaxed whitespace-pre-wrap">
                    {displayedText}
                    {!showContinue && (
                        <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity }}
                            className="inline-block w-0.5 h-5 bg-primary-400 ml-1 align-middle"
                        />
                    )}
                </p>
            </motion.div>

            <AnimatePresence>
                {showContinue && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                    >
                        <button onClick={onContinue} className="btn-primary px-8 py-3">
                            View Full Content →
                        </button>
                        <p className="text-xs text-dark-500">
                            Click message to skip animation
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
