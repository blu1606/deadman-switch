'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, FastForward, FileText, Image as ImageIcon, File, Lock, Unlock } from 'lucide-react';
import Image from 'next/image';
import { DemoState, UploadedFileInfo } from '@/hooks/useDemoVault';
import confetti from 'canvas-confetti';
import KipAvatar from '@/components/brand/KipAvatar';
import HoldCheckInButton from '@/components/dashboard/HoldCheckInButton';
import StreakCounter from '@/components/kip/StreakCounter';
import { useEffect, useState } from 'react';

interface DemoDashboardProps {
    timer: number;
    maxTime: number;
    state: DemoState;
    onCheckIn: () => void;
    onFastForward: () => void;
    uploadedFile: UploadedFileInfo | null;
}

export default function DemoDashboard({
    timer,
    maxTime,
    state,
    onCheckIn,
    onFastForward,
    uploadedFile
}: DemoDashboardProps) {
    const progress = (timer / maxTime) * 100;
    const isDying = state === 'DYING' || (state === 'LIVE' && timer < 5);
    const isReleased = state === 'RELEASED';
    const [confettiFired, setConfettiFired] = useState(false);

    // Kip health based on timer
    const kipHealth = Math.max(10, progress);

    // Fire confetti once
    useEffect(() => {
        if (isReleased && !confettiFired && typeof window !== 'undefined') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            setConfettiFired(true);
        }
    }, [isReleased, confettiFired]);

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <ImageIcon className="w-6 h-6" />;
        if (type.startsWith('text/')) return <FileText className="w-6 h-6" />;
        return <File className="w-6 h-6" />;
    };

    // RELEASED STATE - Show decrypted file
    if (isReleased) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg mx-auto"
            >
                <div className="p-8 bg-dark-800/80 border border-green-500/30 backdrop-blur-xl rounded-2xl text-center space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-center gap-3">
                        <motion.div
                            initial={{ rotate: 0 }}
                            animate={{ rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 0.5 }}
                        >
                            <Unlock className="w-8 h-8 text-green-500" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white">Vault Decrypted</h2>
                    </div>

                    {/* Decrypted File Preview */}
                    {uploadedFile && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-dark-900 border border-dark-700 rounded-xl p-6 space-y-4"
                        >
                            <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-mono">
                                <CheckCircle className="w-4 h-4" />
                                AES-256 DECRYPTION COMPLETE
                            </div>

                            {/* File Content */}
                            {uploadedFile.type.startsWith('image/') ? (
                                <div className="relative">
                                    <Image
                                        src={uploadedFile.dataUrl}
                                        alt="Decrypted content"
                                        width={400}
                                        height={300}
                                        className="max-h-48 w-auto mx-auto rounded-lg shadow-lg object-contain"
                                        unoptimized
                                    />
                                </div>
                            ) : uploadedFile.type.startsWith('text/') ? (
                                <div className="bg-dark-800 p-4 rounded-lg text-left max-h-48 overflow-auto">
                                    <p className="text-white text-sm font-mono whitespace-pre-wrap">
                                        {atob(uploadedFile.dataUrl.split(',')[1] || '')}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-16 h-16 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center">
                                        {getFileIcon(uploadedFile.type)}
                                    </div>
                                </div>
                            )}

                            <div className="text-dark-400 text-sm">
                                <p className="font-medium text-white">{uploadedFile.name}</p>
                                <p>{(uploadedFile.size / 1024).toFixed(1)} KB • {uploadedFile.type}</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Success Message */}
                    <div className="space-y-2">
                        <p className="text-dark-400">
                            The protocol executed successfully. In production, your beneficiary would receive this exact content.
                        </p>
                    </div>

                    {/* TX Hash */}
                    <div className="p-4 bg-dark-900 rounded-lg border border-dark-700 text-sm font-mono text-green-400">
                        TX: 0x8a7f...3f9c [CONFIRMED]
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <a
                            href="/create"
                            className="flex-1 btn-primary py-4 text-center flex items-center justify-center gap-2"
                        >
                            🚀 Create Your Vault
                        </a>
                        <button
                            className="flex-1 btn-secondary py-4"
                            onClick={() => window.location.reload()}
                        >
                            🔄 Replay Demo
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    // LIVE/DYING STATE
    return (
        <div className="w-full max-w-lg mx-auto space-y-6">
            {/* Main Dashboard Card */}
            <div className={`p-6 border backdrop-blur-xl rounded-2xl transition-colors duration-500 ${isDying ? 'bg-red-950/20 border-red-500/50' : 'bg-dark-800/80 border-dark-700'}`}>

                {/* Header with Kip */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <motion.div
                            animate={isDying ? { y: [0, -3, 0] } : {}}
                            transition={{ duration: 0.5, repeat: isDying ? Infinity : 0 }}
                            className="relative"
                        >
                            <KipAvatar
                                seed="vault-dashboard"
                                health={kipHealth}
                                size="md"
                                showGlow={true}
                                className={isDying ? 'animate-pulse' : ''}
                            />
                            {/* Streak Counter (Gamification) */}
                            {!isDying && !isReleased && (
                                <div className="absolute -top-2 -right-12 bg-dark-900/80 backdrop-blur-sm p-1 rounded-lg border border-orange-500/20 shadow-lg scale-90">
                                    <StreakCounter count={3} />
                                </div>
                            )}
                        </motion.div>
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                {isDying ? (
                                    <span className="text-red-500 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5" /> CRITICAL
                                    </span>
                                ) : (
                                    <span className="text-green-500">ACTIVE</span>
                                )}
                            </h3>
                            <p className="text-xs text-dark-500 font-mono">
                                VAULT-ID: 0xDEMO...1234
                            </p>
                        </div>
                    </div>

                    <div className={`text-5xl font-mono font-bold ${isDying ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {timer}s
                    </div>
                </div>

                {/* Encrypted File Indicator */}
                {uploadedFile && (
                    <div className="mb-4 p-3 bg-dark-900/50 rounded-xl border border-dark-700 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center">
                            <Lock className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-white text-sm font-medium truncate">{uploadedFile.name}</p>
                            <p className="text-dark-500 text-xs font-mono">ENCRYPTED • AES-256-GCM</p>
                        </div>
                    </div>
                )}

                {/* Health Bar */}
                <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-xs text-dark-400">
                        <span>Time until release</span>
                        <span>{Math.round(progress)}% health</span>
                    </div>
                    <div className={`h-3 rounded-full overflow-hidden ${isDying ? 'bg-red-900/30' : 'bg-dark-700'}`}>
                        <motion.div
                            className={`h-full rounded-full ${isDying ? 'bg-red-500' : 'bg-gradient-to-r from-green-500 to-primary-500'}`}
                            style={{ width: `${progress}%` }}
                            animate={isDying ? { opacity: [1, 0.5, 1] } : {}}
                            transition={{ duration: 0.5, repeat: isDying ? Infinity : 0 }}
                        />
                    </div>
                </div>

                {/* Hold to Check In Button */}
                <div className="mb-4">
                    <HoldCheckInButton
                        onComplete={onCheckIn}
                        label="HOLD TO CHECK IN"
                        loadingLabel="VERIFYING..."
                    />
                </div>

                {/* Fast Forward */}
                <button
                    onClick={onFastForward}
                    className="w-full py-3 text-dark-400 hover:text-white hover:bg-dark-700/50 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                >
                    <FastForward className="w-4 h-4" />
                    Fast Forward (Demo Only)
                </button>
            </div>

            <p className="text-xs text-center text-dark-500 max-w-[80%] mx-auto">
                *In a real vault, the timer would be 30-365 days. Hold the button for 5 seconds to trigger the &quot;Silent Alarm&quot; duress mode.
            </p>
        </div>
    );
}
