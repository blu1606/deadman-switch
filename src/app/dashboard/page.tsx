'use client';

import { useState } from 'react';
import { useOwnerVaults, VaultData } from '@/hooks/useVault';
import WalletButton from '@/components/wallet/WalletButton';
import EditVaultModal from '@/components/dashboard/EditVaultModal';
import { useWallet } from '@solana/wallet-adapter-react';

export default function DashboardPage() {
    const { connected } = useWallet();
    const { vaults, loading, error, ping, refetch, getStatus } = useOwnerVaults();

    const [pingingVault, setPingingVault] = useState<string | null>(null);
    const [pingError, setPingError] = useState<string | null>(null);
    const [pingSuccess, setPingSuccess] = useState<string | null>(null);
    const [editingVault, setEditingVault] = useState<VaultData | null>(null);

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
        <main className="min-h-screen pt-20 pb-10 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">My Vaults</h1>
                        <p className="text-dark-400">{vaults.length} vault(s) found</p>
                    </div>
                    <a href="/create" className="btn-primary">+ Create Vault</a>
                </div>

                {loading ? (
                    <div className="card text-center py-12">
                        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-dark-400">Loading vaults...</p>
                    </div>
                ) : error ? (
                    <div className="card text-center py-12">
                        <p className="text-red-400 mb-4">{error}</p>
                        <button onClick={refetch} className="btn-secondary">Try Again</button>
                    </div>
                ) : vaults.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-6">
                        {vaults.map((vault) => {
                            const status = getStatus(vault);
                            const key = vault.publicKey.toBase58();
                            const isPinging = pingingVault === key;
                            const isSuccess = pingSuccess === key;

                            return (
                                <div key={key} className="card hover:border-primary-500/50 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-semibold">Vault</h3>
                                            <p className="text-dark-500 text-xs font-mono">{truncateAddress(key)}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${vault.isReleased
                                            ? 'bg-red-500/20 text-red-400'
                                            : status.isExpired
                                                ? 'bg-yellow-500/20 text-yellow-400'
                                                : 'bg-green-500/20 text-green-400'
                                            }`}>
                                            {vault.isReleased ? '🔓 Released' : status.isExpired ? '⚠️ Expired' : '🔒 Active'}
                                        </span>
                                    </div>

                                    {!vault.isReleased && (
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-dark-400">Time Remaining</span>
                                                <span className={status.isExpired ? 'text-red-400' : 'text-white'}>
                                                    {formatTimeRemaining(status.timeRemaining)}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all ${status.percentageRemaining > 50
                                                        ? 'bg-green-500'
                                                        : status.percentageRemaining > 20
                                                            ? 'bg-yellow-500'
                                                            : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${Math.max(2, status.percentageRemaining)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                                        <div className="bg-dark-800 rounded p-2">
                                            <p className="text-dark-500">Recipient</p>
                                            <p className="font-mono">{truncateAddress(vault.recipient.toBase58())}</p>
                                        </div>
                                        <div className="bg-dark-800 rounded p-2">
                                            <p className="text-dark-500">Interval</p>
                                            <p>{Math.floor(vault.timeInterval.toNumber() / 86400)} days</p>
                                        </div>
                                    </div>

                                    {isSuccess && (
                                        <div className="bg-green-500/10 border border-green-500/30 rounded p-2 mb-3 text-green-400 text-xs">
                                            ✓ Check-in successful!
                                        </div>
                                    )}

                                    {!vault.isReleased && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handlePing(vault)}
                                                disabled={isPinging}
                                                className={`flex-1 py-2 rounded-lg text-sm font-medium btn-primary ${isPinging ? 'opacity-50' : ''}`}
                                            >
                                                {isPinging ? 'Checking in...' : '🔔 Check In'}
                                            </button>
                                            <button
                                                onClick={() => setEditingVault(vault)}
                                                className="px-3 py-2 rounded-lg text-sm font-medium btn-secondary"
                                            >
                                                ✏️
                                            </button>
                                        </div>
                                    )}

                                    {vault.isReleased && (
                                        <div className="text-center text-red-400 text-sm py-2">
                                            Vault Released
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="card text-center py-12">
                        <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🔒</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No Vaults</h3>
                        <p className="text-dark-400 mb-6">Create a vault to secure your digital legacy.</p>
                        <a href="/create" className="btn-primary">Create Vault</a>
                    </div>
                )}

                {pingError && (
                    <div className="fixed bottom-4 right-4 bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
                        {pingError}
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
        </main>
    );
}
