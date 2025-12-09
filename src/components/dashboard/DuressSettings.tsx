import { FC } from 'react';

interface DuressSettingsProps {
    enabled: boolean;
    setEnabled: (value: boolean) => void;
    email: string;
    setEmail: (value: string) => void;
}

const DuressSettings: FC<DuressSettingsProps> = ({ enabled, setEnabled, email, setEmail }) => {
    return (
        <div className="border-t border-dark-700 pt-6 mb-6">
            <h3 className="text-sm font-bold text-dark-300 mb-4 uppercase tracking-wider">Silent Alarm (Duress Mode)</h3>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-sm text-white">Enable Duress Mode</label>
                    <button
                        onClick={() => setEnabled(!enabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-red-500' : 'bg-dark-600'}`}
                        type="button"
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                {enabled && (
                    <div className="animate-fade-in">
                        <label className="block text-xs font-medium text-dark-300 mb-1">
                            Emergency Contact (Email)
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white text-sm"
                            placeholder="sos@example.com"
                        />
                        <p className="text-[10px] text-dark-400 mt-2">
                            ⚠️ Holding the check-in button for 5 seconds will trigger a silent alarm to this email instead of checking in.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DuressSettings;
