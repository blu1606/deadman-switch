'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { motion, AnimatePresence } from 'framer-motion';
import { unwrapKeyWithPassword, unwrapKeyWithWallet, WrappedKeyData, WalletKeyData, EncryptedData } from '@/utils/crypto';
import { fetchFromIPFS } from '@/utils/ipfs';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import VaultSafe from './VaultSafe';
import AssetCard from './AssetCard';

interface ClaimModalProps {
    vault: any;
    onClose: () => void;
    onSuccess: () => void;
}

type RevealState = 'input' | 'unlocking' | 'message' | 'assets';

export default function ClaimModal({ vault, onClose, onSuccess }: ClaimModalProps) {
    const { publicKey, signTransaction, signAllTransactions } = useWallet();
    const { connection } = useConnection();

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
    const [vaultClosed, setVaultClosed] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Typewriter State
    const [displayedText, setDisplayedText] = useState('');
    const [showContinue, setShowContinue] = useState(false);

    // Detect encryption mode
    useEffect(() => {
        if (vault?.encryptedKey) {
            setEncryptionMode(vault.encryptedKey.startsWith('wallet:') ? 'wallet' : 'password');
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
            const encryptedBlob = await fetchFromIPFS(vault.ipfsCid);
            const packageText = await encryptedBlob.text();
            const pkg = JSON.parse(packageText);

            let vaultKey;

            if (pkg.version === 3 && pkg.mode === 'wallet' && pkg.walletKey) {
                const walletKeyData: WalletKeyData = pkg.walletKey;
                vaultKey = await unwrapKeyWithWallet(walletKeyData, publicKey.toBase58());
            } else if (pkg.version === 2 && pkg.keyWrapper) {
                const wrapper: WrappedKeyData = pkg.keyWrapper;
                vaultKey = await unwrapKeyWithPassword(wrapper, password);
            } else {
                throw new Error('Unsupported vault format.');
            }

            const encryptedFile: EncryptedData = pkg.encryptedFile;
            const decryptedBlob = await import('@/utils/crypto').then(m => m.decryptFile(encryptedFile, vaultKey));

            setFileType(pkg.metadata.fileType);
            setFileName(pkg.metadata.fileName);
            setDownloadBlob(decryptedBlob);

            if (pkg.metadata.fileType.startsWith('text/')) {
                const text = await decryptedBlob.text();
                setDecryptedText(text);
            } else {
                const url = URL.createObjectURL(decryptedBlob);
                setMediaUrl(url);
            }

            setIsDecrypting(false);

            // Delay before showing content - let safe animation play
            setTimeout(() => {
                if (pkg.metadata.fileType.startsWith('text/')) {
                    setRevealState('message'); // Show typewriter for text
                } else {
                    setRevealState('assets'); // Go directly to assets for media
                }
            }, 2500);

            onSuccess();
        } catch (err: any) {
            console.error('Claim failed:', err);
            setIsDecrypting(false);
            setRevealState('input');
            setError(err.message || 'Decryption failed. Check your wallet or password.');
        }
    };

    const handleClaimAndClose = async () => {
        if (!publicKey || !signTransaction || !signAllTransactions) {
            setError('Wallet not connected');
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
            const program = new Program(idl as any, provider);

            await (program.methods as any)
                .claimAndClose()
                .accounts({
                    vault: vault.publicKey,
                    recipient: publicKey,
                })
                .rpc();

            setVaultClosed(true);
        } catch (err: any) {
            console.error('Close failed:', err);
            setError(err.message || 'Failed to close vault');
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
                return <img src={mediaUrl} alt="Decrypted" className="max-w-full max-h-[300px] mx-auto rounded-lg" />;
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
                                </div>

                                {/* Encryption Mode Info */}
                                <div className="mb-6">
                                    {encryptionMode === 'wallet' ? (
                                        <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4 text-center">
                                            <div className="text-3xl mb-2">🔑</div>
                                            <p className="text-primary-400 font-medium">Wallet-Protected Vault</p>
                                            <p className="text-dark-400 text-sm mt-1">
                                                No password needed. Your wallet will decrypt automatically.
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-xs font-medium text-dark-300 mb-2 uppercase tracking-wider">
                                                Vault Password
                                            </label>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleClaim()}
                                                className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                                placeholder="Enter password to unlock..."
                                            />
                                        </div>
                                    )}
                                </div>

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

                                {/* Asset Card */}
                                <AssetCard
                                    fileName={fileName}
                                    fileType={fileType}
                                    onDownload={downloadFile}
                                    index={0}
                                >
                                    {renderContentPreview()}
                                </AssetCard>

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
                                <div className="flex gap-3 mt-6">
                                    <button onClick={downloadFile} className="flex-1 btn-primary">
                                        ⬇️ Download
                                    </button>

                                    {!vaultClosed && (
                                        <button
                                            onClick={handleClaimAndClose}
                                            disabled={isClosing}
                                            className="flex-1 btn-secondary text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/10 disabled:opacity-50"
                                        >
                                            {isClosing ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
                                                    Claiming...
                                                </span>
                                            ) : (
                                                '💰 Claim Rent'
                                            )}
                                        </button>
                                    )}

                                    <button onClick={closeModal} className="btn-secondary px-4">
                                        ✕
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
