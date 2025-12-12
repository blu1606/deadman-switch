'use client';

import { useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, BN, Idl } from '@coral-xyz/anchor';
import { PROGRAM_ID } from '@/utils/anchor';
import { parseVaultAccount, VaultData } from '@/utils/solanaParsers';
import { DeadmansSwitch } from '@/types/deadmans-switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
    const queryClient = useQueryClient();

    const getStatus = useCallback((vault: VaultData): VaultStatus => {
        const now = Math.floor(Date.now() / 1000);
        const lastCheckIn = vault.lastCheckIn.toNumber();
        const interval = vault.timeInterval.toNumber();
        const expiryTime = lastCheckIn + interval;
        const timeRemaining = Math.max(0, expiryTime - now);
        const percentageRemaining = interval > 0 ? (timeRemaining / interval) * 100 : 0;

        let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';


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

    // TanStack Query for fetching vaults
    const { data: vaults = [], isLoading, error, refetch: queryRefetch } = useQuery({
        queryKey: ['ownerVaults', publicKey?.toBase58()],
        queryFn: async () => {
            if (!publicKey) return [];

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

            return accounts.map((acc) => parseVaultAccount(acc.pubkey, acc.account.data));
        },
        enabled: !!publicKey,
        staleTime: 30 * 1000, // 30 seconds
    });

    // Mutation for ping operation
    const pingMutation = useMutation({
        mutationFn: async (vault: VaultData) => {
            if (!publicKey || !signTransaction || !signAllTransactions) {
                throw new Error('Wallet not connected');
            }

            const provider = new AnchorProvider(
                connection,
                { publicKey, signTransaction, signAllTransactions },
                { commitment: 'confirmed' }
            );

            const idl = await import('@/idl/deadmans_switch.json');

            const program = new Program<DeadmansSwitch>(idl as unknown as Idl, provider);

            const tx = await program.methods
                .ping()
                .accounts({
                    vault: vault.publicKey,
                    signer: publicKey,
                })
                .rpc();

            return { tx, vault };
        },
        onSuccess: ({ vault }) => {
            // Optimistic update
            const now = Math.floor(Date.now() / 1000);
            queryClient.setQueryData<VaultData[]>(
                ['ownerVaults', publicKey?.toBase58()],
                (old) => old?.map(v =>
                    v.publicKey.equals(vault.publicKey)
                        ? { ...v, lastCheckIn: new BN(now) }
                        : v
                ) || []
            );

            // Background refetch
            queryClient.invalidateQueries({ queryKey: ['ownerVaults'] });
        },
    });

    // Wrapper for refetch
    const refetch = useCallback(async () => {
        await queryRefetch();
    }, [queryRefetch]);

    // Wrapper for ping
    const ping = useCallback(async (vault: VaultData): Promise<string> => {
        const result = await pingMutation.mutateAsync(vault);
        return result.tx;
    }, [pingMutation]);

    return {
        vaults,
        loading: isLoading,
        error: error instanceof Error ? error.message : error ? 'Failed to load vaults' : null,
        refetch,
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

