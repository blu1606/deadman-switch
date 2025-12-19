'use client';

import { FC, useState } from 'react';
import { VaultFormData } from '@/types/vaultForm';
import SecurityAlertModal from '@/components/ui/SecurityAlertModal';
import { useCreateVault } from '@/hooks/useCreateVault';
import { VaultSummaryCards } from './sub/VaultSummaryCards';
import { AssetLockForm } from './sub/AssetLockForm';
import { EmailNotificationsForm } from './sub/EmailNotificationsForm';
import { GuardianProtectionForm } from './sub/GuardianProtectionForm';

import { useSecurityScanner } from '@/hooks/useSecurityScanner';

interface Props {
    formData: VaultFormData;
    onBack: () => void;
    onSuccess: () => void;
}

const StepConfirm: FC<Props> = ({ formData, onBack, onSuccess }) => {
    const { createVault, status, error, ipfsCid, txSignature } = useCreateVault();
    const { securityAlert, scan, closeAlert, ignoreAlert } = useSecurityScanner();

    // Vault name state (10.1)
    const [vaultName, setVaultName] = useState(formData.vaultName || '');
    // email state
    const [ownerEmail, setOwnerEmail] = useState('');
    const [recipientEmail, setRecipientEmail] = useState('');
    // Locked SOL state
    const [lockedSol, setLockedSol] = useState<number>(0);
    // Guardian Protection state (11.1 Premium Feature)
    const [guardianEnabled, setGuardianEnabled] = useState(false);

    const handleVaultNameBlur = (value: string) => {
        scan(value);
    };

    const handleCreate = async () => {
        try {
            await createVault(formData, vaultName, lockedSol, ownerEmail, recipientEmail);
            setTimeout(onSuccess, 3000);
        } catch {
            // Error is handled by error state in useCreateVault
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-2">Review & Confirm</h2>
                <p className="text-dark-400 text-sm">
                    Review your vault settings before creating.
                </p>
            </div>

            {/* Vault Name Input - 10.1 */}
            <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
                <label className="block text-sm text-dark-400 mb-2">Vault Name (optional)</label>
                <input
                    type="text"
                    placeholder="My Vault"
                    maxLength={32}
                    value={vaultName}
                    onChange={(e) => setVaultName(e.target.value)}
                    onBlur={(e) => handleVaultNameBlur(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-dark-500 mt-1">Give your vault a memorable name</p>
            </div>

            {/* Summary Cards */}
            <VaultSummaryCards formData={formData} />

            {/* Lock SOL (T.1) */}
            <AssetLockForm lockedSol={lockedSol} setLockedSol={setLockedSol} />

            {/* Guardian Protection (11.1 Premium Feature) */}
            <GuardianProtectionForm
                guardianEnabled={guardianEnabled}
                setGuardianEnabled={setGuardianEnabled}
                aesKeyBase64={formData.aesKeyBase64 || ''}
                recipientEmail={recipientEmail}
            />

            {/* Bounty Hunter (Optional) */}
            <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    Release Bounty (Optional)
                </h3>
                <p className="text-sm text-dark-400">
                    Tip the network to auto-release your vault when the timer expires.
                    Higher bounty = faster, guaranteed trigger.
                </p>

                <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-600/50">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-white">Bounty Amount</span>
                        <span className="font-mono text-primary-400 text-lg">0.001 SOL</span>
                    </div>

                    <div className="relative h-2 bg-dark-700 rounded-full mb-2">
                        <div className="absolute left-0 top-0 h-full bg-primary-500 rounded-full w-[1%]" />
                    </div>

                    <div className="flex justify-between text-xs text-dark-500 font-mono">
                        <span>0.001 SOL</span>
                        <span>0.10 SOL</span>
                    </div>

                    <p className="text-xs text-dark-400 mt-3 text-center">
                        ≈ $0.20 (Covers 2x gas fee)
                    </p>
                </div>
            </div>

            {/* Email Notifications (Opt-in) */}
            <EmailNotificationsForm
                ownerEmail={ownerEmail}
                setOwnerEmail={setOwnerEmail}
                recipientEmail={recipientEmail}
                setRecipientEmail={setRecipientEmail}
            />

            {/* Status Messages */}
            {status === 'uploading' && (
                <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-primary-400">Uploading to IPFS...</span>
                    </div>
                </div>
            )}

            {status === 'confirming' && (
                <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        <div>
                            <span className="text-primary-400">Confirming transaction...</span>
                            {ipfsCid && (
                                <p className="text-dark-400 text-sm mt-1">IPFS CID: {ipfsCid.slice(0, 20)}...</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {status === 'success' && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-green-400 font-medium">Vault Created Successfully!</p>
                            {txSignature && (
                                <a
                                    href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-dark-400 text-sm hover:text-primary-400"
                                >
                                    View Transaction →
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {status === 'error' && error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
                <button
                    onClick={onBack}
                    disabled={status === 'uploading' || status === 'confirming'}
                    className={`btn-secondary ${status === 'uploading' || status === 'confirming' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    ← Back
                </button>
                <button
                    onClick={handleCreate}
                    disabled={status !== 'idle' && status !== 'error'}
                    className={`btn-primary ${status !== 'idle' && status !== 'error' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {status === 'idle' || status === 'error' ? '🔐 Create Vault' : 'Processing...'}
                </button>
            </div>

            {/* Anti-Doxxer: Security Alert Modal */}
            {securityAlert.result.detected && (
                <SecurityAlertModal
                    isOpen={securityAlert.isOpen}
                    onClose={closeAlert}
                    secretType={securityAlert.result.type!}
                    secretName={securityAlert.result.name!}
                    suggestion={securityAlert.result.suggestion!}
                    fieldName="Vault Name"
                    onIgnore={ignoreAlert}
                />
            )}
        </div>
    );
};

export default StepConfirm;
