'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { motion, AnimatePresence } from 'framer-motion';
import { unwrapKeyWithPassword, unwrapKeyWithWallet, WrappedKeyData, WalletKeyData, EncryptedData } from '@/utils/crypto';
import { fetchFromIPFS } from '@/utils/ipfs';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import VaultSafe from './VaultSafe';
import AssetCard from './AssetCard';
import VaultContentEditor from '@/components/vault/VaultContentEditor';
import { VaultItem } from '@/types/vaultBundle';
import VaultTimeline from './VaultTimeline';
import { getCreatedDate } from '@/lib/utils';
import { useClaimedVaults } from '@/hooks/useClaimedVaults';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

interface ClaimModalProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vault: any;
    onClose: () => void;
    onSuccess: () => void;
}

type RevealState = 'input' | 'unlocking' | 'message' | 'assets';

export default function ClaimModal({ vault, onClose, onSuccess }: ClaimModalProps) {
    const { publicKey, signTransaction, signAllTransactions } = useWallet();
    const { connection } = useConnection();
    const { addVault } = useClaimedVaults();

    // Form State
    const [password, setPassword] = useState('');
    const [encryptionMode, setEncryptionMode] = useState<'password' | 'wallet' | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Reveal State
    const [revealState, setRevealState] = useState<RevealState>('input');
    const [isDecrypting, setIsDecrypting] = useState(false);

    // Decrypted Content State
    const [decryptedText, setDecryptedText] = useState<string | null>(null);
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [fileType, setFileType] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);
    const [bundleItems, setBundleItems] = useState<VaultItem[] | null>(null);
    const [vaultClosed, setVaultClosed] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Typewriter State
    const [displayedText, setDisplayedText] = useState('');
    const [showContinue, setShowContinue] = useState(false);

    // IPFS Data State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [ipfsData, setIpfsData] = useState<any | null>(null);
    const [loadingMetadata, setLoadingMetadata] = useState(false);

    // Gasless Claim Detection (Premium Feature)
    const isGaslessEligible = vault?.gasTank && new BN(vault.gasTank).gt(new BN(0));

    // Detect encryption mode and FETCH METADATA EARLY
    useEffect(() => {
        if (vault?.encryptedKey) {
            setEncryptionMode(vault.encryptedKey.startsWith('wallet:') ? 'wallet' : 'password');
        }

        // Fetch IPFS data immediately to get hint and metadata
        if (vault?.ipfsCid) {
            setLoadingMetadata(true);
            import('@/utils/ipfs').then(({ fetchJSONFromIPFS }) => {
                fetchJSONFromIPFS(vault.ipfsCid)
                    .then(data => {
                        setIpfsData(data);
                        setLoadingMetadata(false);
                    })
                    .catch(err => {
                        console.error("Failed to load vault metadata:", err);
                        // Don't block UI, just fail silently or show retry
                        setLoadingMetadata(false);
                    });
            });
        }
    }, [vault]);

    // Typewriter effect for text content (as final message)
    useEffect(() => {
        if (revealState === 'message' && decryptedText) {
            let index = 0;
            setDisplayedText('');
            const interval = setInterval(() => {
                if (index < decryptedText.length && index < 500) {
                    setDisplayedText(prev => prev + decryptedText[index]);
                    index++;
                } else {
                    clearInterval(interval);
                    setTimeout(() => setShowContinue(true), 500);
                }
            }, 20);
            return () => clearInterval(interval);
        }
    }, [revealState, decryptedText]);

    const handleClaim = async () => {
        if (encryptionMode === 'password' && !password) {
            setError('Please enter password');
            return;
        }
        if (!publicKey) {
            setError('Wallet not connected');
            return;
        }

        setRevealState('unlocking');
        setIsDecrypting(true);
        setError(null);

        try {
            // Use cached data or fetch if missing
            let pkg = ipfsData;
            if (!pkg) {
                const encryptedBlob = await fetchFromIPFS(vault.ipfsCid);
                const packageText = await encryptedBlob.text();
                pkg = JSON.parse(packageText);
            }

            let vaultKey;

            if (pkg.version === 3 && pkg.mode === 'wallet' && pkg.walletKey) {
                const walletKeyData: WalletKeyData = pkg.walletKey;
                vaultKey = await unwrapKeyWithWallet(walletKeyData, publicKey.toBase58());
            } else if (pkg.version === 2 && pkg.keyWrapper) {
                const wrapper: WrappedKeyData = pkg.keyWrapper;
                vaultKey = await unwrapKeyWithPassword(wrapper, password);
            } else {
                // Version 1 fallback or error
                if (pkg.encryptedFile && !pkg.keyWrapper && !pkg.walletKey) {
                    // Legacy v1? Assuming password passed directly or unsupported
                    // For now throw error as we moved to v2/v3
                    // Attempt v2 fallback if structure matches
                    throw new Error('Unsupported vault version (legacy).');
                }
                throw new Error('Unknown vault format.');
            }

            const encryptedFile: EncryptedData = pkg.encryptedFile;
            const decryptedBlob = await import('@/utils/crypto').then(m => m.decryptFile(encryptedFile, vaultKey));

            setFileType(pkg.metadata.fileType);
            setFileName(pkg.metadata.fileName);
            // setDownloadBlob(decryptedBlob); // We might not need this for bundle, or we download the whole json

            if (pkg.metadata.fileName === 'vault_bundle.json') {
                // Handle Bundle
                const bundleText = await decryptedBlob.text();
                const bundle = JSON.parse(bundleText);
                setBundleItems(bundle.items);
                setDownloadBlob(decryptedBlob); // Allow downloading the raw bundle json too
            } else {
                setDownloadBlob(decryptedBlob);
                if (pkg.metadata.fileType.startsWith('text/')) {
                    const text = await decryptedBlob.text();
                    setDecryptedText(text);
                } else {
                    const url = URL.createObjectURL(decryptedBlob);
                    setMediaUrl(url);
                }
            }

            setIsDecrypting(false);

            // Delay before showing content - let safe animation play
            setTimeout(() => {
                if (pkg.metadata.fileName === 'vault_bundle.json') {
                    setRevealState('assets');
                } else if (pkg.metadata.fileType.startsWith('text/')) {
                    setRevealState('message'); // Show typewriter for text
                } else {
                    setRevealState('assets'); // Go directly to assets for media
                }
            }, 2500);

            // Save to Archive (C.3)
            const summaryTypes = bundleItems
                ? Array.from(new Set(bundleItems.map(i => i.type)))
                : [pkg.metadata.fileType.startsWith('text') ? 'text' : pkg.metadata.fileType.startsWith('image') ? 'image' : 'file'];

            addVault({
                address: vault.publicKey.toBase58(),
                name: vault.name || 'Untitled Vault',
                claimedAt: Date.now(),
                senderAddress: vault.owner.toBase58(),
                contentSummary: {
                    itemCount: bundleItems ? bundleItems.length : 1,
                    totalSize: pkg.metadata.size || 0,
                    types: summaryTypes as string[]
                },
                ipfsCid: vault.ipfsCid,
                encryptedKey: vault.encryptedKey,
                vaultSeed: vault.vaultSeed.toString('hex')
            });

            onSuccess();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error('Claim failed:', err);
            setIsDecrypting(false);
            setRevealState('input');
            setError(err.message || 'Decryption failed. Check your wallet or password.');
        }
    };

    // State for separate claims
    const [isClaimingSol, setIsClaimingSol] = useState(false);
    const [isClaimingTokens, setIsClaimingTokens] = useState(false);
    const [solClaimed, setSolClaimed] = useState(false);
    const [tokensClaimed, setTokensClaimed] = useState(false);

    const handleClaimSol = async () => {
        if (!publicKey || !signTransaction || !signAllTransactions) return;
        setIsClaimingSol(true);
        try {
            const provider = new AnchorProvider(connection, { publicKey, signTransaction, signAllTransactions }, { commitment: 'confirmed' });
            const idl = await import('@/idl/deadmans_switch.json');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const program = new Program(idl as any, provider);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (program.methods as any)
                .claimSol()
                .accounts({
                    vault: vault.publicKey,
                    recipient: publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            setSolClaimed(true);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error('Claim SOL failed:', err);
            setError(err.message || 'Failed to claim SOL');
        } finally {
            setIsClaimingSol(false);
        }
    };

    const handleClaimTokens = async () => {
        if (!publicKey || !signTransaction || !signAllTransactions) return;
        setIsClaimingTokens(true);
        try {
            const provider = new AnchorProvider(connection, { publicKey, signTransaction, signAllTransactions }, { commitment: 'confirmed' });
            const idl = await import('@/idl/deadmans_switch.json');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const program = new Program(idl as any, provider);

            // We need the token mint. It's in the vault data (parsing logic updated).
            // Assuming vault.tokenMint is available (parsed in useRecipientVaults -> solanaParsers)
            if (!vault.tokenMint) throw new Error("No token mint found for this vault");

            const tokenMint = new PublicKey(vault.tokenMint);

            const vaultTokenAccount = await getAssociatedTokenAddress(tokenMint, vault.publicKey, true);
            const recipientTokenAccount = await getAssociatedTokenAddress(tokenMint, publicKey);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (program.methods as any)
                .claimTokens()
                .accounts({
                    vault: vault.publicKey,
                    recipient: publicKey,
                    tokenMint: tokenMint,
                    vaultTokenAccount: vaultTokenAccount,
                    recipientTokenAccount: recipientTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            setTokensClaimed(true);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error('Claim Tokens failed:', err);
            setError(err.message || 'Failed to claim tokens');
        } finally {
            setIsClaimingTokens(false);
        }
    };

    // Pre-calculate eligibility for closing vault
    const now = Math.floor(Date.now() / 1000);
    const expiryTime = vault.lastCheckIn.toNumber() + vault.timeInterval.toNumber();
    const isExpiredOrReleased = now > expiryTime || vault.isReleased;
    const isRecipient = publicKey?.toBase58() === vault.recipient.toBase58();
    const canClose = isExpiredOrReleased && isRecipient;

    const handleClaimAndClose = async () => {
        if (!publicKey || !signTransaction || !signAllTransactions) {
            setError('Wallet not connected');
            return;
        }

        // Pre-flight validation
        if (!isExpiredOrReleased) {
            setError('Vault has not expired yet. Cannot close until the timer runs out.');
            return;
        }

        if (!isRecipient) {
            setError('Only the designated recipient can close this vault.');
            return;
        }

        setIsClosing(true);
        setError(null);

        try {
            const provider = new AnchorProvider(
                connection,
                { publicKey, signTransaction, signAllTransactions },
                { commitment: 'confirmed' }
            );

            const idl = await import('@/idl/deadmans_switch.json');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const program = new Program(idl as any, provider);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (program.methods as any)
                .claimAndClose()
                .accounts({
                    vault: vault.publicKey,
                    recipient: publicKey,
                })
                .rpc();

            setVaultClosed(true);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error('Close failed:', err);

            // Parse Anchor error for user-friendly message
            let errorMessage = 'Failed to close vault';
            const errorString = err.toString();

            if (errorString.includes('6000') || errorString.includes('Unauthorized')) {
                errorMessage = 'Only the designated recipient can close this vault.';
            } else if (errorString.includes('6001') || errorString.includes('NotExpired')) {
                errorMessage = 'Vault has not expired yet. Please wait until the timer runs out.';
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
        } finally {
            setIsClosing(false);
        }
    };

    const downloadFile = () => {
        if (!downloadBlob) return;
        const url = URL.createObjectURL(downloadBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const closeModal = () => {
        if (mediaUrl) URL.revokeObjectURL(mediaUrl);
        onClose();
    };

    const handleContinueToAssets = () => {
        setRevealState('assets');
    };

    const skipTypewriter = () => {
        if (decryptedText) {
            setDisplayedText(decryptedText.slice(0, 500));
            setShowContinue(true);
        }
    };

    // Render content preview
    const renderContentPreview = () => {
        if (decryptedText !== null) {
            return (
                <pre className="whitespace-pre-wrap text-white font-mono text-sm p-4 max-h-[300px] overflow-auto">
                    {decryptedText}
                </pre>
            );
        }
        if (mediaUrl) {
            if (fileType.startsWith('image/')) {
                return <Image src={mediaUrl} alt="Decrypted" width={500} height={300} className="max-w-full max-h-[300px] w-auto h-auto mx-auto rounded-lg object-contain" unoptimized />;
            }
            if (fileType.startsWith('video/')) {
                return <video src={mediaUrl} controls className="w-full max-h-[300px] rounded-lg" />;
            }
            if (fileType.startsWith('audio/')) {
                return <audio src={mediaUrl} controls className="w-full mt-4" />;
            }
        }
        return <div className="text-center py-10 text-dark-400">Ready for download</div>;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-dark-800 rounded-2xl max-w-2xl w-full border border-dark-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
                {/* Header - only show on input and assets states */}
                {(revealState === 'input' || revealState === 'assets') && (
                    <div className="flex justify-between items-center p-6 border-b border-dark-700">
                        <h2 className="text-xl font-bold text-white">
                            {revealState === 'input' ? '🔐 Claim Legacy Vault' : `🔓 ${fileName}`}
                        </h2>
                        <button onClick={closeModal} className="text-dark-400 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-6">
                    <AnimatePresence mode="wait">
                        {/* INPUT STATE */}
                        {revealState === 'input' && (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* Safe Preview */}
                                <div className="mb-8">
                                    <VaultSafe state="locked" />

                                    {/* C.1 Timeline Visualization */}
                                    <div className="mt-8">
                                        <VaultTimeline
                                            createdAt={getCreatedDate(vault.vaultSeed)}
                                            releasedAt={new Date((vault.lastCheckIn.toNumber() + vault.timeInterval.toNumber()) * 1000)}
                                            senderAddress={vault.owner.toBase58()}
                                            isReleased={vault.isReleased}
                                        />
                                    </div>
                                </div>

                                {/* Gasless Claim Indicator */}
                                {isGaslessEligible && (
                                    <div className="mb-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                                <span className="text-xl">⚡</span>
                                            </div>
                                            <div>
                                                <p className="text-amber-400 font-medium">Premium Vault</p>
                                                <p className="text-dark-400 text-sm">Gas fees are pre-paid. Claim for free!</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Loading Metadata */}
                                {loadingMetadata && (
                                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                                        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-dark-400 text-sm">Fetching vault security data...</p>
                                    </div>
                                )}

                                {/* Encryption Mode Info - Only show when loaded */}
                                {!loadingMetadata && (
                                    <div className="mb-6 animate-fade-in">
                                        {encryptionMode === 'wallet' ? (
                                            <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-6 text-center">
                                                <div className="text-4xl mb-4 bg-primary-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto">🔑</div>
                                                <h3 className="text-xl font-bold text-white mb-2">Wallet Protected</h3>
                                                <p className="text-primary-200">
                                                    This vault is secured by your wallet address.
                                                </p>
                                                <div className="mt-4 inline-block px-3 py-1 bg-dark-900/50 rounded-full text-xs font-mono text-dark-300">
                                                    {truncateAddress(publicKey ? publicKey.toBase58() : '...')}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="text-center mb-6">
                                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-dark-800 border border-dark-700 mb-3">
                                                        <span className="text-2xl">🔒</span>
                                                    </div>
                                                    <h3 className="text-lg font-medium text-white">Enter Password</h3>
                                                    <p className="text-dark-400 text-sm">
                                                        The owner set a password for this vault.
                                                    </p>
                                                </div>

                                                <div className="relative">
                                                    <input
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleClaim()}
                                                        className="w-full bg-dark-900/80 border border-dark-600 rounded-xl px-4 py-4 text-center text-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder:text-dark-600"
                                                        placeholder="••••••••••••"
                                                        autoFocus
                                                    />
                                                </div>

                                                {/* Password Hint Display */}
                                                {ipfsData?.metadata?.hint && (
                                                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 text-center">
                                                        <span className="text-xs text-yellow-500/70 font-bold uppercase tracking-wider block mb-1">
                                                            💡 Hint
                                                        </span>
                                                        <p className="text-yellow-200/90 text-sm font-medium">
                                                            &quot;{ipfsData.metadata.hint}&quot;
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Error */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 mb-6 text-red-400 text-sm"
                                    >
                                        ⚠️ {error}
                                    </motion.div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button onClick={closeModal} className="flex-1 btn-secondary">
                                        Cancel
                                    </button>
                                    <button onClick={handleClaim} className="flex-1 btn-primary">
                                        {encryptionMode === 'wallet' ? '🔓 Unlock with Wallet' : '🔓 Unlock Vault'}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* UNLOCKING STATE */}
                        {revealState === 'unlocking' && (
                            <motion.div
                                key="unlocking"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-8"
                            >
                                <VaultSafe state={isDecrypting ? 'unlocking' : 'open'} />
                                <motion.p
                                    className="mt-6 text-primary-400 font-mono text-sm uppercase tracking-wider"
                                    animate={{ opacity: [1, 0.5, 1] }}
                                    transition={{ duration: 1, repeat: isDecrypting ? Infinity : 0 }}
                                >
                                    {isDecrypting ? 'DECRYPTING VAULT...' : 'ACCESS GRANTED'}
                                </motion.p>
                            </motion.div>
                        )}

                        {/* MESSAGE STATE (Typewriter for text content) */}
                        {revealState === 'message' && (
                            <motion.div
                                key="message"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center"
                            >
                                {/* Header */}
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6"
                                >
                                    <div className="text-4xl mb-3">💌</div>
                                    <h3 className="text-lg font-light text-dark-300 italic">
                                        A message awaits you...
                                    </h3>
                                </motion.div>

                                {/* Message Box */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-dark-900/80 backdrop-blur-md border border-dark-600 rounded-2xl p-6 mb-6 min-h-[150px] max-h-[250px] overflow-auto cursor-pointer text-left"
                                    onClick={skipTypewriter}
                                >
                                    <p className="text-white font-light leading-relaxed whitespace-pre-wrap">
                                        {displayedText}
                                        {!showContinue && (
                                            <motion.span
                                                animate={{ opacity: [1, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity }}
                                                className="inline-block w-0.5 h-5 bg-primary-400 ml-1 align-middle"
                                            />
                                        )}
                                    </p>
                                </motion.div>

                                {/* Continue Button */}
                                <AnimatePresence>
                                    {showContinue && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-3"
                                        >
                                            <button onClick={handleContinueToAssets} className="btn-primary px-8 py-3">
                                                View Full Content →
                                            </button>
                                            <p className="text-xs text-dark-500">
                                                Click message to skip animation
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {/* ASSETS STATE */}
                        {revealState === 'assets' && (
                            <motion.div
                                key="assets"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* Unlocked Badge */}
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex justify-center mb-6"
                                >
                                    <div className="inline-flex items-center gap-2 bg-safe-green/10 text-safe-green px-4 py-2 rounded-full text-sm">
                                        <span className="w-2 h-2 rounded-full bg-safe-green animate-pulse" />
                                        VAULT UNLOCKED
                                    </div>
                                </motion.div>

                                {/* Content Display */}
                                {bundleItems ? (
                                    <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700 mb-6 max-h-[400px] overflow-auto">
                                        <VaultContentEditor
                                            items={bundleItems}
                                            onItemsChange={() => { }}
                                            readOnly={true}
                                        />
                                    </div>
                                ) : (
                                    /* Asset Card (Legacy Single File) */
                                    <AssetCard
                                        fileName={fileName}
                                        fileType={fileType}
                                        onDownload={downloadFile}
                                        index={0}
                                    >
                                        {renderContentPreview()}
                                    </AssetCard>
                                )}

                                {/* Vault Closed Success */}
                                {vaultClosed && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-6 bg-safe-green/10 border border-safe-green/50 rounded-xl p-4 text-safe-green text-sm text-center"
                                    >
                                        ✅ Vault closed! Rent transferred to your wallet.
                                    </motion.div>
                                )}

                                {/* Error */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mt-4 bg-red-500/10 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                {/* Actions */}
                                <div className="flex flex-col gap-3 mt-6">
                                    <div className="flex gap-3">
                                        <button onClick={downloadFile} className="flex-1 btn-primary">
                                            ⬇️ Download Data
                                        </button>
                                    </div>

                                    {/* T.3 Unified Claim Options */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Claim SOL */}
                                        {vault.lockedLamports && new BN(vault.lockedLamports).gt(new BN(0)) && (
                                            <button
                                                onClick={handleClaimSol}
                                                disabled={isClaimingSol || solClaimed || vaultClosed}
                                                className={`btn-secondary text-sm ${solClaimed ? 'bg-green-500/10 text-green-400 border-green-500/50' : ''}`}
                                            >
                                                {isClaimingSol ? 'Claiming SOL...' : solClaimed ? 'SOL Claimed ✅' : `Claim ${(new BN(vault.lockedLamports).toNumber() / 1e9).toFixed(2)} SOL`}
                                            </button>
                                        )}

                                        {/* Claim Tokens */}
                                        {vault.lockedTokens && new BN(vault.lockedTokens).gt(new BN(0)) && (
                                            <button
                                                onClick={handleClaimTokens}
                                                disabled={isClaimingTokens || tokensClaimed || vaultClosed}
                                                className={`btn-secondary text-sm ${tokensClaimed ? 'bg-green-500/10 text-green-400 border-green-500/50' : ''}`}
                                            >
                                                {isClaimingTokens ? 'Claiming...' : tokensClaimed ? 'Tokens Claimed ✅' : `Claim Tokens`}
                                            </button>
                                        )}
                                    </div>

                                    {!vaultClosed && (
                                        <button
                                            onClick={handleClaimAndClose}
                                            disabled={isClosing || !canClose}
                                            className={`w-full btn-secondary disabled:opacity-50 text-sm ${canClose
                                                    ? 'text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/10'
                                                    : 'text-dark-500 border-dark-600 cursor-not-allowed'
                                                }`}
                                            title={!canClose ? (!isExpiredOrReleased ? 'Vault must be expired or released to close' : 'Only the recipient can close this vault') : undefined}
                                        >
                                            {isClosing ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
                                                    Closing...
                                                </span>
                                            ) : (
                                                '🗑️ Close Vault & Reclaim Rent'
                                            )}
                                        </button>
                                    )}

                                    <button onClick={closeModal} className="text-dark-400 text-sm hover:text-white mt-2">
                                        Close Window
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div >
            </motion.div >
        </div >
    );
}

function truncateAddress(address: string): string {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
