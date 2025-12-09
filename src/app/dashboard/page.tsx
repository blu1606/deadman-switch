'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOwnerVaults, VaultData } from '@/hooks/useVault';
import { useWallet } from '@solana/wallet-adapter-react';
import WalletButton from '@/components/wallet/WalletButton';
import EditVaultModal from '@/components/dashboard/EditVaultModal';
import DelegateModal from '@/components/dashboard/DelegateModal';
import TopUpBountyModal from '@/components/dashboard/TopUpBountyModal';
import LockTokensModal from '@/components/dashboard/LockTokensModal';
import VaultCard from '@/components/dashboard/VaultCard';

export default function DashboardPage() {
    const { connected } = useWallet();
    const { vaults, loading, error, ping, refetch, getStatus } = useOwnerVaults();

    const [pingingVault, setPingingVault] = useState<string | null>(null);
    const [pingError, setPingError] = useState<string | null>(null);
    const [pingSuccess, setPingSuccess] = useState<string | null>(null);
    const [editingVault, setEditingVault] = useState<VaultData | null>(null);
    const [delegatingVault, setDelegatingVault] = useState<VaultData | null>(null);
    const [bountyVault, setBountyVault] = useState<VaultData | null>(null);
    const [lockingVault, setLockingVault] = useState<VaultData | null>(null);

    // Streak tracking
    const [streaks, setStreaks] = useState<Record<string, number>>({});

    // Fetch streaks for all vaults
    const fetchStreaks = useCallback(async () => {
        if (vaults.length === 0) return;

        const streakData: Record<string, number> = {};
        await Promise.all(
            vaults.map(async (vault) => {
                try {
                    const res = await fetch(`/api/vault/streak?vault=${vault.publicKey.toBase58()}`);
                    const data = await res.json();
                    streakData[vault.publicKey.toBase58()] = data.streak || 0;
                } catch (e) {
                    streakData[vault.publicKey.toBase58()] = 0;
                }
            })
        );
        setStreaks(streakData);
    }, [vaults]);

    useEffect(() => {
        if (vaults.length > 0) {
            fetchStreaks();
        }
    }, [vaults, fetchStreaks]);

    const handlePing = async (vault: VaultData) => {
        const vaultKey = vault.publicKey.toBase58();
        setPingingVault(vaultKey);
        setPingError(null);
        setPingSuccess(null);

        try {
            await ping(vault);

            // Update streak
            try {
                const res = await fetch('/api/vault/streak', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ vaultAddress: vaultKey })
                });
                const data = await res.json();
                if (data.success) {
                    setStreaks(prev => ({ ...prev, [vaultKey]: data.streak }));
                }
            } catch (e) {
                console.error('Failed to update streak', e);
            }

            setPingSuccess(vaultKey);
            setTimeout(() => setPingSuccess(null), 3000);
        } catch (err: any) {
            setPingError(err.message || 'Failed to check in');
        } finally {
            setPingingVault(null);
        }
    };

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
                        {vaults.filter((vault) => !getStatus(vault).isExpired).map((vault) => {
                            const status = getStatus(vault);
                            const key = vault.publicKey.toBase58();
                            const isPinging = pingingVault === key;
                            const isSuccess = pingSuccess === key;

                            return (
                                <VaultCard
                                    key={key}
                                    vault={vault}
                                    status={status}
                                    isPinging={isPinging}
                                    isSuccess={isSuccess}
                                    streak={streaks[key] || 0}
                                    onPing={() => handlePing(vault)}
                                    onEdit={() => setEditingVault(vault)}
                                    onDelegate={() => setDelegatingVault(vault)}
                                    onTopUp={() => setBountyVault(vault)}
                                    onLockTokens={() => setLockingVault(vault)}
                                />
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

            {bountyVault && (
                <TopUpBountyModal
                    vaultAddress={bountyVault.publicKey}
                    currentBounty={0.02} // Mock value
                    onClose={() => setBountyVault(null)}
                    onSuccess={() => {
                        setBountyVault(null);
                        refetch();
                    }}
                />
            )}

            {lockingVault && (
                <LockTokensModal
                    vaultAddress={lockingVault.publicKey}
                    existingMint={lockingVault.tokenMint ? new (require('@solana/web3.js')).PublicKey(lockingVault.tokenMint) : undefined}
                    onClose={() => setLockingVault(null)}
                    onSuccess={() => {
                        setLockingVault(null);
                        refetch();
                    }}
                />
            )}
        </main>
    );
}
