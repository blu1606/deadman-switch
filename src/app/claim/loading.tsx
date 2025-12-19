import { VaultCardSkeleton } from '@/components/ui/skeletons';

export default function ClaimLoading() {
    return (
        <main className="min-h-screen pt-20 pb-10 px-4">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Claim Legacies</h1>
                    <p className="text-dark-400">Searching for legacies...</p>
                </div>

                {/* Content Shell */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <VaultCardSkeleton />
                    <VaultCardSkeleton />
                    <VaultCardSkeleton />
                </div>
            </div>
        </main>
    );
}
