import { FC, useState } from 'react';
import { VaultStatus } from '@/hooks/useVault';
import { VaultData } from '@/utils/solanaParsers';
import { truncateAddress } from '@/lib/utils'; // Keep this as it's used
import HoldCheckInButton from './HoldCheckInButton';
import KipAvatar from '@/components/brand/KipAvatar';
import { BN } from '@coral-xyz/anchor';

interface VaultCardProps {
    vault: VaultData;
    status: VaultStatus;
    isPinging: boolean;
    isSuccess: boolean;
    streak?: number;
    onPing: () => void;
    onEdit: () => void;
    onDelegate: () => void;
    onTopUp: () => void;
    onLockTokens: () => void;
    onDuress?: () => void;
    onUpdate?: () => void; // Added for compatibility if dashboard sends it
    onCloseVault?: () => void; // Added for compatibility
}

const VaultCard: FC<VaultCardProps> = ({
    vault,
    status,
    isPinging,
    isSuccess,
    streak = 0,
    onPing,
    onEdit,
    onDelegate,
    onTopUp,
    onLockTokens,
    onDuress
}) => {
    const key = vault.publicKey.toBase58();

    // Calculate precise health % for Kip
    // health = (timeRemaining / timeInterval) * 100
    const totalTime = vault.timeInterval.toNumber();
    const remaining = Math.max(0, status.timeRemaining);
    // Avoid division by zero
    const healthPercent = totalTime > 0 ? Math.min(100, Math.max(0, (remaining / totalTime) * 100)) : 0;

    const [isCharging, setIsCharging] = useState(false);

    // Helper to format usage in the card (local definition to avoid import issues if utils missing)
    const formatLabel = (seconds: number) => {
        if (seconds <= 0) return "EXPIRED";
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        return `${d}d ${h}h`;
    };

    return (
        <div className={`card group relative overflow-hidden transition-all duration-300 hover:border-dark-500 ${isSuccess ? 'border-safe-green/50 shadow-safe-green/20' : ''}`}>
            {/* Background Decor */}
            {status.healthStatus === 'critical' && !vault.isReleased && (
                <div className="absolute inset-0 bg-red-500/5 animate-pulse-critical z-0 pointer-events-none" />
            )}

            <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">

                {/* Left: Visual Indicators (Kip Avatar) */}
                <div className="flex flex-col items-center gap-4 min-w-[120px] pt-2">
                    <KipAvatar
                        seed={key}
                        health={healthPercent}
                        isReleased={vault.isReleased}
                        size="md"
                        isCharging={isCharging}
                        showGlow={!vault.isReleased} // No glow if dead? Or yes? Spec says Ghost glows.
                    />

                    {/* Streak Display under Kip */}
                    {streak > 0 && !vault.isReleased && (
                        <div className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full border border-primary-500/20">
                            <span>🔥</span>
                            <span>{streak} DAY STREAK</span>
                        </div>
                    )}
                </div>

                {/* Center: Info */}
                <div className="flex-1 w-full text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                        <h3 className="text-xl font-bold tracking-tight text-white">
                            {vault.name || `VAULT-${key.slice(0, 4)}`}
                        </h3>
                        <span className="bg-dark-800 text-dark-400 text-[10px] px-2 py-0.5 rounded font-mono">
                            {truncateAddress(key)}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-dark-900/50 p-3 rounded-lg border border-dark-700/50">
                            <div className="text-[10px] text-dark-500 uppercase tracking-wider mb-1">Time Remaining</div>
                            <div className={`font-mono text-lg ${status.isExpired ? 'text-red-500' : 'text-white'}`}>
                                {formatLabel(status.timeRemaining)}
                            </div>
                        </div>
                        <div className="bg-dark-900/50 p-3 rounded-lg border border-dark-700/50">
                            <div className="text-[10px] text-dark-500 uppercase tracking-wider mb-1">Check-in Interval</div>
                            <div className="font-mono text-lg text-white">
                                {Math.floor(vault.timeInterval.toNumber() / 86400)}d
                            </div>
                        </div>
                    </div>

                    {/* Locked Assets Display (T.1 & T.2) */}
                    {(vault.lockedLamports.gt(new BN(0)) || vault.lockedTokens.gt(new BN(0))) && (
                        <div className="flex items-center justify-between bg-dark-900/50 p-3 rounded-lg border border-dark-700/50 mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">💰</span>
                                <div>
                                    <div className="text-[10px] text-dark-500 uppercase tracking-wider">Locked Assets</div>
                                    <div className="flex flex-col">
                                        {vault.lockedLamports.gt(new BN(0)) && (
                                            <span className="font-mono text-white text-sm">
                                                {(vault.lockedLamports.toNumber() / 1_000_000_000).toFixed(3)} SOL
                                            </span>
                                        )}
                                        {vault.lockedTokens.gt(new BN(0)) && (
                                            <span className="font-mono text-primary-400 text-sm">
                                                {vault.lockedTokens.toString()} Tokens
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bounty Display */}
                    <div className="flex items-center justify-between bg-dark-900/50 p-3 rounded-lg border border-dark-700/50 mb-6">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">⚡</span>
                            <div>
                                <div className="text-[10px] text-dark-500 uppercase tracking-wider">Bounty</div>
                                <div className="font-mono text-white">{(vault.bountyLamports.toNumber() / 1e9).toFixed(3)} SOL</div>
                            </div>
                        </div>
                        <button
                            onClick={onTopUp}
                            className="px-3 py-1.5 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 text-xs rounded-lg transition-colors border border-primary-500/20"
                        >
                            Top Up
                        </button>
                    </div>

                    {/* Add Tokens Button (New T.2) */}
                    <button
                        onClick={onLockTokens}
                        className="w-full mb-6 py-2 border border-dashed border-dark-600 hover:border-primary-500/50 hover:bg-primary-500/5 text-dark-400 hover:text-primary-400 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                    >
                        <span>💎</span> Check & Lock SPL Tokens
                    </button>

                    {/* Action Area */}
                    {!vault.isReleased && (
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1">
                                <HoldCheckInButton
                                    onComplete={onPing}
                                    disabled={isPinging || isSuccess}
                                    label={isSuccess ? "CHECK-IN COMPLETE" : undefined}
                                    onDuress={onDuress}
                                    onHoldChange={setIsCharging}
                                />
                            </div>
                            <button
                                onClick={onDelegate}
                                className="px-4 py-3 rounded-xl border border-dark-600 hover:bg-dark-700 text-dark-400 transition-colors"
                                title="Manage Delegate"
                            >
                                👤
                            </button>
                            <button
                                onClick={onEdit}
                                className="px-4 py-3 rounded-xl border border-dark-600 hover:bg-dark-700 text-dark-400 transition-colors"
                                title="Edit Vault Settings"
                            >
                                ⚙️
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isSuccess && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-safe-green animate-pulse-fast" />
            )}
        </div>
    );
};

export default VaultCard;
