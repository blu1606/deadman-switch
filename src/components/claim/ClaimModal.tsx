'use client';

import { useState } from 'react';
import { useUnifiedWallet as useWallet } from '@/hooks/useUnifiedWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { useVaultUnlock } from '@/hooks/useVaultUnlock';
import { useVaultActions } from '@/hooks/useVaultActions';
import { ClaimInputState } from './sub/ClaimInputState';
import { ClaimUnlockingState } from './sub/ClaimUnlockingState';
import { ClaimMessageState } from './sub/ClaimMessageState';
import { ClaimAssetsState } from './sub/ClaimAssetsState';

interface ClaimModalProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vault: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ClaimModal({ vault, onClose, onSuccess }: ClaimModalProps) {
    const { publicKey } = useWallet();
    const {
        revealState,
        setRevealState,
        isDecrypting,
        unlockVault,
        password,
        setPassword,
        encryptionMode,
        error: unlockError,
        decryptedText,
        mediaUrl,
        fileType,
        fileName,
        downloadBlob,
        bundleItems,
        ipfsData,
        loadingMetadata
    } = useVaultUnlock({ vault, onSuccess });

    const {
        claimSol,
        claimTokens,
        claimAndClose,
        actionLoading,
        actionError
    } = useVaultActions();

    const [solClaimed, setSolClaimed] = useState(false);
    const [tokensClaimed, setTokensClaimed] = useState(false);
    const [vaultClosed, setVaultClosed] = useState(false);

    const handleClaimSol = async () => {
        try {
            await claimSol(vault);
            setSolClaimed(true);
        } catch { }
    };

    const handleClaimTokens = async () => {
        try {
            await claimTokens(vault);
            setTokensClaimed(true);
        } catch { }
    };

    const handleClaimAndCloseLocal = async () => {
        try {
            await claimAndClose(vault);
            setVaultClosed(true);
        } catch { }
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

    // Calculate canClose
    const now = Math.floor(Date.now() / 1000);
    const expiryTime = vault.lastCheckIn.toNumber() + vault.timeInterval.toNumber();
    const isExpiredOrReleased = now > expiryTime || vault.isReleased;
    const isRecipient = publicKey?.toBase58() === vault.recipient.toBase58();
    const canClose = isExpiredOrReleased && isRecipient;

    const combinedError = unlockError || actionError;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-dark-800 rounded-2xl max-w-2xl w-full border border-dark-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
                {/* Header */}
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
                        {revealState === 'input' && (
                            <ClaimInputState
                                vault={vault}
                                publicKey={publicKey}
                                encryptionMode={encryptionMode}
                                password={password}
                                setPassword={setPassword}
                                error={combinedError}
                                loadingMetadata={loadingMetadata}
                                ipfsData={ipfsData}
                                onUnlock={unlockVault}
                                onClose={closeModal}
                            />
                        )}

                        {revealState === 'unlocking' && (
                            <ClaimUnlockingState isDecrypting={isDecrypting} />
                        )}

                        {revealState === 'message' && decryptedText && (
                            <ClaimMessageState
                                decryptedText={decryptedText}
                                onContinue={() => setRevealState('assets')}
                            />
                        )}

                        {revealState === 'assets' && (
                            <ClaimAssetsState
                                vault={vault}
                                bundleItems={bundleItems}
                                fileName={fileName}
                                fileType={fileType}
                                mediaUrl={mediaUrl}
                                decryptedText={decryptedText}
                                downloadFile={downloadFile}
                                vaultClosed={vaultClosed}
                                canClose={canClose}
                                isClosing={actionLoading}
                                handleClaimAndClose={handleClaimAndCloseLocal}
                                isClaimingSol={actionLoading}
                                solClaimed={solClaimed}
                                handleClaimSol={handleClaimSol}
                                isClaimingTokens={actionLoading}
                                tokensClaimed={tokensClaimed}
                                handleClaimTokens={handleClaimTokens}
                                publicKey={publicKey}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
