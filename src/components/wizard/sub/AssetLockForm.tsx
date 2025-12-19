'use client';

import { FC } from 'react';

interface Props {
    lockedSol: number;
    setLockedSol: (val: number) => void;
}

export const AssetLockForm: FC<Props> = ({ lockedSol, setLockedSol }) => {
    return (
        <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
                <span className="text-xl">💰</span>
                Lock Asset (Phase 1: SOL Only)
            </h3>
            <p className="text-sm text-dark-400">
                Optionally lock SOL in the vault. The recipient can claim this amount ONLY after the vault is released.
            </p>

            <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-600/50">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-white">Amount (SOL)</label>
                    <span className="text-xs text-dark-400">Balance: ...</span>
                </div>
                <div className="relative">
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={lockedSol || ''}
                        onChange={(e) => setLockedSol(parseFloat(e.target.value) || 0)}
                        className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white font-mono focus:border-primary-500 focus:outline-none transition-colors"
                    />
                    <span className="absolute right-4 top-3 text-dark-400 font-mono">SOL</span>
                </div>
                <p className="text-xs text-dark-500 mt-2">
                    This amount will be transferred from your wallet to the vault upon creation.
                </p>
            </div>
        </div>
    );
};
