import React from 'react';

interface AliveIndicatorProps {
    status: 'healthy' | 'warning' | 'critical';
    isReleased: boolean;
}

export default function AliveIndicator({ status, isReleased }: AliveIndicatorProps) {
    if (isReleased) {
        return (
            <div className="relative flex items-center justify-center w-12 h-12">
                <div className="absolute w-full h-full bg-dark-800 rounded-full border border-dark-600 opacity-50" />
                <span className="text-xl">💀</span>
            </div>
        );
    }

    const getColors = () => {
        switch (status) {
            case 'critical':
                return 'bg-red-500 shadow-red-500/50';
            case 'warning':
                return 'bg-alert-amber shadow-alert-amber/50';
            case 'healthy':
            default:
                return 'bg-safe-green shadow-safe-green/50';
        }
    };

    const getPulseAnimation = () => {
        switch (status) {
            case 'critical':
                return 'animate-pulse-critical';
            case 'warning':
                return 'animate-pulse-fast';
            case 'healthy':
            default:
                return 'animate-pulse-slow';
        }
    };

    const colors = getColors();
    const animation = getPulseAnimation();

    return (
        <div className="relative flex items-center justify-center w-12 h-12" title={`System Status: ${status.toUpperCase()}`}>
            {/* Outer Glow Ring */}
            <div className={`absolute w-full h-full rounded-full opacity-30 ${colors} ${animation}`} />

            {/* Inner Ring */}
            <div className={`absolute w-3/4 h-3/4 rounded-full opacity-60 ${colors} ${animation}`} style={{ animationDelay: '0.2s' }} />

            {/* Core */}
            <div className={`relative w-3 h-3 rounded-full ${colors.split(' ')[0]} shadow-lg z-10`} />
        </div>
    );
}
