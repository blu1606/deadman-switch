'use client';

import { FC } from 'react';
import KeyShardingDemo from '@/components/premium/KeyShardingDemo';

interface Props {
    guardianEnabled: boolean;
    setGuardianEnabled: (val: boolean) => void;
    aesKeyBase64: string;
    recipientEmail: string;
}

export const GuardianProtectionForm: FC<Props> = ({
    guardianEnabled,
    setGuardianEnabled,
    aesKeyBase64,
    recipientEmail
}) => {
    return (
        <div className="bg-gradient-to-br from-dark-800 to-dark-800/50 rounded-lg p-4 border border-purple-500/30 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                        <span className="text-xl">🛡️</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            Guardian Key Sharding
                            <span className="text-xs bg-purple-600/30 text-purple-400 px-2 py-0.5 rounded">
                                Premium
                            </span>
                        </h3>
                        <p className="text-sm text-dark-400">
                            Split your encryption key for backup recovery
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setGuardianEnabled(!guardianEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${guardianEnabled ? 'bg-purple-500' : 'bg-dark-600'
                        }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${guardianEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                    />
                </button>
            </div>

            {guardianEnabled && (
                <div className="mt-4 pt-4 border-t border-purple-500/20">
                    <KeyShardingDemo
                        masterKey={aesKeyBase64 || 'demo-key-12345'}
                        recipientEmail={recipientEmail || 'recipient@example.com'}
                        onComplete={(generatedShards) => {
                            console.log('[Guardian] Shards generated:', generatedShards.length);
                        }}
                    />
                </div>
            )}
        </div>
    );
};
