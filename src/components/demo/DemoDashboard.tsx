import { useDemoVault } from '@/hooks/useDemoVault';
import KipAvatar from '@/components/brand/KipAvatar';
import { motion, AnimatePresence } from 'framer-motion';

export default function DemoDashboard() {
    const { vault, actions, state } = useDemoVault();
    const isReleased = state === 'RELEASED';

    return (
        <div className="w-full max-w-2xl">
            {/* Success Modal (Released) */}
            <AnimatePresence>
                {isReleased && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <div className="bg-dark-900 border border-green-500/50 p-8 rounded-2xl max-w-md text-center shadow-2xl shadow-green-900/20">
                            <div className="text-6xl mb-4">🔓</div>
                            <h2 className="text-2xl font-bold text-white mb-2">Vault Unlocked!</h2>
                            <p className="text-dark-300 mb-6">
                                The timer hit zero. Your simulated assets and note have been sent to
                                <span className="text-white font-mono bg-dark-800 px-1 rounded ml-1">myself@example.com</span>.
                            </p>
                            <div className="bg-white text-black p-4 rounded-lg font-mono text-sm text-left mb-6 shadow-inner">
                                <div className="font-bold border-b border-black/10 pb-2 mb-2">Email Notification</div>
                                <p>Subject: 🚨 Your Deadman's Switch was triggered</p>
                                <p className="mt-2 text-xs opacity-70">"If you are reading this, I am gone. Here are the keys..."</p>
                            </div>
                            <a href="/create" className="btn-primary w-full py-3 block text-center">
                                CREATE REAL VAULT
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={`grid md:grid-cols-2 gap-8 ${isReleased ? 'blur-sm pointer-events-none' : ''}`}>
                {/* Left: Kip & Health */}
                <div className="card bg-dark-900/50 border border-dark-700/50 flex flex-col items-center justify-center p-8 min-h-[300px]">
                    <div className="mb-8 scale-150">
                        <KipAvatar
                            seed="demo-vault-001"
                            health={vault.health}
                            isReleased={vault.isReleased}
                            isCharging={false} // Simpler for demo
                            size="lg"
                        />
                    </div>

                    <div className="w-full max-w-[200px]">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                            <span className="text-white">Vault Health</span>
                            <span className={vault.health < 30 ? 'text-red-500' : 'text-primary-400'}>{vault.health}%</span>
                        </div>
                        <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                            <motion.div
                                className={`h-full ${vault.health < 30 ? 'bg-red-500' : 'bg-primary-500'}`}
                                initial={{ width: '100%' }}
                                animate={{ width: `${vault.health}%` }}
                                transition={{ type: 'tween', ease: 'linear', duration: 1 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Controls */}
                <div className="flex flex-col gap-4">
                    <div className="card bg-dark-900 border border-dark-700 p-6 flex-1 flex flex-col justify-center">
                        <div className="text-center mb-6">
                            <div className="text-[10px] text-dark-500 uppercase tracking-widest mb-1">Time Remaining</div>
                            <div className="text-5xl font-mono text-white tracking-tighter">
                                00:0{vault.timeRemaining}
                            </div>
                        </div>

                        <button
                            onClick={actions.checkIn}
                            className="w-full py-4 bg-safe-green hover:bg-green-500 text-black font-bold rounded-xl shadow-lg shadow-green-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] mb-4"
                        >
                            I'M ALIVE (CHECK-IN)
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-dark-700"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-dark-900 px-2 text-dark-500">OR</span>
                            </div>
                        </div>

                        <button
                            onClick={actions.fastForward}
                            className="mt-4 w-full py-3 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-bold flex items-center justify-center gap-2 group"
                        >
                            <span>⏩</span> FAST FORWARD (DIE)
                        </button>
                        <p className="text-[10px] text-center text-dark-500 mt-2 italic">
                            Simulate what happens if you expire.
                        </p>
                    </div>

                    <div className="card bg-dark-900/30 border border-dark-700/30 p-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-dark-400">Vault Balance</span>
                            <span className="text-white font-mono">{vault.balanceUsdc} USDC</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
