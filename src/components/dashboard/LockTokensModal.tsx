'use client';

import { FC, useState, useEffect } from 'react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getAccount } from '@solana/spl-token';

interface LockTokensModalProps {
    vaultAddress: PublicKey;
    existingMint: PublicKey | null | undefined;
    onClose: () => void;
    onSuccess: () => void;
}

const LockTokensModal: FC<LockTokensModalProps> = ({ vaultAddress, existingMint, onClose, onSuccess }) => {
    const [mintAddress, setMintAddress] = useState<string>(existingMint ? existingMint.toBase58() : '');
    const [amount, setAmount] = useState<string>('');
    const [status, setStatus] = useState<'idle' | 'checking' | 'processing' | 'success'>('idle');
    const [userBalance, setUserBalance] = useState<number | null>(null);
    const [tokenDecimals, setTokenDecimals] = useState<number>(9);
    const [error, setError] = useState<string | null>(null);

    const { publicKey, signTransaction, signAllTransactions } = useWallet();
    const { connection } = useConnection();

    // Effect: Fetch balance/decimals when mint changes
    useEffect(() => {
        if (!publicKey || !mintAddress) {
            setUserBalance(null);
            return;
        }

        const fetchTokenInfo = async () => {
            // Only try checking if valid pubkey length
            if (mintAddress.length < 32) return;

            try {
                let mintPubkey;
                try {
                    mintPubkey = new PublicKey(mintAddress);
                } catch {
                    return; // Invalid key format
                }

                // Get Mint Info (decimals)
                const mintInfo = await connection.getParsedAccountInfo(mintPubkey);
                if (!mintInfo.value) return;

                // @ts-ignore
                const decimals = mintInfo.value.data.parsed.info.decimals;
                setTokenDecimals(decimals);

                // Get User ATA Balance
                const userAta = await getAssociatedTokenAddress(mintPubkey, publicKey);
                try {
                    const account = await getAccount(connection, userAta);
                    setUserBalance(Number(account.amount) / Math.pow(10, decimals));
                    setError(null);
                } catch (e) {
                    // Start from 0 if no account
                    setUserBalance(0);
                }
            } catch (err) {
                console.error("Error fetching token info", err);
            }
        };

        const timer = setTimeout(fetchTokenInfo, 500); // Debounce
        return () => clearTimeout(timer);
    }, [mintAddress, publicKey, connection]);


    const handleLock = async () => {
        if (!publicKey || !signTransaction || !signAllTransactions) return;

        setError(null);
        setStatus('processing');

        try {
            const provider = new AnchorProvider(
                connection,
                { publicKey, signTransaction, signAllTransactions },
                { commitment: 'confirmed' }
            );

            const idl = await import('@/idl/deadmans_switch.json');
            const program = new Program(idl as any, provider);

            const mintPubkey = new PublicKey(mintAddress);
            const rawAmount = new BN(parseFloat(amount) * Math.pow(10, tokenDecimals));

            // PDAs / ATAs
            const vaultTokenAccount = await getAssociatedTokenAddress(mintPubkey, vaultAddress, true);
            const ownerTokenAccount = await getAssociatedTokenAddress(mintPubkey, publicKey);

            await (program.methods as any)
                .lockTokens(rawAmount)
                .accounts({
                    vault: vaultAddress,
                    owner: publicKey,
                    tokenMint: mintPubkey,
                    vaultTokenAccount: vaultTokenAccount,
                    ownerTokenAccount: ownerTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            setStatus('success');
            setTimeout(onSuccess, 1500);
        } catch (error: any) {
            console.error("Lock Tokens failed", error);
            setStatus('idle');
            setError(error.message || "Failed to lock tokens");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-dark-800 rounded-xl max-w-sm w-full p-6 border border-dark-700 shadow-2xl">
                <h2 className="text-xl font-bold mb-1">Lock SPL Tokens</h2>
                <p className="text-sm text-dark-400 mb-6">
                    Add tokens to your vault's payload.
                </p>

                {status === 'success' ? (
                    <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-6 text-center animate-fade-in">
                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">✓</span>
                        </div>
                        <h3 className="text-green-400 font-bold">Tokens Locked!</h3>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4 mb-6">
                            {/* Mint Address Input */}
                            <div>
                                <label className="block text-xs font-medium text-dark-300 mb-2">
                                    Token Mint Address
                                </label>
                                <input
                                    type="text"
                                    value={mintAddress}
                                    onChange={(e) => setMintAddress(e.target.value)}
                                    disabled={!!existingMint} // Cannot change if already set
                                    placeholder="Enter Copy/Paste Mint Address"
                                    className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                {existingMint && (
                                    <p className="text-[10px] text-yellow-500 mt-1">
                                        * Vault is already tied to this token mint
                                    </p>
                                )}
                            </div>

                            {/* Amount Input */}
                            <div>
                                <label className="block text-xs font-medium text-dark-300 mb-2">
                                    Amount to Lock
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white font-mono"
                                    />
                                    {userBalance !== null && (
                                        <div className="absolute right-3 top-3 text-[10px] text-dark-400">
                                            Methods: <button onClick={() => setAmount(userBalance.toString())} className="text-primary-400 hover:underline">Max ({userBalance.toFixed(2)})</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={status === 'processing'}
                                className="flex-1 btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLock}
                                disabled={status === 'processing' || !amount || parseFloat(amount) <= 0 || !mintAddress}
                                className="flex-1 btn-primary"
                            >
                                {status === 'processing' ? 'Processing...' : 'Lock Tokens'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default LockTokensModal;
