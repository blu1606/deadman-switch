'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
const WalletButton = dynamic(() => import('@/components/wallet/WalletButton'), { ssr: false });
import { useWallet } from '@solana/wallet-adapter-react';
import { MenuBar, NavKey } from '@/components/ui/animated-menu-bar';

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { connected } = useWallet();

    // Map pathname to nav key
    const getActiveKey = (): NavKey => {
        if (pathname === '/') return 'home';
        if (pathname.startsWith('/dashboard')) return 'dashboard';
        if (pathname.startsWith('/create')) return 'create';
        if (pathname.startsWith('/claim')) return 'claim';
        if (pathname.startsWith('/archive')) return 'archive';
        return 'home'; // default
    };

    const handleNavSelect = (key: NavKey) => {
        switch (key) {
            case 'home': router.push('/'); break;
            case 'dashboard': router.push('/dashboard'); break;
            case 'create': router.push('/create'); break;
            case 'claim': router.push('/claim'); break;
            case 'archive': router.push('/archive'); break;
            default: router.push('/');
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 pt-4 px-4 md:px-8 pointer-events-none">
            <div className="max-w-7xl mx-auto flex items-start justify-between pointer-events-auto">

                {/* 1. Logo Section (Left) */}
                <div className="flex-shrink-0 pt-2">
                    <Link href="/" className="flex items-center gap-3 group backdrop-blur-md bg-dark-900/50 p-2 pr-4 rounded-xl border border-white/5 hover:border-primary-500/30 transition-all">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-lg shadow-lg shadow-primary-500/20">
                            💀
                        </div>
                        <span className="font-bold text-sm tracking-tight text-white group-hover:text-primary-200 transition-colors hidden sm:block">
                            Deadman&apos;s Switch
                        </span>
                    </Link>
                </div>

                {/* 2. Navigation Section (Center) - Animated Menu Bar */}
                <div className="flex-grow flex justify-center -ml-12 md:ml-0">
                    <MenuBar
                        active={getActiveKey()}
                        onSelect={handleNavSelect}
                    />
                </div>

                {/* 3. Wallet Section (Right) */}
                <div className="flex-shrink-0 pt-1 flex items-center gap-3">
                    {connected && (
                        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Connected
                        </div>
                    )}
                    <div className="pointer-events-auto">
                        <WalletButton />
                    </div>
                </div>
            </div>
        </header>
    );
}
