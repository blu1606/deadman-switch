import React, { useState, useRef, useEffect } from 'react';

interface HoldCheckInButtonProps {
    onComplete: () => void;
    disabled?: boolean;
    label?: string;
    loadingLabel?: string;
    onDuress?: () => void;
}

export default function HoldCheckInButton({
    onComplete,
    disabled = false,
    label = "HOLD TO CHECK IN",
    loadingLabel = "VERIFYING...",
    onDuress
}: HoldCheckInButtonProps) {
    const [progress, setProgress] = useState(0);
    const [isHolding, setIsHolding] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    // Config
    const HOLD_DURATION = 1500; // ms
    const DURESS_DURATION = 5000; // ms for silent alarm
    const UPDATE_INTERVAL = 16; // ~60fps

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const progressRef = useRef(0);
    const isDuressRef = useRef(false);

    const startHolding = (e: React.MouseEvent | React.TouchEvent) => {
        if (disabled || isComplete) return;

        setIsHolding(true);
        progressRef.current = 0;
        isDuressRef.current = false;
        setProgress(0);

        // Haptic feedback start
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(50);
        }

        intervalRef.current = setInterval(() => {
            progressRef.current += UPDATE_INTERVAL;

            // Visual progress capped at 100% for normal duration
            const newProgress = Math.min(100, (progressRef.current / HOLD_DURATION) * 100);
            setProgress(newProgress);

            // Normal completion logic
            if (!onDuress && progressRef.current >= HOLD_DURATION) {
                completeHold();
                return;
            }

            // Duress logic: If enabled, we wait for 5s
            if (onDuress) {
                // If we passed normal duration, maybe give subtle feedback? 
                // Currently just staying at 100% visual.

                if (progressRef.current >= DURESS_DURATION) {
                    isDuressRef.current = true;
                    completeHold(true); // Trigger duress
                }
            }
        }, UPDATE_INTERVAL);
    };

    const stopHolding = () => {
        if (isComplete) return;

        setIsHolding(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // If duress enabled, check if we held long enough for normal check-in
        if (onDuress && progressRef.current >= HOLD_DURATION && !isDuressRef.current) {
            completeHold(false); // Normal check-in on release
            return;
        }

        // Retract animation
        const retractInterval = setInterval(() => {
            progressRef.current = Math.max(0, progressRef.current - (UPDATE_INTERVAL * 2));
            const newProgress = (progressRef.current / HOLD_DURATION) * 100;
            setProgress(newProgress);

            if (progressRef.current <= 0) {
                clearInterval(retractInterval);
                setProgress(0);
            }
        }, UPDATE_INTERVAL);
    };

    const completeHold = (isDuress = false) => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        setIsComplete(true);
        setProgress(100);

        // Haptic success
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(isDuress ? [50, 50, 50, 50, 50] : [100, 50, 100]);
        }

        if (isDuress && onDuress) {
            onDuress();
        } else {
            onComplete();
        }

        // Reset after a delay
        setTimeout(() => {
            setIsComplete(false);
            setProgress(0);
            setIsHolding(false);
        }, 3000);
    };

    // Creating the SVG Stroke Dasharray for circle
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div
            className={`relative select-none touch-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onMouseDown={startHolding}
            onMouseUp={stopHolding}
            onMouseLeave={stopHolding}
            onTouchStart={startHolding}
            onTouchEnd={stopHolding}
        >
            {/* Button Background */}
            <div className={`
                relative overflow-hidden rounded-xl bg-dark-800 border-2
                transition-all duration-200
                flex items-center justify-between px-4 py-3 min-w-[200px]
                ${isHolding ? 'border-primary-500 scale-[0.98]' : 'border-dark-600 hover:border-dark-500'}
                ${isComplete ? 'border-safe-green bg-safe-green/10' : ''}
            `}>
                {/* Background Fill Progress (Optional linear fill behind) */}
                <div
                    className="absolute inset-0 bg-primary-500/20 transition-all duration-0 ease-linear"
                    style={{ width: `${progress}%` }}
                />

                {/* Text Label */}
                <div className="z-10 flex flex-col items-start">
                    <span className={`text-xs font-bold tracking-widest ${isComplete ? 'text-safe-green' : 'text-dark-400'}`}>
                        {isComplete ? 'CONFIRMED' : 'SYSTEM CHECK'}
                    </span>
                    <span className={`font-mono font-bold ${isComplete ? 'text-white' : 'text-primary-400'}`}>
                        {isComplete ? 'SUCCESS' : (isHolding ? loadingLabel : label)}
                    </span>
                </div>

                {/* Circular Progress Indicator */}
                <div className="z-10 relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        {/* Track */}
                        <circle
                            cx="24"
                            cy="24"
                            r={radius}
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="text-dark-700"
                        />
                        {/* Progress */}
                        <circle
                            cx="24"
                            cy="24"
                            r={radius}
                            fill="transparent"
                            stroke={isComplete ? '#10B981' : '#3B82F6'}
                            strokeWidth="4"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-0 ease-linear"
                        />
                    </svg>

                    {/* Icon inside circle */}
                    <div className="absolute text-lg">
                        {isComplete ? '✓' : (isHolding ? '⚡' : '👆')}
                    </div>
                </div>
            </div>
        </div>
    );
}
