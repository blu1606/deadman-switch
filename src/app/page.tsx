
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, Sparkles, Shield, AlertTriangle } from 'lucide-react';
import ProblemSection from '@/components/landing/ProblemSection';
import UseCaseGrid from '@/components/landing/UseCaseGrid';
import FAQSection from '@/components/landing/FAQSection';
import WhatIfSimulator from '@/components/landing/WhatIfSimulator';
import TrustBadges from '@/components/landing/TrustBadges';
import PricingSection from '@/components/landing/PricingSection';
import EmergencySwitch from '@/components/landing/EmergencySwitch';

export default function Home() {

    return (
        <main className="min-h-screen relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-500/5 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary-500/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
            </div>


            {/* Split Screen Hero */}
            <section className="relative min-h-[90vh] flex flex-col justify-center">
                {/* Visual Split Background */}
                <div className="absolute inset-0 grid lg:grid-cols-2">
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
                                <AlertTriangle className="w-3 h-3" />
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
                                <Link href="/create" className="btn-primary text-lg px-8 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary-900/20 hover:shadow-primary-500/20 transition-all group">
                                    <span>Secure My Legacy</span>
                                    <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </Link>
                                <button
                                    onClick={() => document.getElementById('mechanism')?.scrollIntoView({ behavior: 'smooth' })}
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
                                className="absolute top-20 right-20 w-full max-w-md bg-dark-800/90 backdrop-blur-xl rounded-3xl border border-primary-500/30 p-8 shadow-2xl shadow-primary-900/20"
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
                        </div>
                    </div>
                </div>
            </section>



            {/* NEW SECTIONS for Phase 8.1 */}
            <ProblemSection />

            <div id="mechanism">
                <EmergencySwitch />
            </div>

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

            <PricingSection />

            <FAQSection />

            {/* Footer Minimal */}
            <footer className="py-8 text-center border-t border-white/5 bg-dark-900">
                <p className="text-dark-600 text-xs font-mono uppercase tracking-widest opacity-60">
                    Protocol v0.6 • Deadman&apos;s Switch • Solana
                </p>
            </footer>
        </main>
    );
}
