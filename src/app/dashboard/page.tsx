'use client';

import { useUnifiedWallet as useWallet } from '@/hooks/useUnifiedWallet';
import WalletButton from '@/components/wallet/WalletButton';
import VaultList from './VaultList';

export default function DashboardPage() {
    const { connected } = useWallet();

    if (!connected) {
        return (
            <main className="min-h-screen flex items-center justify-center pt-16">
                <div className="card text-center max-w-md">
                    <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
                    <p className="text-dark-400 mb-6">Connect your wallet to view your vaults.</p>
                    <WalletButton />
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen pt-24 pb-10 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 tracking-tight text-white">COMMAND CENTER</h1>
                        <div className="flex items-center gap-2 text-dark-400">
                            <div className="w-2 h-2 rounded-full bg-safe-green" />
                            <p className="font-mono text-sm uppercase">System Online</p>
                        </div>
                    </div>
                    <a href="/create" className="btn-secondary text-xs uppercase tracking-wider items-center flex gap-2">
                        <span>+ New Protocol</span>
                    </a>
                </div>

                <VaultList />
            </div>
        </main>
    );
}
