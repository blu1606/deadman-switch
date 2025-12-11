'use client';

import { useState, useCallback, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Connection } from '@solana/web3.js';
import { parseVaultAccount, VaultData } from '@/utils/solanaParsers';

/**
 * Fetch a single vault by its PDA address using read-only RPC.
 * No wallet connection required.
 */
export function useVaultByAddress(address: string | null) {
    const { connection } = useConnection();

    const [vault, setVault] = useState<VaultData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchVault = useCallback(async () => {
        if (!address) {
            setVault(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const pubkey = new PublicKey(address);
            const accountInfo = await connection.getAccountInfo(pubkey);

            if (!accountInfo) {
                throw new Error('Vault not found');
            }

            const parsed = parseVaultAccount(pubkey, accountInfo.data as Buffer);
            setVault(parsed);
        } catch (err) {
            console.error('Failed to fetch vault:', err);
            setError(err instanceof Error ? err.message : 'Failed to load vault');
        } finally {
            setLoading(false);
        }
    }, [address, connection]);

    useEffect(() => {
        fetchVault();
    }, [fetchVault]);

    return { vault, loading, error, refetch: fetchVault };
}

/**
 * Standalone function to fetch vault without React context.
 * Useful for server-side or direct calls.
 */
export async function fetchVaultByAddress(
    connection: Connection,
    address: string
): Promise<VaultData> {
    const pubkey = new PublicKey(address);
    const accountInfo = await connection.getAccountInfo(pubkey);

    if (!accountInfo) {
        throw new Error('Vault not found');
    }

    return parseVaultAccount(pubkey, accountInfo.data as Buffer);
}
