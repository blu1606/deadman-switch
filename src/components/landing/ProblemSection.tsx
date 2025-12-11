'use client';

import { motion } from 'framer-motion';
import { CloudOff, Lock, Clock, AlertOctagon } from 'lucide-react';


export default function ProblemSection() {

    return (
        <section className="py-32 px-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 bg-dark-900/50" />

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="grid md:grid-cols-2 gap-16 items-center">

                    {/* Visual: The Locked Vault */}
                    <div className="relative h-[400px] rounded-3xl overflow-hidden glass-panel flex flex-col items-center justify-center p-8 group">

                        {/* The Icon Visual */}
                        <div className="relative mb-8">
                            <motion.div
                                animate={{ opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            >
                                <CloudOff className="w-40 h-40 text-dark-700" strokeWidth={1} />
                            </motion.div>

                            <motion.div
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-dark-900 rounded-full p-4 border border-red-500/30 shadow-2xl shadow-red-900/20"
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                            >
                                <Lock className="w-12 h-12 text-red-500" />
                            </motion.div>
                        </div>

                        {/* The Status Text */}
                        <div className="text-center space-y-2 z-10">
                            <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                                <AlertOctagon className="w-5 h-5 text-red-500" />
                                ACCESS DENIED
                            </h3>
                            <p className="text-dark-400 font-mono text-sm">
                                Private keys lost forever.
                            </p>

                            {/* The Counter */}
                            <div className="mt-6 inline-block bg-dark-800/50 rounded-lg px-4 py-2 border border-dark-700/50">
                                <div className="flex items-center gap-2 text-red-400/80 text-xs font-mono uppercase tracking-widest mb-1">
                                    <Clock className="w-3 h-3" />
                                    Time Inactive
                                </div>
                                <div className="text-xl font-mono text-white/80 tabular-nums">
                                    12<span className="text-dark-500">Y</span> : 04<span className="text-dark-500">M</span> : 18<span className="text-dark-500">D</span>
                                </div>
                            </div>
                        </div>

                        {/* Background Noise/Grid */}
                        <div className="absolute inset-0 bg-[url('/assets/grid.svg')] opacity-5 pointer-events-none" />
                    </div>

                    {/* Copy: The Pain Point */}
                    <div>
                        <motion.h2
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
                        >
                            The Google Inactive Account Manager <span className="text-red-400">for your entire digital life.</span>
                        </motion.h2>

                        <p className="text-xl text-dark-300 mb-8 leading-relaxed">
                            Web2 has safety nets. Web3 didn&apos;t—until now.
                            <br />
                            <span className="text-white/80 text-base mt-2 block">
                                When you stop checking in, we ensure your crypto, passwords, and final messages reach the people who matter most.
                            </span>
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mt-1 text-red-400 shrink-0">✕</div>
                                <div>
                                    <p className="text-white font-medium">Your family can&apos;t access your wallet.</p>
                                    <p className="text-sm text-dark-400">Ledgers and phrases are useless if they can&apos;t find them.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mt-1 text-red-400 shrink-0">✕</div>
                                <div>
                                    <p className="text-white font-medium">Cloud drives are encrypted.</p>
                                    <p className="text-sm text-dark-400">Apple/Google won&apos;t unlock them without a court order.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mt-1 text-red-400 shrink-0">✕</div>
                                <div>
                                    <p className="text-white font-medium">Final words left unsaid.</p>
                                    <p className="text-sm text-dark-400">Important messages or instructions that never get delivered.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
