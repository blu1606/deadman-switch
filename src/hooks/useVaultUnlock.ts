'use client';

import { useState, useEffect } from 'react';
import { useUnifiedWallet as useWallet } from '@/hooks/useUnifiedWallet';
import { fetchFromIPFS } from '@/utils/ipfs';
import { unwrapKeyWithPassword, unwrapKeyWithWallet, WrappedKeyData, WalletKeyData, EncryptedData } from '@/utils/crypto';
import { VaultItem } from '@/types/vaultBundle';
import { useClaimedVaults } from '@/hooks/useClaimedVaults';

export type RevealState = 'input' | 'unlocking' | 'message' | 'assets';

export interface UseVaultUnlockProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vault: any;
    onSuccess?: () => void;
}

export const useVaultUnlock = ({ vault, onSuccess }: UseVaultUnlockProps) => {
    const { publicKey } = useWallet();
    const { addVault } = useClaimedVaults();

    const [password, setPassword] = useState('');
    const [encryptionMode, setEncryptionMode] = useState<'password' | 'wallet' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [revealState, setRevealState] = useState<RevealState>('input');
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [decryptedText, setDecryptedText] = useState<string | null>(null);
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [fileType, setFileType] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);
    const [bundleItems, setBundleItems] = useState<VaultItem[] | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [ipfsData, setIpfsData] = useState<any | null>(null);
    const [loadingMetadata, setLoadingMetadata] = useState(false);

    useEffect(() => {
        if (vault?.encryptedKey) {
            setEncryptionMode(vault.encryptedKey.startsWith('wallet:') ? 'wallet' : 'password');
        }

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
                        setLoadingMetadata(false);
                    });
            });
        }
    }, [vault]);

    const unlockVault = async () => {
        if (encryptionMode === 'password' && !password) {
            setError('Please enter password');
            return;
        }
        if (!publicKey && encryptionMode === 'wallet') {
            setError('Wallet required for this vault');
            return;
        }

        setRevealState('unlocking');
        setIsDecrypting(true);
        setError(null);

        try {
            let pkg = ipfsData;
            if (!pkg) {
                const encryptedBlob = await fetchFromIPFS(vault.ipfsCid);
                const packageText = await encryptedBlob.text();
                pkg = JSON.parse(packageText);
            }

            let vaultKey;
            if (pkg.version === 3 && pkg.mode === 'wallet' && pkg.walletKey) {
                const walletKeyData: WalletKeyData = pkg.walletKey;
                vaultKey = await unwrapKeyWithWallet(walletKeyData, publicKey!.toBase58());
            } else if (pkg.version === 2 && pkg.keyWrapper) {
                const wrapper: WrappedKeyData = pkg.keyWrapper;
                vaultKey = await unwrapKeyWithPassword(wrapper, password);
            } else {
                throw new Error('Unsupported or unknown vault format.');
            }

            const encryptedFile: EncryptedData = pkg.encryptedFile;
            const decryptedBlob = await import('@/utils/crypto').then(m => m.decryptFile(encryptedFile, vaultKey));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setFileType((pkg as any).metadata.fileType);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setFileName((pkg as any).metadata.fileName);

            if (pkg.metadata.fileName === 'vault_bundle.json') {
                const bundleText = await decryptedBlob.text();
                const bundle = JSON.parse(bundleText);
                setBundleItems(bundle.items);
                setDownloadBlob(decryptedBlob);
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

            setTimeout(() => {
                if (pkg.metadata.fileName === 'vault_bundle.json') {
                    setRevealState('assets');
                } else if (pkg.metadata.fileType.startsWith('text/')) {
                    setRevealState('message');
                } else {
                    setRevealState('assets');
                }
            }, 2500);

            // Archive
            const summaryTypes = pkg.metadata.fileName === 'vault_bundle.json' && bundleItems
                ? Array.from(new Set(bundleItems.map(i => i.type)))
                : [pkg.metadata.fileType.startsWith('text') ? 'text' : pkg.metadata.fileType.startsWith('image') ? 'image' : 'file'];

            addVault({
                address: vault.publicKey.toBase58(),
                name: vault.name || 'Untitled Vault',
                claimedAt: Date.now(),
                senderAddress: vault.owner.toBase58(),
                contentSummary: {
                    itemCount: pkg.metadata.fileName === 'vault_bundle.json' && bundleItems ? bundleItems.length : 1,
                    totalSize: pkg.metadata.size || 0,
                    types: summaryTypes as string[]
                },
                ipfsCid: vault.ipfsCid,
                encryptedKey: vault.encryptedKey,
                vaultSeed: vault.vaultSeed.toString('hex')
            });

            onSuccess?.();
        } catch (err: unknown) {
            const error = err as Error;
            console.error('Claim failed:', error);
            setIsDecrypting(false);
            setRevealState('input');
            setError(error.message || 'Decryption failed. Check your wallet or password.');
        }
    };

    return {
        revealState,
        setRevealState,
        isDecrypting,
        unlockVault,
        password,
        setPassword,
        encryptionMode,
        error,
        decryptedText,
        mediaUrl,
        fileType,
        fileName,
        downloadBlob,
        bundleItems,
        ipfsData,
        loadingMetadata
    };
};
