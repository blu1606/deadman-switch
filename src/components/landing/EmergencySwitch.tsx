'use client';

import { motion } from 'framer-motion';

export default function EmergencySwitch() {
    const steps = [
        {
            id: 1,
            icon: '📦',
            title: 'Load the Safe',
            desc: 'Deposit crypto, passwords, and final messages.',
            color: 'from-blue-500 to-indigo-500'
        },
        {
            id: 2,
            icon: '⏱️',
            title: 'Set Timer',
            desc: '"If I don\'t check in for 30 days..."',
            color: 'from-purple-500 to-pink-500'
        },
        {
            id: 3,
            icon: '💓',
            title: 'Heartbeat',
            desc: 'We verify you\'re alive via email/wallet check-ins.',
            color: 'from-emerald-500 to-teal-500'
        },
        {
            id: 4,
            icon: '🔓',
            title: 'Auto-Release',
            desc: 'If silence detected, assets are sent to beneficiaries.',
            color: 'from-orange-500 to-red-500'
        }
    ];

    return (
        <section className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-200">
                            The Digital Fire Alarm
                        </span>
                    </h2>
                    <p className="text-xl text-dark-300">
                        A passive safety system that runs in the background of your life.
                        <br />
                        <span className="text-white font-medium">Zero maintenance until it matters.</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden lg:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/20 via-emerald-500/20 to-red-500/20 -z-10" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="relative group"
                        >
                            <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 hover:border-dark-600 p-6 rounded-2xl h-full transition-all duration-300 hover:-translate-y-1">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-2xl mb-4 shadow-lg`}>
                                    {step.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                                <p className="text-dark-400 leading-relaxed">
                                    {step.desc}
                                </p>

                                <div className="absolute top-6 right-6 text-6xl font-bold text-white/5 pointer-events-none">
                                    {step.id}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-900/10 rounded-full blur-[120px] -z-10" />
        </section>
    );
}
