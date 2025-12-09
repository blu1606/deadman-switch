'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export interface ClaimedVaultRecord {
    address: string;
    name: string;
    claimedAt: number;
    senderAddress: string;
    senderName?: string;
    contentSummary: {
        itemCount: number;
        totalSize: number;
        types: string[]; // 'text' | 'image' | 'audio' | ...
    };
    ipfsCid: string;
    encryptedKey: string; // Needed for re-decryption
    vaultSeed: string; // Hex string of BN, needed for timeline
    decryptionHint?: string;
    txSignature?: string;
}

export function useClaimedVaults() {
    const { publicKey } = useWallet();
    const [vaults, setVaults] = useState<ClaimedVaultRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const getStorageKey = useCallback(() => {
        if (!publicKey) return null;
        return `claimed_vaults_${publicKey.toBase58()}`;
    }, [publicKey]);

    // Load vaults
    useEffect(() => {
        const key = getStorageKey();
        if (!key) {
            setVaults([]);
            setLoading(false);
            return;
        }

        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                setVaults(JSON.parse(stored));
            } else {
                setVaults([]);
            }
        } catch (err) {
            console.error('Failed to load claimed vaults:', err);
            setVaults([]);
        } finally {
            setLoading(false);
        }
    }, [getStorageKey]);

    const addVault = useCallback((record: ClaimedVaultRecord) => {
        const key = getStorageKey();
        if (!key) return;

        setVaults(prev => {
            // Check if already exists to avoid duplicates
            const exists = prev.some(v => v.address === record.address);
            if (exists) return prev; // Or should we update? For now, ignore.

            const next = [record, ...prev];
            localStorage.setItem(key, JSON.stringify(next));
            return next;
        });
    }, [getStorageKey]);

    const removeVault = useCallback((address: string) => {
        const key = getStorageKey();
        if (!key) return;

        setVaults(prev => {
            const next = prev.filter(v => v.address !== address);
            localStorage.setItem(key, JSON.stringify(next));
            return next;
        });
    }, [getStorageKey]);

    const clearHistory = useCallback(() => {
        const key = getStorageKey();
        if (!key) return;
        localStorage.removeItem(key);
        setVaults([]);
    }, [getStorageKey]);

    return {
        vaults,
        loading,
        addVault,
        removeVault,
        clearHistory,
    };
}
