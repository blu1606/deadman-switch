'use client';

import { useState } from 'react';
import { useOwnerVaults, VaultData } from '@/hooks/useVault';
import WalletButton from '@/components/wallet/WalletButton';
import EditVaultModal from '@/components/dashboard/EditVaultModal';
import DelegateModal from '@/components/dashboard/DelegateModal';
import { useWallet } from '@solana/wallet-adapter-react';
import AliveIndicator from '@/components/dashboard/AliveIndicator';
import VaultHealthShield from '@/components/dashboard/VaultHealthShield';
import HoldCheckInButton from '@/components/dashboard/HoldCheckInButton';
import KeeperSpirit from '@/components/dashboard/KeeperSpirit';

export default function DashboardPage() {
    const { connected } = useWallet();
    const { vaults, loading, error, ping, refetch, getStatus } = useOwnerVaults();

    const [pingingVault, setPingingVault] = useState<string | null>(null);
    const [pingError, setPingError] = useState<string | null>(null);
    const [pingSuccess, setPingSuccess] = useState<string | null>(null);
    const [editingVault, setEditingVault] = useState<VaultData | null>(null);
    const [delegatingVault, setDelegatingVault] = useState<VaultData | null>(null);

    const handlePing = async (vault: VaultData) => {
        setPingingVault(vault.publicKey.toBase58());
        setPingError(null);
        setPingSuccess(null);

        try {
            await ping(vault);
            setPingSuccess(vault.publicKey.toBase58());
            setTimeout(() => setPingSuccess(null), 3000);
        } catch (err: any) {
            setPingError(err.message || 'Failed to check in');
        } finally {
            setPingingVault(null);
        }
    };

    const formatTimeRemaining = (seconds: number): string => {
        if (seconds <= 0) return 'Expired';
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m`;
        return `${seconds}s`;
    };

    const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

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
                            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-safe-green' : 'bg-red-500'}`} />
                            <p className="font-mono text-sm uppercase">{connected ? 'System Online' : 'System Offline'}</p>
                        </div>
                    </div>
                    {vaults.length > 0 && (
                        <a href="/create" className="btn-secondary text-xs uppercase tracking-wider items-center flex gap-2">
                            <span>+ New Protocol</span>
                        </a>
                    )}
                </div>

                {loading ? (
                    <div className="card text-center py-20 animate-pulse">
                        <div className="text-2xl font-mono text-dark-500">INITIALIZING...</div>
                    </div>
                ) : error ? (
                    <div className="card border-red-500/30 bg-red-500/5 text-center py-12">
                        <p className="text-red-400 mb-4">{error}</p>
                        <button onClick={() => refetch()} className="btn-secondary">RETRY CONNECTION</button>
                    </div>
                ) : vaults.length > 0 ? (
                    <div className="grid gap-8">
                        {vaults.map((vault) => {
                            const status = getStatus(vault);
                            const key = vault.publicKey.toBase58();
                            const isPinging = pingingVault === key;
                            const isSuccess = pingSuccess === key;

                            return (
                                <div key={key} className={`card group relative overflow-hidden transition-all duration-300 hover:border-dark-500 ${isSuccess ? 'border-safe-green/50 shadow-safe-green/20' : ''}`}>
                                    {/* Background Decor */}
                                    {status.healthStatus === 'critical' && !vault.isReleased && (
                                        <div className="absolute inset-0 bg-red-500/5 animate-pulse-critical z-0 pointer-events-none" />
                                    )}

                                    <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">

                                        {/* Left: Visual Indicators */}
                                        <div className="flex flex-col items-center gap-4 min-w-[120px]">
                                            {/* Keeper Spirit (Tamagotchi) */}
                                            <KeeperSpirit
                                                healthStatus={status.healthStatus}
                                                isReleased={vault.isReleased}
                                                size="md"
                                                showStreak={false} // TODO: Enable when ping tracking is implemented
                                            />
                                        </div>

                                        {/* Center: Info */}
                                        <div className="flex-1 w-full text-center md:text-left">
                                            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                                                <h3 className="text-xl font-bold font-mono tracking-tight text-white">
                                                    VAULT-{key.slice(0, 4)}
                                                </h3>
                                                <span className="bg-dark-800 text-dark-400 text-[10px] px-2 py-0.5 rounded font-mono">
                                                    {truncateAddress(key)}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="bg-dark-900/50 p-3 rounded-lg border border-dark-700/50">
                                                    <div className="text-[10px] text-dark-500 uppercase tracking-wider mb-1">Time Remaining</div>
                                                    <div className={`font-mono text-lg ${status.isExpired ? 'text-red-500' : 'text-white'}`}>
                                                        {formatTimeRemaining(status.timeRemaining)}
                                                    </div>
                                                </div>
                                                <div className="bg-dark-900/50 p-3 rounded-lg border border-dark-700/50">
                                                    <div className="text-[10px] text-dark-500 uppercase tracking-wider mb-1">Check-in Interval</div>
                                                    <div className="font-mono text-lg text-white">
                                                        {Math.floor(vault.timeInterval.toNumber() / 86400)}d
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Area */}
                                            {!vault.isReleased && (
                                                <div className="flex flex-col md:flex-row gap-3">
                                                    <div className="flex-1">
                                                        <HoldCheckInButton
                                                            onComplete={() => handlePing(vault)}
                                                            disabled={isPinging || isSuccess}
                                                            label={isSuccess ? "CHECK-IN COMPLETE" : undefined}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => setDelegatingVault(vault)}
                                                        className="px-4 py-3 rounded-xl border border-dark-600 hover:bg-dark-700 text-dark-400 transition-colors"
                                                        title="Manage Delegate"
                                                    >
                                                        👤
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingVault(vault)}
                                                        className="px-4 py-3 rounded-xl border border-dark-600 hover:bg-dark-700 text-dark-400 transition-colors"
                                                        title="Edit Vault Settings"
                                                    >
                                                        ⚙️
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {isSuccess && (
                                        <div className="absolute inset-x-0 bottom-0 h-1 bg-safe-green animate-pulse-fast" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 px-4">
                        <div className="w-24 h-24 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-dark-700">
                            <div className="w-2 h-2 bg-dark-600 rounded-full animate-ping" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 tracking-tight">System Idle</h3>
                        <p className="text-dark-400 max-w-md mx-auto mb-8 leading-relaxed">
                            No active switches detected. Initialize a new protocol to secure your digital legacy.
                        </p>
                        <a href="/create" className="btn-primary py-4 px-8 text-lg shadow-2xl shadow-primary-900/20">
                            INITIALIZE PROTOCOL
                        </a>
                    </div>
                )}

                {pingError && (
                    <div className="fixed bottom-6 right-6 max-w-sm bg-dark-900/90 backdrop-blur-md border border-red-500/50 shadow-2xl rounded-xl p-4 flex items-start gap-3 animate-slide-up z-50">
                        <span className="text-red-500 text-xl">⚠️</span>
                        <div>
                            <h4 className="font-bold text-red-400 text-sm mb-1">IGNITION FAILED</h4>
                            <p className="text-xs text-dark-300">{pingError}</p>
                        </div>
                    </div>
                )}
            </div>

            {editingVault && (
                <EditVaultModal
                    vault={editingVault}
                    onClose={() => setEditingVault(null)}
                    onSuccess={() => {
                        setEditingVault(null);
                        refetch();
                    }}
                />
            )}

            {delegatingVault && (
                <DelegateModal
                    vault={delegatingVault}
                    onClose={() => setDelegatingVault(null)}
                    onSuccess={() => {
                        setDelegatingVault(null);
                        refetch();
                    }}
                />
            )}
        </main>
    );
}
