import { FC, useState, useEffect } from 'react';
import { VaultStatus } from '@/hooks/useVault';
import { VaultData } from '@/utils/solanaParsers';
import { truncateAddress } from '@/lib/utils';
import HoldCheckInButton from './HoldCheckInButton';
import KipAvatar from '@/components/brand/KipAvatar';
import { BN } from '@coral-xyz/anchor';
import { useConnection } from '@solana/wallet-adapter-react';
import { getMint } from '@solana/spl-token';

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
    onUpdate?: () => void;
    onCloseVault?: () => void;
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
    const { connection } = useConnection();
    const key = vault.publicKey.toBase58();

    const totalTime = vault.timeInterval.toNumber();

    // Real-time countdown state
    const [remaining, setRemaining] = useState(Math.max(0, status.timeRemaining));

    // Update remaining every second for real-time UI
    useEffect(() => {
        setRemaining(Math.max(0, status.timeRemaining)); // Sync with prop

        if (vault.isReleased || status.timeRemaining <= 0) return;

        const interval = setInterval(() => {
            setRemaining(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, [status.timeRemaining, vault.isReleased]);

    const healthPercent = totalTime > 0 ? Math.min(100, Math.max(0, (remaining / totalTime) * 100)) : 0;

    const [isCharging, setIsCharging] = useState(false);
    const [tokenDecimals, setTokenDecimals] = useState<number | null>(null);

    // Fetch Token Decimals if SPL tokens are locked
    useEffect(() => {
        const fetchDecimals = async () => {
            if (vault.tokenMint && vault.lockedTokens.gt(new BN(0))) {
                try {
                    const mintInfo = await getMint(connection, vault.tokenMint);
                    setTokenDecimals(mintInfo.decimals);
                } catch (e) {
                    console.error("Failed to fetch mint info", e);
                    // Fallback or keep as null (raw display)
                }
            }
        };

        fetchDecimals();
    }, [vault.tokenMint, vault.lockedTokens, connection]);

    const formatLabel = (seconds: number) => {
        if (seconds <= 0) return "EXPIRED";
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        return `${d}d ${h}h`;
    };

    const formatTokenAmount = (amount: BN, decimals: number | null) => {
        if (decimals === null) return amount.toString(); // Fallback to raw if logic fails
        const divisor = Math.pow(10, decimals);
        const val = amount.toNumber() / divisor;

        // Smart formatting
        if (val === 0) return "0";
        if (val < 0.001) return "< 0.001";
        return val.toLocaleString(undefined, { maximumFractionDigits: decimals > 2 ? 4 : 2 });
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
                        showGlow={!vault.isReleased}
                        isCelebrating={isSuccess}
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
                                                {formatTokenAmount(vault.lockedTokens, tokenDecimals)} Tokens
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
