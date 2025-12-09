'use client';

import { FC, useState } from 'react';

interface NotifyMeFormProps {
    vaultAddress: string;
    releaseTimestamp: number; // Unix seconds
    onSuccess?: () => void;
}

const NotifyMeForm: FC<NotifyMeFormProps> = ({ vaultAddress, releaseTimestamp, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setMessage('Please enter your email address');
            setStatus('error');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const res = await fetch('/api/vault/notify-subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vaultAddress,
                    recipientEmail: email,
                    releaseTimestamp
                })
            });

            const data = await res.json();

            if (data.success) {
                setStatus('success');
                setMessage("We'll notify you when this vault is ready!");
                onSuccess?.();
            } else {
                setStatus('error');
                setMessage(data.error || 'Failed to subscribe');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Something went wrong. Please try again.');
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">✅</div>
                <p className="text-primary-400 font-medium">Subscribed!</p>
                <p className="text-dark-400 text-sm mt-1">{message}</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-dark-900/50 border border-dark-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🔔</span>
                <span className="text-sm font-medium text-white">Notify me when ready</span>
            </div>

            <div className="flex gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    disabled={status === 'loading'}
                />
                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                    {status === 'loading' ? '...' : 'Notify'}
                </button>
            </div>

            {status === 'error' && (
                <p className="text-red-400 text-xs mt-2">{message}</p>
            )}

            <p className="text-dark-500 text-xs mt-2">
                We&apos;ll send you an email when this vault becomes claimable.
            </p>
        </form>
    );
};

export default NotifyMeForm;
