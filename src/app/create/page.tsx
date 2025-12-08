'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import StepUploadSecret from '@/components/wizard/StepUploadSecret';
import StepSetRecipient from '@/components/wizard/StepSetRecipient';
import StepSetInterval from '@/components/wizard/StepSetInterval';
import StepConfirm from '@/components/wizard/StepConfirm';
import WalletButton from '@/components/wallet/WalletButton';

export interface VaultFormData {
    // Step 1: File
    file: File | null;
    encryptedBlob: Blob | null;
    aesKeyBase64: string;

    // Encryption mode
    encryptionMode: 'password' | 'wallet';
    password?: string; // Only for password mode

    // Step 2: Recipient
    recipientAddress: string;
    recipientEmail: string;

    // Step 3: Interval
    timeInterval: number; // seconds
}

const STEPS = [
    { id: 1, name: 'Upload Secret', description: 'Encrypt your file' },
    { id: 2, name: 'Set Recipient', description: 'Who can claim' },
    { id: 3, name: 'Set Interval', description: 'Check-in period' },
    { id: 4, name: 'Confirm', description: 'Review & create' },
];

export default function CreateVaultPage() {
    const { connected } = useWallet();
    const router = useRouter();

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<VaultFormData>({
        file: null,
        encryptedBlob: null,
        aesKeyBase64: '',
        encryptionMode: 'wallet', // Default to wallet mode (no password needed)
        recipientAddress: '',
        recipientEmail: '',
        timeInterval: 30 * 24 * 60 * 60, // 30 days default
    });

    const updateFormData = useCallback((updates: Partial<VaultFormData>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
    }, []);

    const nextStep = useCallback(() => {
        setCurrentStep((prev) => Math.min(prev + 1, 4));
    }, []);

    const prevStep = useCallback(() => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    }, []);

    const handleSuccess = useCallback(() => {
        router.push('/dashboard');
    }, [router]);

    if (!connected) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="card text-center max-w-md">
                    <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
                    <p className="text-dark-400 mb-6">
                        Please connect your wallet to create a vault.
                    </p>
                    <WalletButton />
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen pt-20 pb-10 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Create Your Vault</h1>
                    <p className="text-dark-400">
                        Secure your digital legacy in 4 simple steps
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold
                      transition-all duration-300
                      ${currentStep > step.id
                                                ? 'bg-green-500 text-white'
                                                : currentStep === step.id
                                                    ? 'bg-primary-600 text-white ring-4 ring-primary-600/30'
                                                    : 'bg-dark-700 text-dark-400'
                                            }
                    `}
                                    >
                                        {currentStep > step.id ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            step.id
                                        )}
                                    </div>
                                    <span className={`text-xs mt-2 ${currentStep >= step.id ? 'text-white' : 'text-dark-500'}`}>
                                        {step.name}
                                    </span>
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div
                                        className={`
                      h-0.5 w-12 sm:w-20 mx-2
                      ${currentStep > step.id ? 'bg-green-500' : 'bg-dark-700'}
                    `}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <div className="card min-h-[400px]">
                    <div key={currentStep} className="animate-fade-in">
                        {currentStep === 1 && (
                            <StepUploadSecret
                                formData={formData}
                                updateFormData={updateFormData}
                                onNext={nextStep}
                            />
                        )}
                        {currentStep === 2 && (
                            <StepSetRecipient
                                formData={formData}
                                updateFormData={updateFormData}
                                onNext={nextStep}
                                onBack={prevStep}
                            />
                        )}
                        {currentStep === 3 && (
                            <StepSetInterval
                                formData={formData}
                                updateFormData={updateFormData}
                                onNext={nextStep}
                                onBack={prevStep}
                            />
                        )}
                        {currentStep === 4 && (
                            <StepConfirm
                                formData={formData}
                                onBack={prevStep}
                                onSuccess={handleSuccess}
                            />
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
