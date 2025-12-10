'use client';

import { FC } from 'react';
import { SecretType } from '@/utils/safetyScanner';

interface SecurityAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    secretType: SecretType;
    secretName: string;
    suggestion: string;
    fieldName: string;
    onMoveToSecret?: () => void;
    onIgnore: () => void;
}

const SecurityAlertModal: FC<SecurityAlertModalProps> = ({
    isOpen,
    onClose,
    secretType,
    secretName,
    suggestion,
    fieldName,
    onMoveToSecret,
    onIgnore
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (secretType) {
            case 'solana_key':
                return '🔐';
            case 'evm_key':
                return '🔑';
            case 'seed_phrase':
                return '📜';
            case 'credit_card':
                return '💳';
            default:
                return '🚨';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-dark-800 rounded-xl max-w-md w-full p-6 border-2 border-red-500/50 shadow-2xl shadow-red-500/20 animate-scale-in">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-2xl">
                        🚨
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-red-400">Security Warning</h2>
                        <p className="text-dark-400 text-sm">Potential secret detected</p>
                    </div>
                </div>

                {/* Detection Info */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{getIcon()}</span>
                        <span className="font-semibold text-white">{secretName}</span>
                    </div>
                    <p className="text-dark-300 text-sm">
                        Detected in: <span className="text-red-400 font-medium">{fieldName}</span>
                    </p>
                </div>

                {/* Warning Message */}
                <div className="bg-dark-900/50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-dark-300 leading-relaxed">
                        <span className="text-yellow-400 font-semibold">⚠️ Why is this dangerous?</span>
                        <br />
                        The <strong>{fieldName}</strong> field is <span className="text-red-400">NOT encrypted</span> and
                        can be seen by anyone. {suggestion}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    {onMoveToSecret && (
                        <button
                            onClick={() => {
                                onMoveToSecret();
                                onClose();
                            }}
                            className="flex-1 bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 rounded-xl transition-all"
                        >
                            🔒 Move to Secret
                        </button>
                    )}
                    <button
                        onClick={() => {
                            onIgnore();
                            onClose();
                        }}
                        className={`${onMoveToSecret ? '' : 'flex-1'} px-4 py-3 bg-dark-700 hover:bg-dark-600 text-dark-300 rounded-xl transition-all text-sm`}
                    >
                        I understand the risk
                    </button>
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-dark-500 hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default SecurityAlertModal;
