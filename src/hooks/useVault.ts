'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { PROGRAM_ID } from '@/utils/anchor';
import { parseVaultAccount, VaultData } from '@/utils/solanaParsers';

export type { VaultData }; // Re-export for consumers

export interface VaultStatus {
    isExpired: boolean;
    timeRemaining: number;
    percentageRemaining: number;
    nextCheckInDate: Date;
    healthStatus: 'healthy' | 'warning' | 'critical';
}

export interface UseOwnerVaultsResult {
    vaults: VaultData[];
    loading: boolean;
    error: string | null;
    refetch: (silent?: boolean) => Promise<void>;
    ping: (vault: VaultData) => Promise<string>;
    getStatus: (vault: VaultData) => VaultStatus;
}

export function useOwnerVaults(): UseOwnerVaultsResult {
    const { publicKey, signTransaction, signAllTransactions } = useWallet();
    const { connection } = useConnection();

    const [vaults, setVaults] = useState<VaultData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getStatus = useCallback((vault: VaultData): VaultStatus => {
        const now = Math.floor(Date.now() / 1000);
        const lastCheckIn = vault.lastCheckIn.toNumber();
        const interval = vault.timeInterval.toNumber();
        const expiryTime = lastCheckIn + interval;
        const timeRemaining = Math.max(0, expiryTime - now);
        const percentageRemaining = interval > 0 ? (timeRemaining / interval) * 100 : 0;

        let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
        const daysRemaining = timeRemaining / 86400;

        if (percentageRemaining < 25) {
            healthStatus = 'critical';
        } else if (percentageRemaining < 50) {
            healthStatus = 'warning';
        }

        return {
            isExpired: now > expiryTime,
            timeRemaining,
            percentageRemaining,
            nextCheckInDate: new Date(expiryTime * 1000),
            healthStatus,
        };
    }, []);

    const fetchVaults = useCallback(async (silent = false) => {
        if (!publicKey) {
            setVaults([]);
            setLoading(false);
            return;
        }

        if (!silent) {
            setLoading(true);
        }
        setError(null);

        try {
            const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
                filters: [
                    {
                        memcmp: {
                            offset: 8,
                            bytes: publicKey.toBase58(),
                        },
                    },
                ],
            });

            const parsed = accounts.map((acc) => parseVaultAccount(acc.pubkey, acc.account.data));

            setVaults(parsed);
        } catch (err) {
            console.error('Failed to fetch owner vaults:', err);
            setError('Failed to load vaults');
        } finally {
            setLoading(false);
        }
    }, [publicKey, connection]);

    const ping = useCallback(async (vault: VaultData): Promise<string> => {
        if (!publicKey || !signTransaction || !signAllTransactions) {
            throw new Error('Wallet not connected');
        }

        const provider = new AnchorProvider(
            connection,
            { publicKey, signTransaction, signAllTransactions },
            { commitment: 'confirmed' }
        );

        const idl = await import('@/idl/deadmans_switch.json');
        const program = new Program(idl as any, provider);

        const tx = await (program.methods as any)
            .ping()
            .accounts({
                vault: vault.publicKey,
                signer: publicKey,
            })
            .rpc();

        // Optimistic update
        const now = Math.floor(Date.now() / 1000);
        setVaults(prev => prev.map(v =>
            v.publicKey.equals(vault.publicKey)
                ? { ...v, lastCheckIn: new BN(now) }
                : v
        ));

        // Background fetch to ensure consistency, but don't block
        fetchVaults(true).catch(console.error);

        return tx;
    }, [publicKey, signTransaction, signAllTransactions, connection, fetchVaults]);

    useEffect(() => {
        fetchVaults();
    }, [fetchVaults]);

    return {
        vaults,
        loading,
        error,
        refetch: fetchVaults,
        ping,
        getStatus,
    };
}

// Backwards compat: Keep useVault returning single
export function useVault() {
    const result = useOwnerVaults();
    const vault = result.vaults.length > 0 ? result.vaults[0] : null;
    const status = vault ? result.getStatus(vault) : null;

    return {
        vault,
        status,
        loading: result.loading,
        error: result.error,
        refetch: result.refetch,
        ping: vault ? () => result.ping(vault) : async () => { throw new Error('No vault'); },
    };
}
