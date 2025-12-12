'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Shield, Check, Loader2, AlertTriangle } from 'lucide-react';

interface KeyRecoveryDemoProps {
    onRecovered?: (key: string) => void;
}

export default function KeyRecoveryDemo({ onRecovered }: KeyRecoveryDemoProps) {
    const [shard1, setShard1] = useState('');
    const [shard2, setShard2] = useState('');
    const [isRecovering, setIsRecovering] = useState(false);
    const [recoveredKey, setRecoveredKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRecover = async () => {
        if (!shard1 || !shard2) {
            setError('Please enter both shards');
            return;
        }

        setIsRecovering(true);
        setError(null);

        try {
            // Simulate processing
            await new Promise(r => setTimeout(r, 1500));

            // Dynamic import to avoid SSR issues
            const secrets = (await import('secrets.js-grempe')).default;

            // Combine shards using Shamir's Secret Sharing
            const combinedHex = secrets.combine([shard1, shard2]);

            // Convert hex back to string (browser-compatible, no Buffer needed)
            const bytes = new Uint8Array(combinedHex.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || []);
            const textDecoder = new TextDecoder();
            const recoveredKeyStr = textDecoder.decode(bytes);

            setRecoveredKey(recoveredKeyStr);
            onRecovered?.(recoveredKeyStr);
        } catch (err) {
            console.error('Recovery failed:', err);
            setError('Failed to reconstruct key. Please check your shards.');
        } finally {
            setIsRecovering(false);
        }
    };

    return (
        <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                    <Key className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Key Recovery</h3>
                    <p className="text-sm text-dark-400">Reconstruct your key from shards</p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!recoveredKey ? (
                    <motion.div
                        key="input"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        {/* Info */}
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-dark-300">
                                    Enter any 2 of your 3 shards to reconstruct the master key.
                                </p>
                            </div>
                        </div>

                        {/* Shard Inputs */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-dark-400 mb-2 uppercase tracking-wider">
                                    Shard 1
                                </label>
                                <input
                                    type="text"
                                    value={shard1}
                                    onChange={(e) => setShard1(e.target.value)}
                                    placeholder="Enter first shard..."
                                    className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-dark-400 mb-2 uppercase tracking-wider">
                                    Shard 2
                                </label>
                                <input
                                    type="text"
                                    value={shard2}
                                    onChange={(e) => setShard2(e.target.value)}
                                    placeholder="Enter second shard..."
                                    className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-red-400 text-sm"
                            >
                                <AlertTriangle className="w-4 h-4" />
                                {error}
                            </motion.div>
                        )}

                        {/* Action */}
                        <button
                            onClick={handleRecover}
                            disabled={isRecovering || !shard1 || !shard2}
                            className="w-full btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isRecovering ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Reconstructing...
                                </>
                            ) : (
                                <>
                                    <Key className="w-5 h-5" />
                                    Recover Key
                                </>
                            )}
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-6"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                            className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30"
                        >
                            <Check className="w-10 h-10 text-green-400" />
                        </motion.div>
                        <h4 className="text-xl font-bold text-white mb-2">Key Reconstructed!</h4>
                        <p className="text-dark-400 text-sm mb-4">
                            Your master key has been successfully recovered.
                        </p>
                        <div className="bg-dark-900 rounded-xl p-4 border border-dark-700">
                            <p className="text-xs text-dark-500 mb-1 font-mono">RECOVERED KEY</p>
                            <p className="text-green-400 font-mono text-sm break-all">
                                {recoveredKey.slice(0, 32)}...
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
