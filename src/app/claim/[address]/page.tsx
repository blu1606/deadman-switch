'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useVaultByAddress } from '@/hooks/useVaultByAddress';
import ClaimModal from '@/components/claim/ClaimModal';
import WalletButton from '@/components/wallet/WalletButton';
import Link from 'next/link';

/**
 * Direct Vault Claim Page
 * Allows recipients to view/claim vaults via direct URL without wallet connection.
 * URL: /claim/{vault_address}
 */
export default function DirectClaimPage() {
    const params = useParams();
    const address = params.address as string;
    const { connected } = useWallet();

    const { vault, loading, error } = useVaultByAddress(address);
    const [showModal, setShowModal] = useState(false);

    // Auto-open modal once vault is loaded
    useEffect(() => {
        if (vault && !loading) {
            setShowModal(true);
        }
    }, [vault, loading]);

    // Determine if this vault requires wallet (wallet-encrypted or has tokens)
    const isWalletRequired = vault?.encryptedKey?.startsWith('wallet:');
    const hasTokens = vault && (
        vault.lockedLamports?.gt?.(0) ||
        vault.lockedTokens?.gt?.(0)
    );

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center pt-16">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-dark-400">Loading vault...</p>
                </div>
            </main>
        );
    }

    if (error || !vault) {
        return (
            <main className="min-h-screen flex items-center justify-center pt-16">
                <div className="card text-center max-w-md">
                    <div className="text-4xl mb-4">🔍</div>
                    <h2 className="text-2xl font-bold mb-4">Vault Not Found</h2>
                    <p className="text-dark-400 mb-6">
                        {error || "We couldn't find a vault at this address. Please check the link and try again."}
                    </p>
                    <Link href="/" className="btn-primary inline-block">
                        Go Home
                    </Link>
                </div>
            </main>
        );
    }

    // If wallet is required but not connected
    if (isWalletRequired && !connected) {
        return (
            <main className="min-h-screen flex items-center justify-center pt-16">
                <div className="card text-center max-w-md">
                    <div className="text-4xl mb-4">🔐</div>
                    <h2 className="text-2xl font-bold mb-4">Wallet Required</h2>
                    <p className="text-dark-400 mb-6">
                        This vault is encrypted with a wallet key. Please connect your wallet to decrypt.
                    </p>
                    <WalletButton />
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen pt-16">
            {/* Vault Info Header (visible when modal closed) */}
            {!showModal && (
                <div className="container mx-auto max-w-2xl px-4 py-8">
                    <div className="card">
                        <h1 className="text-2xl font-bold mb-4">
                            {vault.name || 'Legacy Vault'}
                        </h1>
                        <p className="text-dark-400 mb-4">
                            From: <span className="font-mono text-sm">{vault.owner.toBase58().slice(0, 8)}...</span>
                        </p>

                        {hasTokens && !connected && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                                <p className="text-yellow-400 text-sm">
                                    💡 This vault contains tokens. Connect your wallet to claim them after viewing the content.
                                </p>
                                <div className="mt-3">
                                    <WalletButton />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setShowModal(true)}
                            className="btn-primary w-full"
                        >
                            🔓 Open Vault
                        </button>
                    </div>
                </div>
            )}

            {/* Claim Modal */}
            {showModal && (
                <ClaimModal
                    vault={vault}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        // Content viewed successfully
                    }}
                />
            )}
        </main>
    );
}
