'use client';

import { FC } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import AssetCard from '../AssetCard';
import VaultContentEditor from '@/components/vault/VaultContentEditor';
import { VaultItem } from '@/types/vaultBundle';
import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

interface Props {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vault: any;
    bundleItems: VaultItem[] | null;
    fileName: string;
    fileType: string;
    mediaUrl: string | null;
    decryptedText: string | null;
    downloadFile: () => void;
    vaultClosed: boolean;
    canClose: boolean;
    isClosing: boolean;
    handleClaimAndClose: () => void;
    // Actions
    isClaimingSol: boolean;
    solClaimed: boolean;
    handleClaimSol: () => void;
    isClaimingTokens: boolean;
    tokensClaimed: boolean;
    handleClaimTokens: () => void;
    publicKey: PublicKey | null;
}

export const ClaimAssetsState: FC<Props> = ({
    vault,
    bundleItems,
    fileName,
    fileType,
    mediaUrl,
    decryptedText,
    downloadFile,
    vaultClosed,
    canClose,
    isClosing,
    handleClaimAndClose,
    isClaimingSol,
    solClaimed,
    handleClaimSol,
    isClaimingTokens,
    tokensClaimed,
    handleClaimTokens,
    publicKey
}) => {
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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
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

            {bundleItems ? (
                <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700 mb-6 max-h-[400px] overflow-auto">
                    <VaultContentEditor
                        items={bundleItems}
                        onItemsChange={() => { }}
                        readOnly={true}
                    />
                </div>
            ) : (
                <AssetCard
                    fileName={fileName}
                    fileType={fileType}
                    onDownload={downloadFile}
                    index={0}
                >
                    {renderContentPreview()}
                </AssetCard>
            )}

            {vaultClosed && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 bg-safe-green/10 border border-safe-green/50 rounded-xl p-4 text-safe-green text-sm text-center"
                >
                    ✅ Vault closed! Rent transferred to your wallet.
                </motion.div>
            )}

            <div className="flex flex-col gap-3 mt-6">
                <div className="flex gap-3">
                    <button onClick={downloadFile} className="flex-1 btn-primary">
                        ⬇️ Download Data
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {vault.lockedLamports && new BN(vault.lockedLamports).gt(new BN(0)) && (
                        <button
                            onClick={handleClaimSol}
                            disabled={isClaimingSol || solClaimed || vaultClosed || !publicKey}
                            className={`btn-secondary text-sm ${solClaimed ? 'bg-green-500/10 text-green-400 border-green-500/50' : ''} ${!publicKey ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isClaimingSol ? 'Claiming SOL...' : solClaimed ? 'SOL Claimed ✅' : `Claim ${(new BN(vault.lockedLamports).toNumber() / 1e9).toFixed(2)} SOL`}
                        </button>
                    )}

                    {vault.lockedTokens && new BN(vault.lockedTokens).gt(new BN(0)) && (
                        <button
                            onClick={handleClaimTokens}
                            disabled={isClaimingTokens || tokensClaimed || vaultClosed || !publicKey}
                            className={`btn-secondary text-sm ${tokensClaimed ? 'bg-green-500/10 text-green-400 border-green-500/50' : ''} ${!publicKey ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            </div>
        </motion.div>
    );
};
