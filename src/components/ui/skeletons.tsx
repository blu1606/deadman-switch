import React from 'react';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`animate-pulse rounded-md bg-white/5 ${className}`}
            {...props}
        />
    );
}

export function VaultCardSkeleton() {
    return (
        <div className="card h-48 flex flex-col justify-between border-white/5 bg-dark-800/50">
            <div>
                <div className="flex justify-between items-start mb-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-10 flex-1 rounded-xl" />
                <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
        </div>
    );
}

export function StatGridSkeleton() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card p-4 border-white/5 bg-dark-800/50">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                </div>
            ))}
        </div>
    );
}
