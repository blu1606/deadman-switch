import { VaultCardSkeleton, StatGridSkeleton } from '@/components/ui/skeletons';

export default function DashboardLoading() {
    return (
        <main className="min-h-screen pt-24 pb-10 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header Shell */}
                <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 tracking-tight text-white">COMMAND CENTER</h1>
                        <div className="flex items-center gap-2 text-dark-400">
                            <div className="w-2 h-2 rounded-full bg-dark-600 animate-pulse" />
                            <p className="font-mono text-sm uppercase">Initializing System...</p>
                        </div>
                    </div>
                </div>

                {/* Stats Shell */}
                <StatGridSkeleton />

                {/* Vaults Shell */}
                <div className="grid gap-8">
                    <VaultCardSkeleton />
                    <VaultCardSkeleton />
                </div>
            </div>
        </main>
    );
}
