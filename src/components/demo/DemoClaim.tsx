import { useDemoVault } from '@/hooks/useDemoVault';
import { motion } from 'framer-motion';

export default function DemoClaim() {
    const { actions } = useDemoVault();

    return (
        <div className="w-full max-w-md">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card bg-dark-900/50 backdrop-blur-xl border border-primary-500/30 p-8 text-center relative overflow-hidden"
            >
                {/* Glow Effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-primary-500 blur-md" />

                <div className="text-6xl mb-6 animate-pulse">🎁</div>

                <h2 className="text-2xl font-bold text-white mb-2">Vault Discovered</h2>
                <p className="text-dark-300 mb-8 text-sm">
                    You found an expired vault belonging to <span className="text-primary-400 font-mono">Agent 007</span>.
                </p>

                <div className="bg-dark-800/50 p-4 rounded-xl border border-white/5 mb-8">
                    <div className="text-[10px] text-dark-500 uppercase tracking-widest mb-1">Locked Assets</div>
                    <div className="text-2xl font-mono text-white">
                        100.00 <span className="text-primary-400">USDC</span>
                    </div>
                </div>

                <button
                    onClick={actions.claimVault}
                    className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    CLAIM ASSETS
                </button>
            </motion.div>
        </div>
    );
}
