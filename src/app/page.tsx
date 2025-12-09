'use client';

import Link from 'next/link';
import WalletButton from '@/components/wallet/WalletButton';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { Activity, Lock, ScrollText, Sparkles } from 'lucide-react';
import ProblemSection from '@/components/landing/ProblemSection';
import UseCaseGrid from '@/components/landing/UseCaseGrid';
import FAQSection from '@/components/landing/FAQSection';
import WhatIfSimulator from '@/components/landing/WhatIfSimulator';
import TrustBadges from '@/components/landing/TrustBadges';

export default function Home() {
    const { connected } = useWallet();

    return (
        <main className="min-h-screen relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-500/5 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary-500/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
            </div>

            <section className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-12 gap-8 items-start">

                    {/* LEFT COLUMN: Narrative & Actions (5 cols) */}
                    <div className="lg:col-span-5 flex flex-col justify-center h-full pt-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <h1 className="text-5xl sm:text-7xl font-bold mb-8 leading-tight tracking-tight">
                                <span className="block text-white">Digital</span>
                                <span className="block bg-gradient-to-r from-primary-200 via-primary-400 to-secondary-200 bg-clip-text text-transparent">
                                    Immortality.
                                </span>
                            </h1>

                            <p className="text-xl text-dark-300 mb-10 leading-relaxed max-w-lg">
                                Your digital soul, preserved on-chain. The final act of love for those you leave behind.
                                Secure, decentralized, and eternal.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-12">
                                {connected ? (
                                    <>
                                        <Link href="/create" className="btn-primary text-lg px-8 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary-900/20 hover:shadow-primary-500/20 transition-all">
                                            <span>Create Vault</span>
                                            <Sparkles className="w-5 h-5" />
                                        </Link>
                                        <Link href="/dashboard" className="px-8 py-4 rounded-2xl bg-dark-800/40 border border-white/5 hover:bg-dark-800/60 transition-all text-white font-medium text-lg flex items-center justify-center">
                                            My Sanctuaries
                                        </Link>
                                    </>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <WalletButton />
                                            <Link
                                                href="/demo"
                                                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary-500/30 transition-all text-white font-medium flex items-center justify-center gap-2"
                                            >
                                                <span>▶️ Try Demo</span>
                                                <span className="text-xs text-dark-400 font-normal">(No Wallet Needed)</span>
                                            </Link>
                                        </div>
                                        <p className="text-dark-500 text-sm ml-2 italic">
                                            Connect to begin your legacy
                                        </p>
                                    </div>
                                )}
                            </div>

                            <TrustBadges />

                        </motion.div>
                    </div>

                    {/* RIGHT COLUMN: Bento Grid Visuals (7 cols) */}
                    <div className="lg:col-span-7 grid grid-cols-2 gap-4 h-full min-h-[500px]">

                        {/* Cell 1: The Pulse (Large, Top Left) */}
                        <motion.div
                            className="glass-panel p-8 rounded-3xl col-span-2 sm:col-span-1 relative overflow-hidden group"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                        >
                            <div className="absolute top-4 right-4 text-xs font-mono text-primary-400/80 border border-primary-500/20 px-2 py-1 rounded-full flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                                </span>
                                SYSTEM_ACTIVE
                            </div>
                            <div className="h-full flex flex-col justify-end relative z-10">
                                <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mb-6 backdrop-blur-md group-hover:scale-110 transition-transform duration-500 border border-primary-500/20">
                                    <Activity className="w-8 h-8 text-primary-400 animate-pulse-slow" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">The Heartbeat</h3>
                                <p className="text-dark-300 text-sm leading-relaxed">
                                    A simple "I'm here" resets the timer. If the silence grows too long, the protocol awakens.
                                </p>
                            </div>
                            {/* Abstract pulse visual */}
                            <div className="absolute right-[-20%] top-[-20%] w-[80%] h-[80%] border-[20px] border-primary-500/5 rounded-full" />
                            <div className="absolute right-[-10%] top-[-10%] w-[60%] h-[60%] border-[20px] border-primary-500/10 rounded-full" />
                        </motion.div>

                        {/* Cell 2: Encryption (Tall, Top Right) */}
                        <motion.div
                            className="glass-panel p-8 rounded-3xl col-span-2 sm:row-span-2 sm:col-span-1 flex flex-col justify-between relative overflow-hidden group"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark-900/50" />

                            <div className="relative z-10">
                                <div className="mb-8 p-4 bg-dark-900/50 rounded-2xl border border-white/5 font-mono text-xs text-primary-300/70 overflow-hidden leading-relaxed opacity-60">
                                    0x7F...3A2B<br />
                                    ENCRYPTED_PAYLOAD<br />
                                    kty: "RSA",<br />
                                    alg: "OAEP-256",<br />
                                    ext: true,<br />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Zero Knowledge</h3>
                                <p className="text-dark-300 text-sm leading-relaxed">
                                    Your secrets are encrypted client-side. We never see them. Only your chosen recipient holds the key to unlock the silence.
                                </p>
                            </div>

                            <div className="absolute bottom-[-10%] right-[-10%] opacity-[0.03] rotate-[-15deg] pointer-events-none select-none">
                                <Lock className="w-48 h-48" />
                            </div>
                        </motion.div>

                        {/* Cell 3: Legacy (Wide, Bottom Left) */}
                        <motion.div
                            className="glass-panel p-8 rounded-3xl col-span-2 sm:col-span-1 relative overflow-hidden group bg-gradient-to-r from-dark-800/40 to-primary-900/10"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6, duration: 0.6 }}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary-400/30 transition-colors">
                                    <ScrollText className="w-6 h-6 text-primary-200" />
                                </div>
                                <h3 className="text-xl font-bold text-white">The Reveal</h3>
                            </div>
                            <p className="text-dark-300 text-sm">
                                When the timer hits zero, the vault opens. A final message, a crypto transfer, or a cherished memory.
                            </p>
                        </motion.div>

                    </div>
                </div>
            </section>

            {/* NEW SECTIONS for Phase 8.1 */}
            <ProblemSection />

            <WhatIfSimulator />

            <UseCaseGrid />

            {/* Stats */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="card bg-gradient-to-r from-primary-900/30 to-dark-800/60 border-primary-700/30">
                        <div className="grid grid-cols-3 gap-8 text-center">
                            <div>
                                <p className="text-3xl font-bold text-primary-400">100%</p>
                                <p className="text-dark-400 text-sm">On-Chain</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-primary-400">E2E</p>
                                <p className="text-dark-400 text-sm">Encrypted</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-primary-400">Devnet</p>
                                <p className="text-dark-400 text-sm">Status</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <FAQSection />

            {/* Footer Minimal */}
            <footer className="py-8 text-center border-t border-white/5 bg-dark-900">
                <p className="text-dark-600 text-xs font-mono uppercase tracking-widest opacity-60">
                    Protocol v0.6 • Deadman's Switch • Solana
                </p>
            </footer>
        </main>
    );
}
