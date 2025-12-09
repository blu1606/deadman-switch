import { useState } from 'react';
import { useDemoVault } from '@/hooks/useDemoVault';
import { motion } from 'framer-motion';

export default function DemoCreate() {
    const { actions, vault } = useDemoVault();
    const [recipient, setRecipient] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = () => {
        setLoading(true);
        setTimeout(() => {
            actions.createVault('My First Vault', recipient || 'myself@example.com');
        }, 1500); // Fake delay
    };

    return (
        <div className="w-full max-w-lg">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card bg-dark-900 border border-dark-700 p-8"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold">2</div>
                    <h2 className="text-xl font-bold text-white">Protect Your Assets</h2>
                </div>

                <div className="space-y-6">
                    {/* Asset Selection (ReadOnly) */}
                    <div>
                        <label className="text-xs text-dark-400 uppercase font-bold tracking-wider mb-2 block">Asset to Lock</label>
                        <div className="bg-dark-800 p-3 rounded-lg border border-dark-700 flex justify-between items-center opacity-70 cursor-not-allowed">
                            <span className="text-white font-mono">{vault.balanceUsdc} USDC</span>
                            <span className="text-xs text-green-400">Recovered ✔</span>
                        </div>
                    </div>

                    {/* Recipient */}
                    <div>
                        <label className="text-xs text-dark-400 uppercase font-bold tracking-wider mb-2 block">Recipient Email</label>
                        <input
                            type="email"
                            placeholder="Enter your email (optional)"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            className="w-full bg-dark-800 border border-dark-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary-500 focus:outline-none placeholder:text-dark-600"
                        />
                        <p className="text-[10px] text-dark-500 mt-2">
                            *In this simulation, we'll pretend to send it here.
                        </p>
                    </div>

                    {/* Timer (Locked) */}
                    <div>
                        <label className="text-xs text-dark-400 uppercase font-bold tracking-wider mb-2 block">Check-in Timer</label>
                        <div className="bg-dark-800 p-3 rounded-lg border border-dark-700 flex justify-between items-center">
                            <span className="text-white font-mono">10 SECONDS</span>
                            <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20">DEMO MODE</span>
                        </div>
                        <p className="text-[10px] text-dark-500 mt-2">
                            Usually 30 days. Accelerated for this demo.
                        </p>
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full py-4 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all mt-4 flex items-center justify-center gap-2"
                    >
                        {loading ? 'DEPLOYING VAULT...' : 'CREATE VAULT (0.01 SOL)'}
                    </button>
                    {!loading && <p className="text-center text-[10px] text-dark-500">Gas fees paid by burner wallet.</p>}
                </div>
            </motion.div>
        </div>
    );
}
