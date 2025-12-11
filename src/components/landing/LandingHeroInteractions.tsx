'use client';

import { motion } from 'framer-motion';
import { Shield, Sparkles, Lock } from 'lucide-react';
import Link from 'next/link';
import PaperMarioKip from '@/components/landing/PaperMarioKip';
import { useKipMood } from '@/context/KipMoodContext';
import TrustBadges from '@/components/landing/TrustBadges';

export default function LandingHeroInteractions() {
    const { mood, setMood } = useKipMood();

    const scrollToMechanism = () => {
        document.getElementById('mechanism')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className="relative min-h-[90vh] flex flex-col justify-center">
            {/* Visual Split Background */}
            <div className="absolute inset-0 grid lg:grid-cols-2 pointer-events-none">
                {/* Left: The Unknown (Darker) */}
                <div className="bg-gradient-to-br from-dark-950 to-dark-900 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/assets/grid.svg')] opacity-10" />
                </div>
                {/* Right: The Solution (Lighter/Safe) */}
                <div className="bg-gradient-to-bl from-dark-900 to-primary-950/30 relative overflow-hidden hidden lg:block">
                    <div className="absolute inset-0 bg-primary-500/5 blur-3xl rounded-full transform translate-x-1/2 translate-y-1/2" />
                </div>
            </div>

            <div className="container mx-auto px-4 relative z-10 pt-20">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">

                    {/* Left Column: The Problem/Hook */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-xl"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono mb-6 uppercase tracking-wider">
                            <span className="w-3 h-3 flex items-center justify-center">⚠️</span>
                            Reality Check
                        </div>

                        <h1 className="text-5xl sm:text-7xl font-bold mb-8 leading-tight tracking-tight text-white">
                            If you went offline today, <span className="text-dark-400">would your family know where to look?</span>
                        </h1>

                        <p className="text-xl text-dark-300 mb-10 leading-relaxed">
                            The automated safety deposit box for your digital life.
                            <span className="text-white font-medium"> Crypto, passwords, and final messages</span>
                            —delivered only when you can&apos;t.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-12">
                            <Link
                                href="/create"
                                onMouseEnter={() => setMood('excited')}
                                onMouseLeave={() => setMood('neutral')}
                                className="btn-primary text-lg px-8 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary-900/20 hover:shadow-primary-500/20 transition-all group"
                            >
                                <span>Secure My Legacy</span>
                                <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </Link>
                            <button
                                onClick={scrollToMechanism}
                                className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white font-medium text-lg flex items-center justify-center cursor-pointer"
                            >
                                How it Works
                            </button>
                        </div>

                        <TrustBadges />
                    </motion.div>

                    {/* Right Column: The Solution Visual */}
                    <div className="hidden lg:block relative h-[600px]">
                        {/* "Before" Card (Stacked behind) */}
                        <motion.div
                            className="absolute top-10 right-10 w-full max-w-md bg-dark-800/50 rounded-3xl border border-dark-700 p-8 blur-sm scale-95 opacity-50"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <div className="space-y-4">
                                <div className="h-4 w-1/3 bg-dark-700/50 rounded" />
                                <div className="h-4 w-3/4 bg-dark-700/50 rounded" />
                            </div>
                        </motion.div>

                        {/* "After" Card (Main Focus) */}
                        <motion.div
                            className="absolute top-20 right-20 w-full max-w-md bg-dark-800/90 backdrop-blur-xl rounded-3xl border border-primary-500/30 p-8 shadow-2xl shadow-primary-900/20 z-10"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold">Dad&apos;s Vault</h3>
                                        <p className="text-xs text-emerald-400 font-mono">ACCESS GRANTED</p>
                                    </div>
                                </div>
                                <div className="text-xs text-dark-400 font-mono">10:42 AM</div>
                            </div>

                            {/* Content */}
                            <div className="space-y-6">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-sm text-dark-300 font-mono mb-2">PRIVATE KEY</p>
                                    <p className="text-white font-mono break-all opacity-0 animate-pulse">
                                        ********************************
                                    </p>
                                    <div className="mt-2 text-emerald-400 text-xs flex items-center gap-2">
                                        <Lock className="w-3 h-3" />
                                        Decrypted successfully
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-gradient-to-r from-primary-900/20 to-transparent border border-primary-500/10">
                                    <p className="text-sm text-white italic">
                                        &quot;If you&apos;re reading this, I love you. Here is the access to the family portfolio...&quot;
                                    </p>
                                </div>

                                <Link href="/demo" className="block w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-center rounded-xl font-medium transition-colors">
                                    View Contents
                                </Link>
                            </div>
                        </motion.div>

                        {/* Kip Active Hero - Floating near the card */}
                        <motion.div
                            className="absolute -top-10 -right-4 z-20 pointer-events-none"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.8, type: "spring" }}
                        >
                            <PaperMarioKip mood={mood} className="scale-75 lg:scale-100" />
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
