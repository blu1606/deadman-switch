import React from 'react';

interface VaultHealthShieldProps {
    percentage: number;
    status: 'healthy' | 'warning' | 'critical';
}

export default function VaultHealthShield({ percentage, status }: VaultHealthShieldProps) {
    // Health logic:
    // 100-50%: Full Shield
    // 50-20%: Cracked
    // <20%: Broken

    const getColors = () => {
        switch (status) {
            case 'critical':
                return {
                    fill: '#EF4444',
                    stroke: '#7F1D1D',
                    glow: 'shadow-red-500/30'
                };
            case 'warning':
                return {
                    fill: '#F59E0B',
                    stroke: '#78350F',
                    glow: 'shadow-alert-amber/30'
                };
            case 'healthy':
            default:
                return {
                    fill: '#10B981',
                    stroke: '#064E3B',
                    glow: 'shadow-safe-green/30'
                };
        }
    };

    const colors = getColors();
    const isCracked = percentage < 50;
    const isBroken = percentage < 20;

    return (
        <div className={`relative w-16 h-16 flex items-center justify-center transition-all duration-500 ${colors.glow} drop-shadow-lg`}>
            <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full transition-colors duration-500"
                style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.3))' }}
            >
                {/* Shield Body */}
                <path
                    d="M12 2L3 7V12C3 17.52 6.84 22.74 12 24C17.16 22.74 21 17.52 21 12V7L12 2Z"
                    fill={colors.fill} // Opacity moved to class/style if needed, but solid looks stronger
                    fillOpacity="0.2"
                    stroke={colors.fill}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Heartbeat Line (only if healthy) */}
                {!isCracked && !isBroken && (
                    <path
                        d="M7 12H9L11 15L13 9L15 12H17"
                        stroke={colors.fill}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="animate-pulse"
                    />
                )}

                {/* Cracks (Warning) */}
                {isCracked && (
                    <path
                        d="M12 12L9 9M12 12L15 9"
                        stroke={colors.fill}
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="opacity-70"
                    />
                )}

                {/* Heavy Damage (Critical) */}
                {isBroken && (
                    <path
                        d="M12 12L12 18M7 15L17 15"
                        stroke={colors.fill}
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="opacity-90"
                    />
                )}
            </svg>

            {/* Percentage Text Overlay for clarity */}
            <div className="absolute -bottom-2 bg-dark-900 border border-dark-700 rounded px-1 text-[10px] font-mono text-dark-300">
                {Math.round(percentage)}%
            </div>
        </div>
    );
}
