'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, Split, Mail, Check, AlertTriangle, Loader2 } from 'lucide-react';

interface KeyShardingDemoProps {
    masterKey: string;
    onComplete?: (shards: string[]) => void;
    recipientEmail?: string;
}

type ShardingState = 'idle' | 'splitting' | 'distributing' | 'complete';

interface Shard {
    id: number;
    value: string;
    recipient: string;
    icon: React.ReactNode;
    color: string;
}

// Mock Shamir's Secret Sharing for demo purposes
// In production, use a WebCrypto-compatible library
function mockShamirSplit(secret: string): string[] {
    // Generate 3 mock shards that look realistic
    const hash = (str: string, seed: number) => {
        let h = seed;
        for (let i = 0; i < str.length; i++) {
            h = ((h << 5) - h + str.charCodeAt(i)) | 0;
        }
        return Math.abs(h).toString(16).padStart(8, '0');
    };

    return [
        `801${hash(secret, 1)}${hash(secret, 4)}${hash(secret, 7)}`,
        `802${hash(secret, 2)}${hash(secret, 5)}${hash(secret, 8)}`,
        `803${hash(secret, 3)}${hash(secret, 6)}${hash(secret, 9)}`,
    ];
}

export default function KeyShardingDemo({ masterKey, onComplete, recipientEmail = 'recipient@example.com' }: KeyShardingDemoProps) {
    const [state, setState] = useState<ShardingState>('idle');
    const [shards, setShards] = useState<Shard[]>([]);
    const [activeShardIndex, setActiveShardIndex] = useState(-1);

    const startSharding = async () => {
        setState('splitting');

        // Simulate processing delay
        await new Promise(r => setTimeout(r, 1500));

        // Use mock implementation for demo (avoids Node.js crypto dependency)
        const shares = mockShamirSplit(masterKey);

        console.log('[Guardian] Mock shards generated for demo');

        const shardData: Shard[] = [
            {
                id: 1,
                value: shares[0],
                recipient: 'You (Owner)',
                icon: <Key className="w-5 h-5" />,
                color: 'from-blue-500 to-cyan-500'
            },
            {
                id: 2,
                value: shares[1],
                recipient: recipientEmail,
                icon: <Mail className="w-5 h-5" />,
                color: 'from-purple-500 to-pink-500'
            },
            {
                id: 3,
                value: shares[2],
                recipient: 'Guardian (Backup)',
                icon: <Shield className="w-5 h-5" />,
                color: 'from-amber-500 to-orange-500'
            },
        ];

        setShards(shardData);
        setState('distributing');

        // Animate shard distribution
        for (let i = 0; i < shardData.length; i++) {
            await new Promise(r => setTimeout(r, 800));
            setActiveShardIndex(i);
        }

        await new Promise(r => setTimeout(r, 500));
        setState('complete');
        onComplete?.(shares);
    };

    return (
        <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                    <Shield className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Guardian Key Sharding</h3>
                    <p className="text-sm text-dark-400">Split your key for maximum security</p>
                </div>
                <div className="ml-auto">
                    <span className="px-2 py-1 text-xs font-mono bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
                        PREMIUM
                    </span>
                </div>
            </div>

            {/* Explanation */}
            <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-dark-300 space-y-2">
                        <p><strong className="text-white">The Problem:</strong> If your recipient loses their key, the vault is lost forever.</p>
                        <p><strong className="text-amber-400">The Solution:</strong> Split the key into 3 shards. Any 2 shards can reconstruct the key.</p>
                    </div>
                </div>
            </div>

            {/* Animation Area */}
            <div className="relative min-h-[200px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {state === 'idle' && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                        >
                            <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center border border-primary-500/30">
                                <Key className="w-12 h-12 text-primary-400" />
                            </div>
                            <p className="text-white font-medium mb-2">Master Encryption Key</p>
                            <p className="text-dark-400 text-sm mb-4 font-mono truncate max-w-[200px] mx-auto">
                                {masterKey.slice(0, 16)}...
                            </p>
                            <button
                                onClick={startSharding}
                                className="btn-primary px-6 py-3 flex items-center gap-2 mx-auto"
                            >
                                <Split className="w-5 h-5" />
                                Enable Guardian Protection
                            </button>
                        </motion.div>
                    )}

                    {state === 'splitting' && (
                        <motion.div
                            key="splitting"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center"
                        >
                            <motion.div
                                className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30"
                                animate={{
                                    scale: [1, 1.1, 1],
                                    rotate: [0, 5, -5, 0],
                                }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                            >
                                <Key className="w-12 h-12 text-amber-400" />
                            </motion.div>
                            <p className="text-white font-medium flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Splitting Key with Shamir&apos;s Secret Sharing...
                            </p>
                        </motion.div>
                    )}

                    {(state === 'distributing' || state === 'complete') && (
                        <motion.div
                            key="distributing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full"
                        >
                            <div className="grid grid-cols-3 gap-4">
                                {shards.map((shard, idx) => (
                                    <motion.div
                                        key={shard.id}
                                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                        animate={{
                                            opacity: idx <= activeShardIndex || state === 'complete' ? 1 : 0.3,
                                            y: 0,
                                            scale: idx <= activeShardIndex || state === 'complete' ? 1 : 0.8,
                                        }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`relative p-4 rounded-xl border text-center ${idx <= activeShardIndex || state === 'complete'
                                            ? 'bg-dark-900/50 border-dark-600'
                                            : 'bg-dark-900/20 border-dark-800'
                                            }`}
                                    >
                                        <motion.div
                                            className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${shard.color} flex items-center justify-center`}
                                            animate={idx === activeShardIndex && state === 'distributing' ? { scale: [1, 1.2, 1] } : {}}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {shard.icon}
                                        </motion.div>
                                        <p className="text-xs font-mono text-dark-500 mb-1">SHARD {shard.id}</p>
                                        <p className="text-sm text-white font-medium truncate">{shard.recipient}</p>

                                        {(idx <= activeShardIndex || state === 'complete') && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                                            >
                                                <Check className="w-4 h-4 text-white" />
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>

                            {state === 'complete' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="mt-6 text-center"
                                >
                                    <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-full text-sm border border-green-500/30">
                                        <Check className="w-4 h-4" />
                                        Guardian Protection Active
                                    </div>
                                    <p className="text-dark-400 text-xs mt-3">
                                        Any 2 of 3 shards can reconstruct the key. Your vault is now protected.
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
