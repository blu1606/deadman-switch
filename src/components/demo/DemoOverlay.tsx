import { ReactNode } from 'react';
import { useDemoVault } from '@/hooks/useDemoVault';
import Link from 'next/link';

export default function DemoOverlay({ children }: { children: ReactNode }) {
    const { step, actions } = useDemoVault();

    // Narrative text based on step
    const getNarrative = () => {
        switch (step) {
            case 1: return "🕵️ Agent 007 left a vault behind. It seems to have expired...";
            case 2: return "💰 You secured the funds! Now, create your own Deadman's Switch to protect them.";
            case 3: return "⏱️ The timer is running! Stay alive by checking in, or vanish to release the secrets.";
            default: return "Initializing simulation...";
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:50px_50px] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />

            {/* Header / Nav */}
            <div className="relative z-50 flex items-center justify-between p-6 border-b border-white/10 bg-black/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="bg-primary-500/20 text-primary-400 px-3 py-1 rounded-full text-xs font-bold tracking-widest border border-primary-500/30 animate-pulse">
                        SIMULATION MODE
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-dark-400 hidden md:block">
                        Step <span className="text-white font-bold">{step}</span>/3
                    </div>
                    <Link href="/" onClick={actions.resetDemo} className="text-xs text-dark-400 hover:text-white transition-colors uppercase tracking-wider">
                        Exit Demo
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl h-[calc(100vh-80px)] flex flex-col">
                {/* Narrator Box */}
                <div className="mb-8 flex items-start gap-4 bg-dark-900/80 border border-dark-700/50 p-4 rounded-xl max-w-2xl mx-auto shadow-2xl backdrop-blur-sm animate-slide-down">
                    <div className="text-3xl">🤖</div>
                    <div>
                        <div className="text-[10px] text-primary-400 uppercase tracking-widest font-bold mb-1">Guide</div>
                        <p className="text-dark-200 leading-relaxed text-sm md:text-base">
                            {getNarrative()}
                        </p>
                    </div>
                </div>

                {/* Dynamic Content */}
                <div className="flex-1 flex items-center justify-center">
                    {children}
                </div>
            </div>
        </div>
    );
}
