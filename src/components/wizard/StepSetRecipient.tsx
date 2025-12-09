'use client';

import { FC, useState, useCallback, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { VaultFormData } from '@/app/create/page';

interface Props {
    formData: VaultFormData;
    updateFormData: (updates: Partial<VaultFormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

const StepSetRecipient: FC<Props> = ({ formData, updateFormData, onNext, onBack }) => {
    const { publicKey: ownerWallet } = useWallet();
    const [addressError, setAddressError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [useMyWallet, setUseMyWallet] = useState(false);

    // When toggle is enabled, auto-fill owner wallet
    useEffect(() => {
        if (useMyWallet && ownerWallet) {
            updateFormData({ recipientAddress: ownerWallet.toBase58() });
            setAddressError(null);
        }
    }, [useMyWallet, ownerWallet, updateFormData]);

    const validateAddress = useCallback((address: string): boolean => {
        if (!address) {
            setAddressError('Recipient address is required');
            return false;
        }

        try {
            new PublicKey(address);
            setAddressError(null);
            return true;
        } catch {
            setAddressError('Invalid Solana address');
            return false;
        }
    }, []);

    const validateEmail = useCallback((email: string): boolean => {
        if (!email) {
            // Email is optional
            setEmailError(null);
            return true;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('Invalid email format');
            return false;
        }

        setEmailError(null);
        return true;
    }, []);

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        updateFormData({ recipientAddress: value });
        if (value) validateAddress(value);
        // If user manually edits, disable the toggle
        if (useMyWallet && ownerWallet && value !== ownerWallet.toBase58()) {
            setUseMyWallet(false);
        }
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        updateFormData({ recipientEmail: value });
        if (value) validateEmail(value);
    };

    const handleToggle = () => {
        setUseMyWallet(!useMyWallet);
        if (!useMyWallet) {
            // Just toggling on - address will be set by useEffect
        } else {
            // Toggling off - clear the address
            updateFormData({ recipientAddress: '' });
        }
    };

    const handleNext = () => {
        const isAddressValid = validateAddress(formData.recipientAddress);
        const isEmailValid = validateEmail(formData.recipientEmail);

        if (isAddressValid && isEmailValid) {
            onNext();
        }
    };

    const canProceed = formData.recipientAddress && !addressError && !emailError;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-2">Set Recipient</h2>
                <p className="text-dark-400 text-sm">
                    Who should receive access to your vault when it&apos;s released?
                </p>
            </div>

            {/* "I don't have their address" Toggle */}
            <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-white font-medium">I don&apos;t have their address yet</p>
                        <p className="text-xs text-dark-400 mt-0.5">Use your own wallet as placeholder. Update it later in settings.</p>
                    </div>
                    <button
                        onClick={handleToggle}
                        className={`w-12 h-6 rounded-full transition-colors relative ${useMyWallet ? 'bg-primary-600' : 'bg-dark-600'}`}
                        type="button"
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${useMyWallet ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>
            </div>

            {/* Recipient Address */}
            <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                    Recipient Wallet Address *
                </label>
                <input
                    type="text"
                    value={formData.recipientAddress}
                    onChange={handleAddressChange}
                    placeholder="Enter Solana wallet address"
                    disabled={useMyWallet}
                    className={`
            w-full bg-dark-900 border rounded-lg px-4 py-3 text-white
            placeholder:text-dark-500 focus:outline-none focus:ring-2
            ${useMyWallet ? 'opacity-60 cursor-not-allowed' : ''}
            ${addressError
                            ? 'border-red-500 focus:ring-red-500/50'
                            : 'border-dark-600 focus:ring-primary-500/50 focus:border-primary-500'
                        }
          `}
                />
                {addressError && (
                    <p className="text-red-400 text-sm mt-1">{addressError}</p>
                )}
                {useMyWallet && (
                    <p className="text-yellow-500 text-xs mt-1">
                        ⚠️ Using your own wallet. Remember to update the recipient in vault settings before release!
                    </p>
                )}
                {!useMyWallet && (
                    <p className="text-dark-500 text-xs mt-1">
                        This wallet will be able to claim and decrypt your vault contents.
                    </p>
                )}
            </div>

            {/* Recipient Email (Optional) */}
            <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                    Recipient Email (Optional)
                </label>
                <input
                    type="email"
                    value={formData.recipientEmail}
                    onChange={handleEmailChange}
                    placeholder="recipient@example.com"
                    className={`
            w-full bg-dark-900 border rounded-lg px-4 py-3 text-white
            placeholder:text-dark-500 focus:outline-none focus:ring-2
            ${emailError
                            ? 'border-red-500 focus:ring-red-500/50'
                            : 'border-dark-600 focus:ring-primary-500/50 focus:border-primary-500'
                        }
          `}
                />
                {emailError && (
                    <p className="text-red-400 text-sm mt-1">{emailError}</p>
                )}
                <p className="text-dark-500 text-xs mt-1">
                    We&apos;ll notify them when the vault is released (Phase 4 feature).
                </p>
            </div>

            {/* Info box */}
            <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-dark-300">
                        <p className="font-medium text-primary-400 mb-1">How does this work?</p>
                        <p>
                            The recipient can only claim your vault after the check-in timer expires.
                            They&apos;ll need the decryption key you saved earlier to access the contents.
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
                <button onClick={onBack} className="btn-secondary">
                    ← Back
                </button>
                <button
                    onClick={handleNext}
                    disabled={!canProceed}
                    className={`btn-primary ${!canProceed ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Next: Set Interval →
                </button>
            </div>
        </div>
    );
};

export default StepSetRecipient;

