'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const useCases = [
    {
        title: "Lock",
        subtitle: "Step 1: Secure",
        image: "/assets/glass-lock.png",
        desc: "Not just for tokens. Secure your Ledger seed phrases, 1Password master keys, and heartfelt final letters in an on-chain vault.",
        color: "from-blue-500/20 to-cyan-500/20",
        glow: "shadow-blue-500/20"
    },
    {
        title: "Live",
        subtitle: "Step 2: Automate",
        image: "/assets/glass-eye.png",
        desc: "We monitor for silence. Reply to our monthly email or check-in on-chain to confirm you're alive. Zero maintenance otherwise.",
        color: "from-amber-500/20 to-orange-500/20",
        glow: "shadow-amber-500/20"
    },
    {
        title: "Legacy",
        subtitle: "Step 3: Deliver",
        image: "/assets/glass-key.png",
        desc: "When the time comes, we automatically decrypt and deliver your assets to your beneficiaries. No lawyers needed.",
        color: "from-emerald-500/20 to-green-500/20",
        glow: "shadow-emerald-500/20"
    }
];

export default function UseCaseGrid() {
    return (
        <section className="py-24 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">The 3-Step Process</h2>
                    <p className="text-dark-400">Lock. Live. Legacy. Your digital safety net, simplified.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {useCases.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="glass-panel p-8 rounded-3xl relative overflow-hidden group hover:border-white/20 transition-all duration-300 flex flex-col items-center text-center"
                        >
                            {/* Gradient Background */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />

                            <div className="relative z-10 w-full flex flex-col items-center">
                                <div className="relative w-32 h-32 mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                                    <Image
                                        src={item.image}
                                        alt={item.title}
                                        fill
                                        className="object-contain"
                                    />
                                </div>

                                <div className="text-xs font-mono text-primary-400 uppercase tracking-widest mb-2">
                                    {item.subtitle}
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                                <p className="text-dark-300 leading-relaxed text-sm">
                                    {item.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
