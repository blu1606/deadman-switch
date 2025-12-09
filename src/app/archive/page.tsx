'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import WalletButton from '@/components/wallet/WalletButton';
import ClaimedVaultCard from '@/components/archive/ClaimedVaultCard';
import { useClaimedVaults, ClaimedVaultRecord } from '@/hooks/useClaimedVaults';
import ClaimModal from '@/components/claim/ClaimModal';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export default function ArchivePage() {
    const { connected } = useWallet();
    const { vaults, loading, clearHistory } = useClaimedVaults();
    const [selectedVault, setSelectedVault] = useState<any | null>(null);

    // Reconstruct vault object for ClaimModal
    const handleView = (record: ClaimedVaultRecord) => {
        try {
            const vaultData = {
                publicKey: new PublicKey(record.address),
                owner: new PublicKey(record.senderAddress),
                recipient: new PublicKey(record.address), // Not strictly needed for view
                ipfsCid: record.ipfsCid,
                encryptedKey: record.encryptedKey,
                // Reconstruct BN from hex string
                vaultSeed: new BN(record.vaultSeed, 'hex'),
                // Mock other fields
                timeInterval: new BN(0),
                lastCheckIn: new BN(0),
                isReleased: true, // Archived means released
                bump: 0,
                bountyLamports: new BN(0),
                name: record.name
            };
            setSelectedVault(vaultData);
        } catch (err) {
            console.error('Failed to reconstruct vault data', err);
        }
    };

    const handleExport = (record: ClaimedVaultRecord) => {
        const data = JSON.stringify(record, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `archive-${record.name.replace(/\s+/g, '_')}-${record.claimedAt}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!connected) {
        return (
            <main className="min-h-screen flex items-center justify-center pt-16">
                <div className="card text-center max-w-md">
                    <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
                    <p className="text-dark-400 mb-6">
                        Connect your wallet to access your claimed vault archive.
                    </p>
                    <WalletButton />
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen pt-20 pb-10 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Vault Archive</h1>
                        <p className="text-dark-400">History of your claimed legacies.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-dark-400">Loading archive...</p>
                    </div>
                ) : vaults.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {vaults.map((vault) => (
                            <ClaimedVaultCard
                                key={vault.address}
                                vault={vault}
                                onView={() => handleView(vault)}
                                onExport={() => handleExport(vault)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="card text-center py-12">
                        <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">📦</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No Vaults in Archive</h3>
                        <p className="text-dark-400 mb-6">
                            You haven&apos;t claimed any vaults yet.
                        </p>
                        <a href="/claim" className="btn-primary inline-block">
                            Go to Claim Page
                        </a>
                    </div>
                )}

                {vaults.length > 0 && (
                    <div className="mt-12 text-center">
                        <button
                            onClick={() => {
                                if (confirm('Are you sure you want to clear your local archive history? This cannot be undone.')) {
                                    clearHistory();
                                }
                            }}
                            className="text-xs text-dark-500 hover:text-red-400 transition-colors"
                        >
                            Clear History
                        </button>
                    </div>
                )}

                {/* Re-use ClaimModal for viewing */}
                {selectedVault && (
                    <ClaimModal
                        vault={selectedVault}
                        onClose={() => setSelectedVault(null)}
                        onSuccess={() => {
                            // No-op for archive view
                        }}
                    />
                )}
            </div>
        </main>
    );
}
