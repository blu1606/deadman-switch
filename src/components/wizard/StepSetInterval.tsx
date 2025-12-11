'use client';

import { FC, useState } from 'react';
import { VaultFormData } from '@/types/vaultForm';

interface Props {
    formData: VaultFormData;
    updateFormData: (updates: Partial<VaultFormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

const INTERVAL_OPTIONS = [
    {
        label: '30 Seconds (Testing)',
        value: 30,
        description: 'For testing purposes only',
        recommended: false
    },
    {
        label: '30 Days',
        value: 30 * 24 * 60 * 60,
        description: 'Check in once a month',
        recommended: true
    },
    {
        label: '90 Days',
        value: 90 * 24 * 60 * 60,
        description: 'Check in quarterly',
        recommended: false
    },
    {
        label: '1 Year',
        value: 365 * 24 * 60 * 60,
        description: 'Check in annually',
        recommended: false
    },
];

const StepSetInterval: FC<Props> = ({ formData, updateFormData, onNext, onBack }) => {
    const handleSelectInterval = (value: number) => {
        updateFormData({ timeInterval: value });
        setCustomInput(''); // Clear custom input if selecting preset
    };

    const [customInput, setCustomInput] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);

    const handleCustomParse = async () => {
        if (!customInput.trim()) return;

        setIsParsing(true);
        setParseError(null);

        try {
            const res = await fetch('/api/ai/parse-timer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: customInput })
            });

            const data = await res.json();

            if (data.seconds > 0) {
                updateFormData({ timeInterval: data.seconds });
            } else {
                setParseError(data.error || 'Could not understand duration');
            }
        } catch (err) {
            setParseError('Failed to parse duration');
        } finally {
            setIsParsing(false);
        }
    };

    const formatInterval = (seconds: number): string => {
        const days = Math.floor(seconds / (24 * 60 * 60));
        if (days >= 365) return `${Math.floor(days / 365)} year${days >= 730 ? 's' : ''}`;
        if (days >= 30) return `${Math.floor(days / 30)} month${days >= 60 ? 's' : ''}`;
        return `${days} days`;
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-2">Set Check-in Interval</h2>
                <p className="text-dark-400 text-sm">
                    How often do you need to check in to keep your vault locked?
                </p>
            </div>

            {/* Interval Options */}
            <div className="space-y-3">
                {(() => {
                    // Check if current value matches any existing option
                    const isCustom = !INTERVAL_OPTIONS.some(opt => opt.value === formData.timeInterval);

                    // Create effective options list
                    const displayOptions = [...INTERVAL_OPTIONS];

                    // If custom value exists (e.g. from template), add it to the top or logical place
                    if (isCustom && formData.timeInterval > 0) {
                        displayOptions.unshift({
                            label: `${Math.floor(formData.timeInterval / 86400)} Days (Custom/Template)`,
                            value: formData.timeInterval,
                            description: 'Value selected via template or custom setting',
                            recommended: false
                        });
                    }

                    return displayOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleSelectInterval(option.value)}
                            className={`
              w-full p-4 rounded-xl border text-left transition-all
              ${formData.timeInterval === option.value
                                    ? 'border-primary-500 bg-primary-500/10'
                                    : 'border-dark-600 hover:border-dark-500 bg-dark-800/50'
                                }
            `}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{option.label}</span>
                                        {option.recommended && (
                                            <span className="text-xs bg-primary-600/30 text-primary-400 px-2 py-0.5 rounded">
                                                Recommended
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-dark-400 text-sm mt-1">{option.description}</p>
                                </div>
                                <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${formData.timeInterval === option.value
                                        ? 'border-primary-500 bg-primary-500'
                                        : 'border-dark-500'
                                    }
              `}>
                                    {formData.timeInterval === option.value && (
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        </button>
                    ));
                })()}
                {/* AI Custom Input */}
                <div className="pt-2">
                    <label className="block text-xs text-dark-400 mb-2 uppercase tracking-warn font-semibold">Or type a custom duration (AI)</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={customInput}
                                onChange={(e) => setCustomInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCustomParse()}
                                placeholder='e.g., "45 days", "3 months", "until next year"'
                                className={`w-full bg-dark-800 border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-all ${parseError ? 'border-red-500/50 focus:border-red-500' : 'border-dark-600'
                                    }`}
                            />
                            {isParsing && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleCustomParse}
                            disabled={isParsing || !customInput.trim()}
                            className="px-6 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            Set
                        </button>
                    </div>
                    {parseError && (
                        <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                            <span>⚠️</span> {parseError}
                        </p>
                    )}
                </div>

            </div>

            {/* Explanation */}
            <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-medium mb-1">What happens?</p>
                        <p className="text-dark-400 text-sm">
                            If you don&apos;t check in within <strong className="text-primary-400">{formatInterval(formData.timeInterval)}</strong>,
                            your vault will be unlocked and your recipient can claim the contents.
                        </p>
                    </div>
                </div>
            </div>

            {/* Warning for long intervals */}
            {formData.timeInterval >= 365 * 24 * 60 * 60 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-yellow-400 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Long intervals increase the risk that your vault may be accessed unexpectedly.
                    </p>
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
                <button onClick={onBack} className="btn-secondary">
                    ← Back
                </button>
                <button onClick={onNext} className="btn-primary">
                    Next: Review & Confirm →
                </button>
            </div>
        </div>
    );
};

export default StepSetInterval;
