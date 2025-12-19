'use client';

import { useState, useCallback, useEffect } from 'react';
import { useOwnerVaults, VaultData } from './useVault';

export interface UseVaultInteractionsResult {
    pingingVault: string | null;
    pingError: string | null;
    pingSuccess: string | null;
    streaks: Record<string, number>;
    handlePing: (vault: VaultData) => Promise<void>;
    handleDuress: (vault: VaultData) => Promise<void>;
    clearPingStatus: () => void;
}

export function useVaultInteractions(): UseVaultInteractionsResult {
    const { ping } = useOwnerVaults();
    const { vaults } = useOwnerVaults(); // Get vaults to trigger streak fetch

    const [pingingVault, setPingingVault] = useState<string | null>(null);
    const [pingError, setPingError] = useState<string | null>(null);
    const [pingSuccess, setPingSuccess] = useState<string | null>(null);
    const [streaks, setStreaks] = useState<Record<string, number>>({});

    // Fetch streaks for all vaults
    const fetchStreaks = useCallback(async () => {
        if (!vaults || vaults.length === 0) return;

        const streakData: Record<string, number> = {};
        await Promise.all(
            vaults.map(async (vault) => {
                const vaultKey = vault.publicKey.toBase58();
                try {
                    const res = await fetch(`/api/vault/streak?vault=${vaultKey}`);
                    const data = await res.json();
                    streakData[vaultKey] = data.streak || 0;
                } catch {
                    streakData[vaultKey] = 0;
                }
            })
        );
        setStreaks(streakData);
    }, [vaults]);

    useEffect(() => {
        if (vaults && vaults.length > 0) {
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
        } catch (err: unknown) {
            const error = err as Error;
            setPingError(error.message || 'Failed to check in');
        } finally {
            setPingingVault(null);
        }
    };

    const handleDuress = async (vault: VaultData) => {
        const vaultKey = vault.publicKey.toBase58();

        try {
            let location = null;
            if (navigator.geolocation) {
                try {
                    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                    });
                    location = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
                } catch { /* ignore */ }
            }

            await fetch('/api/alert/duress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vaultAddress: vaultKey, location })
            });

            // Silent "Fake Success"
            setPingSuccess(vaultKey);
            setTimeout(() => setPingSuccess(null), 3000);
        } catch (e) {
            console.error('Duress alert failed (silent):', e);
            setPingSuccess(vaultKey);
            setTimeout(() => setPingSuccess(null), 3000);
        }
    };

    const clearPingStatus = () => {
        setPingError(null);
        setPingSuccess(null);
    };

    return {
        pingingVault,
        pingError,
        pingSuccess,
        streaks,
        handlePing,
        handleDuress,
        clearPingStatus
    };
}
