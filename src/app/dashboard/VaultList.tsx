'use client';

import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useOwnerVaults, VaultData } from '@/hooks/useVault';
import { useUnifiedWallet as useWallet } from '@/hooks/useUnifiedWallet';
import EditVaultModal from '@/components/dashboard/EditVaultModal';
import DelegateModal from '@/components/dashboard/DelegateModal';
import TopUpBountyModal from '@/components/dashboard/TopUpBountyModal';
import LockTokensModal from '@/components/dashboard/LockTokensModal';
import VaultCard from '@/components/dashboard/VaultCard';
import KipEmpty from '@/components/brand/KipEmpty';
import { StatGridSkeleton, VaultCardSkeleton } from '@/components/ui/skeletons';

import { useVaultInteractions } from '@/hooks/useVaultInteractions';

export default function VaultList() {
    const { connected } = useWallet();
    const { vaults, loading, error, refetch, getStatus } = useOwnerVaults();
    const {
        pingingVault,
        pingError,
        pingSuccess,
        streaks,
        handlePing,
        handleDuress
    } = useVaultInteractions();

    const [editingVault, setEditingVault] = useState<VaultData | null>(null);
    const [delegatingVault, setDelegatingVault] = useState<VaultData | null>(null);
    const [bountyVault, setBountyVault] = useState<VaultData | null>(null);
    const [lockingVault, setLockingVault] = useState<VaultData | null>(null);

    if (loading && connected) {
        return (
            <>
                <StatGridSkeleton />
                <div className="grid gap-8">
                    <VaultCardSkeleton />
                    <VaultCardSkeleton />
                </div>
            </>
        );
    }

    if (error) {
        return (
            <div className="card border-red-500/30 bg-red-500/5 text-center py-12">
                <p className="text-red-400 mb-4">{error}</p>
                <button onClick={() => refetch()} className="btn-secondary">RETRY CONNECTION</button>
            </div>
        );
    }

    if (vaults.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
                <KipEmpty />
                <a href="/create" className="mt-8 btn-primary py-4 px-8 text-lg shadow-2xl shadow-primary-900/20">
                    INITIALIZE PROTOCOL
                </a>
            </div>
        );
    }

    return (
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
                        onDuress={() => handleDuress(vault)}
                        onUpdate={refetch}
                        onCloseVault={refetch}
                    />
                );
            })}

            {pingError && (
                <div className="fixed bottom-6 right-6 max-w-sm bg-dark-900/90 backdrop-blur-md border border-red-500/50 shadow-2xl rounded-xl p-4 flex items-start gap-3 animate-slide-up z-50">
                    <span className="text-red-500 text-xl">⚠️</span>
                    <div>
                        <h4 className="font-bold text-red-400 text-sm mb-1">IGNITION FAILED</h4>
                        <p className="text-xs text-dark-300">{pingError}</p>
                    </div>
                </div>
            )}

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
                    currentBounty={bountyVault.bountyLamports.toNumber() / 1e9}
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
                    existingMint={lockingVault.tokenMint ? new PublicKey(lockingVault.tokenMint) : undefined}
                    onClose={() => setLockingVault(null)}
                    onSuccess={() => {
                        setLockingVault(null);
                        refetch();
                    }}
                />
            )}
        </div>
    );
}
