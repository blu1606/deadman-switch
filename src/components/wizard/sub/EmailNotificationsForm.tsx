'use client';

import { FC } from 'react';

interface Props {
    ownerEmail: string;
    setOwnerEmail: (val: string) => void;
    recipientEmail: string;
    setRecipientEmail: (val: string) => void;
}

export const EmailNotificationsForm: FC<Props> = ({ ownerEmail, setOwnerEmail, recipientEmail, setRecipientEmail }) => {
    return (
        <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Email Notifications (Optional)
            </h3>
            <p className="text-sm text-dark-400">
                Get reminders to check in, and notify the recipient when the vault is released.
                Emails are stored securely off-chain.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-dark-400 mb-1">Your Email (for reminders)</label>
                    <input
                        type="email"
                        placeholder="you@example.com"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-sm text-dark-400 mb-1">Recipient Email (for release)</label>
                    <input
                        type="email"
                        placeholder="heir@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none transition-colors"
                    />
                </div>
            </div>
        </div>
    );
};
