
import dynamic from 'next/dynamic';
import { KipMoodProvider } from '@/context/KipMoodContext';
import LandingHeroInteractions from '@/components/landing/LandingHeroInteractions';
import StoryIsland from '@/components/landing/StoryIsland';
import ProblemSectionWrapper from '@/components/landing/ProblemSectionWrapper';

// --- Dynamic Imports for below-the-fold content ---
// Loading these lazily reduces the initial JS bundle size significantly
const ProblemSection = dynamic(() => import('@/components/landing/ProblemSection'));
const UseCaseGrid = dynamic(() => import('@/components/landing/UseCaseGrid'));
const FAQSection = dynamic(() => import('@/components/landing/FAQSection'));
const WhatIfSimulator = dynamic(() => import('@/components/landing/WhatIfSimulator'));
const PricingSection = dynamic(() => import('@/components/landing/PricingSection'));
const EmergencySwitch = dynamic(() => import('@/components/landing/EmergencySwitch'));

// TrustBadges is small but contains interactivity/logos, could be dynamic or static. 
// It's inside LandingHeroInteractions now, so we don't import it here directly.

export default function Home() {
    return (
        <main className="min-h-screen relative overflow-hidden">

            {/* Ambient Background - Static CSS/Divs are fine in RSC */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-500/5 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary-500/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
            </div>

            {/* Storyteller Island - Client Component (assumed, or simple enough to stay) */}
            <StoryIsland />

            <KipMoodProvider>
                {/* Hero Section - now encapsulated for interactivity */}
                <LandingHeroInteractions />

                {/* Problem Section with Interaction Wrapper */}
                <ProblemSectionWrapper>
                    <ProblemSection />
                </ProblemSectionWrapper>

                {/* Mechanism Section */}
                <div id="mechanism">
                    <EmergencySwitch />
                </div>

                {/* Simulator */}
                <WhatIfSimulator />

                {/* Use Cases */}
                <UseCaseGrid />

                {/* Stats - Static Content, can remain here or move to component */}
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
            </KipMoodProvider>

            {/* Footer Minimal */}
            <footer className="py-8 text-center border-t border-white/5 bg-dark-900">
                <p className="text-dark-600 text-xs font-mono uppercase tracking-widest opacity-60">
                    Protocol v0.6 • Deadman&apos;s Switch • Solana
                </p>
            </footer>
        </main>
    );
}
