'use client';

import { FC } from 'react';
import { ClaimedVaultRecord } from '@/hooks/useClaimedVaults';
import { formatDate, truncateAddress } from '@/lib/utils';
import { getItemIcon, formatFileSize } from '@/utils/vaultBundle';

interface ClaimedVaultCardProps {
    vault: ClaimedVaultRecord;
    onView: () => void;
    onExport: () => void;
}

const ClaimedVaultCard: FC<ClaimedVaultCardProps> = ({ vault, onView, onExport }) => {
    return (
        <div className="card group hover:border-primary-500/50 transition-colors">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-primary-400 transition-colors">
                        {vault.name}
                    </h3>
                    <div className="text-xs text-dark-400 flex items-center gap-1 mt-1">
                        <span>From:</span>
                        <span className="font-mono text-dark-300 bg-dark-800 px-1 rounded">
                            {vault.senderName || truncateAddress(vault.senderAddress)}
                        </span>
                    </div>
                </div>
                <div className="text-xs text-dark-500 bg-dark-800 px-2 py-1 rounded">
                    {formatDate(new Date(vault.claimedAt))}
                </div>
            </div>

            {/* Content Summary */}
            <div className="bg-dark-900/50 rounded-lg p-3 mb-4 border border-dark-700/50">
                <div className="flex items-center gap-3 text-sm text-dark-300">
                    <div className="flex -space-x-1">
                        {vault.contentSummary.types.slice(0, 3).map((type, i) => (
                            <span key={i} className="w-6 h-6 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-xs" title={type}>
                                {getItemIcon(type as any)}
                            </span>
                        ))}
                        {vault.contentSummary.types.length > 3 && (
                            <span className="w-6 h-6 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-xs text-dark-400">
                                +{vault.contentSummary.types.length - 3}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 text-right text-xs text-dark-500">
                        {vault.contentSummary.itemCount} items · {formatFileSize(vault.contentSummary.totalSize)}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={onView}
                    className="flex-1 px-3 py-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 text-sm rounded-lg transition-colors border border-primary-500/20"
                >
                    👁️ View
                </button>
                <button
                    onClick={onExport}
                    className="px-3 py-2 bg-dark-800 hover:bg-dark-700 text-dark-400 hover:text-white text-sm rounded-lg transition-colors border border-dark-700"
                    title="Export / Download"
                >
                    ⬇️
                </button>
            </div>
        </div>
    );
};

export default ClaimedVaultCard;
