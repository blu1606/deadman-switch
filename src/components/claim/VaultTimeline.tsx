'use client';

import { FC } from 'react';
import { formatDate, truncateAddress } from '@/lib/utils';

interface VaultTimelineProps {
    createdAt: Date;
    releasedAt: Date;
    senderAddress: string;
    isReleased: boolean;
    claimedAt?: Date; // Optional, present if already claimed (future C.3 feature)
}

const VaultTimeline: FC<VaultTimelineProps> = ({
    createdAt,
    releasedAt,
    senderAddress,
    isReleased,
    claimedAt
}) => {
    // Current step logic
    // 1: Created (Always done)
    // 2: Released (Done if isReleased)
    // 3: Claimed (Done if claimedAt)
    const currentStep = claimedAt ? 3 : (isReleased ? 2 : 1);

    return (
        <div className="w-full max-w-2xl mx-auto mb-8 px-4">
            <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-4 left-0 w-full h-0.5 bg-dark-700 -z-10">
                    <div
                        className="h-full bg-primary-500 transition-all duration-1000 ease-out"
                        style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                    />
                </div>

                <div className="flex justify-between items-start">
                    {/* Step 1: Sealed */}
                    <TimelineNode
                        status={currentStep >= 1 ? 'completed' : 'pending'}
                        label="SEALED"
                        date={formatDate(createdAt)}
                        subtext={`By ${truncateAddress(senderAddress)}`}
                        icon="🔒"
                    />

                    {/* Step 2: Released */}
                    <TimelineNode
                        status={currentStep >= 2 ? 'completed' : (currentStep === 1 ? 'pending' : 'pending')}
                        isActive={currentStep === 2}
                        label="RELEASED"
                        date={formatDate(releasedAt)}
                        subtext={isReleased ? "Keys unlocked" : "Pending check-in miss"}
                        icon={isReleased ? "🔓" : "⏳"}
                    />

                    {/* Step 3: Claimed */}
                    <TimelineNode
                        status={currentStep >= 3 ? 'completed' : 'pending'}
                        isActive={currentStep === 3}
                        label="CLAIMED"
                        date={claimedAt ? formatDate(claimedAt) : "Not yet"}
                        subtext={claimedAt ? "Added to archive" : "Waiting for you"}
                        icon="🎁"
                    />
                </div>
            </div>
        </div>
    );
};

interface TimelineNodeProps {
    status: 'completed' | 'active' | 'pending';
    isActive?: boolean;
    label: string;
    date: string;
    subtext: string;
    icon: string;
}

const TimelineNode: FC<TimelineNodeProps> = ({ status, isActive, label, date, subtext, icon }) => {
    return (
        <div className="flex flex-col items-center text-center">
            {/* Circle Node */}
            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs mb-3
                transition-all duration-500 z-10 border-4
                ${status === 'completed' || isActive
                    ? 'bg-primary-600 border-dark-900 text-white shadow-lg shadow-primary-500/20'
                    : 'bg-dark-800 border-dark-900 text-dark-500'}
                ${isActive ? 'animate-pulse ring-2 ring-primary-500/50' : ''}
            `}>
                {status === 'completed' ? '✓' : icon}
            </div>

            {/* Text Content */}
            <div className={`transition-opacity duration-500 ${status === 'pending' ? 'opacity-50' : 'opacity-100'}`}>
                <div className="text-[10px] font-bold tracking-wider uppercase mb-0.5 text-primary-400">
                    {label}
                </div>
                <div className="text-white font-mono text-sm mb-1">{date}</div>
                <div className="text-[10px] text-dark-400 max-w-[100px] leading-tight mx-auto">
                    {subtext}
                </div>
            </div>
        </div>
    );
};

export default VaultTimeline;
