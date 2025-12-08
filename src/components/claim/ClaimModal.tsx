'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { unwrapKeyWithPassword, unwrapKeyWithWallet, WrappedKeyData, WalletKeyData, EncryptedData } from '@/utils/crypto';
import { fetchFromIPFS } from '@/utils/ipfs';
import { Program, AnchorProvider } from '@coral-xyz/anchor';

interface ClaimModalProps {
    vault: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ClaimModal({ vault, onClose, onSuccess }: ClaimModalProps) {
    const { publicKey, signTransaction, signAllTransactions } = useWallet();
    const { connection } = useConnection();

    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'fetching' | 'decrypting' | 'viewing' | 'closing' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [encryptionMode, setEncryptionMode] = useState<'password' | 'wallet' | null>(null);

    // Decrypted Content State
    const [decryptedText, setDecryptedText] = useState<string | null>(null);
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [fileType, setFileType] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);
    const [vaultClosed, setVaultClosed] = useState(false);

    // Detect encryption mode from on-chain data
    useEffect(() => {
        if (vault?.encryptedKey) {
            if (vault.encryptedKey.startsWith('wallet:')) {
                setEncryptionMode('wallet');
            } else {
                setEncryptionMode('password');
            }
        }
    }, [vault]);

    const handleClaim = async () => {
        if (encryptionMode === 'password' && !password) {
            setError('Please enter password');
            return;
        }

        if (!publicKey) {
            setError('Wallet not connected');
            return;
        }

        setStatus('fetching');
        setError(null);
        setDecryptedText(null);
        setMediaUrl(null);

        try {
            const encryptedBlob = await fetchFromIPFS(vault.ipfsCid);
            setStatus('decrypting');

            const packageText = await encryptedBlob.text();
            const pkg = JSON.parse(packageText);

            let vaultKey;

            // Handle wallet mode (version 3)
            if (pkg.version === 3 && pkg.mode === 'wallet' && pkg.walletKey) {
                const walletKeyData: WalletKeyData = pkg.walletKey;
                vaultKey = await unwrapKeyWithWallet(walletKeyData, publicKey.toBase58());
            }
            // Handle password mode (version 2)
            else if (pkg.version === 2 && pkg.keyWrapper) {
                const wrapper: WrappedKeyData = pkg.keyWrapper;
                vaultKey = await unwrapKeyWithPassword(wrapper, password);
            }
            else {
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

            setStatus('viewing');
            onSuccess();
        } catch (err: any) {
            console.error('Claim failed:', err);
            setStatus('error');
            setError(err.message || 'Decryption failed. Check your wallet or password.');
        }
    };

    const handleClaimAndClose = async () => {
        if (!publicKey || !signTransaction || !signAllTransactions) {
            setError('Wallet not connected');
            return;
        }

        setStatus('closing');
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
            setStatus('viewing');
        } catch (err: any) {
            console.error('Close failed:', err);
            setError(err.message || 'Failed to close vault');
            setStatus('viewing');
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

    const closeViewer = () => {
        if (mediaUrl) URL.revokeObjectURL(mediaUrl);
        setMediaUrl(null);
        setDecryptedText(null);
        setDownloadBlob(null);
        setStatus('idle');
        onClose();
    };

    // RENDER CONTENT VIEWER
    if (status === 'viewing' || status === 'closing') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                <div className="bg-dark-800 rounded-xl max-w-2xl w-full p-6 border border-dark-700 shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">🔓 Secret Revealed: {fileName}</h2>
                        <button onClick={closeViewer} className="text-dark-400 hover:text-white">✕</button>
                    </div>

                    <div className="flex-1 overflow-auto bg-dark-900 rounded-lg p-4 mb-4 border border-dark-600 min-h-[200px]">
                        {decryptedText !== null ? (
                            <pre className="whitespace-pre-wrap text-white font-mono text-sm">{decryptedText}</pre>
                        ) : mediaUrl ? (
                            fileType.startsWith('image/') ? (
                                <img src={mediaUrl} alt="Decrypted" className="max-w-full mx-auto" />
                            ) : fileType.startsWith('video/') ? (
                                <video src={mediaUrl} controls className="w-full" />
                            ) : fileType.startsWith('audio/') ? (
                                <audio src={mediaUrl} controls className="w-full mt-10" />
                            ) : (
                                <div className="text-center py-10 text-dark-400">
                                    Cannot preview. Please download.
                                </div>
                            )
                        ) : null}
                    </div>

                    {vaultClosed && (
                        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3 mb-4 text-green-400 text-sm">
                            ✅ Vault closed! Rent transferred to your wallet.
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-4 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 mt-auto">
                        <button onClick={downloadFile} className="btn-primary flex-1">⬇️ Download</button>

                        {!vaultClosed && (
                            <button
                                onClick={handleClaimAndClose}
                                disabled={status === 'closing'}
                                className="btn-secondary flex-1 text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/10"
                            >
                                {status === 'closing' ? 'Closing...' : '💰 Claim Rent'}
                            </button>
                        )}

                        <button onClick={closeViewer} className="btn-secondary">✕</button>
                    </div>
                </div>
            </div>
        );
    }

    // RENDER CLAIM INPUT (Password or Auto)
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-dark-800 rounded-xl max-w-md w-full p-6 border border-dark-700 shadow-2xl">
                <h2 className="text-xl font-bold mb-4">Claim Legacy Vault</h2>

                <div className="mb-6">
                    {encryptionMode === 'wallet' ? (
                        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 text-center">
                            <div className="text-3xl mb-2">🔑</div>
                            <p className="text-green-400 font-medium">Wallet-Protected Vault</p>
                            <p className="text-dark-400 text-sm mt-1">
                                No password needed. Your connected wallet will decrypt automatically.
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-dark-400 text-sm mb-4">
                                Enter the vault password to unlock.
                            </p>
                            <label className="block text-xs font-medium text-dark-300 mb-1">Vault Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                placeholder="Enter password..."
                                disabled={status !== 'idle' && status !== 'error'}
                            />
                        </>
                    )}
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-6 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={status !== 'idle' && status !== 'error'}
                        className="flex-1 btn-secondary"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleClaim}
                        disabled={status !== 'idle' && status !== 'error'}
                        className="flex-1 btn-primary disabled:opacity-50"
                    >
                        {status === 'idle' || status === 'error' ? (
                            encryptionMode === 'wallet' ? '🔓 Decrypt with Wallet' : '🔓 Unlock'
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {status === 'fetching' ? 'Downloading...' : 'Decrypting...'}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
