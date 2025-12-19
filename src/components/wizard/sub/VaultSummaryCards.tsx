'use client';

import { FC } from 'react';
import { VaultFormData } from '@/types/vaultForm';

interface Props {
    formData: VaultFormData;
}

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatInterval = (seconds: number): string => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    if (days >= 365) return `${Math.floor(days / 365)} year`;
    if (days >= 30) return `${Math.floor(days / 30)} months`;
    return `${days} days`;
};

const truncateAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

export const VaultSummaryCards: FC<Props> = ({ formData }) => {
    return (
        <div className="space-y-3">
            {/* File Info */}
            <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-dark-400">Encrypted File</p>
                            <p className="font-medium">{formData.file?.name || 'Unknown'}</p>
                        </div>
                    </div>
                    <span className="text-dark-400 text-sm">
                        {formData.file ? formatFileSize(formData.file.size) : '-'}
                    </span>
                </div>
            </div>

            {/* Recipient */}
            <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm text-dark-400">Recipient</p>
                        <p className="font-medium font-mono">
                            {truncateAddress(formData.recipientAddress)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Interval */}
            <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm text-dark-400">Check-in Interval</p>
                        <p className="font-medium">{formatInterval(formData.timeInterval)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
