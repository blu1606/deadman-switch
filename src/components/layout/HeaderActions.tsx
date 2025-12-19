'use client';

import { useUnifiedWallet as useUnifiedHook } from '@/hooks/useUnifiedWallet';
import dynamic from 'next/dynamic';

const WalletButton = dynamic(() => import('@/components/wallet/WalletButton'), { ssr: false });

export default function HeaderActions() {
    const { connected } = useUnifiedHook();

    return (
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
    );
}
