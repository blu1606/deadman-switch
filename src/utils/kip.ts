
export interface KipPalette {
    id: number;
    name: string;
    colors: [string, string]; // [start, end] for gradient
    shadow: string;
}

export const KIP_PALETTES: KipPalette[] = [
    {
        id: 0,
        name: 'Original',
        colors: ['#34D399', '#10B981'], // Emerald 400 -> 500
        shadow: 'rgba(16, 185, 129, 0.6)'
    },
    {
        id: 1,
        name: 'Ocean',
        colors: ['#22D3EE', '#3B82F6'], // Cyan 400 -> Blue 500
        shadow: 'rgba(59, 130, 246, 0.6)'
    },
    {
        id: 2,
        name: 'Galaxy',
        colors: ['#C084FC', '#EC4899'], // Purple 400 -> Pink 500
        shadow: 'rgba(236, 72, 153, 0.6)'
    },
    {
        id: 3,
        name: 'Solar',
        colors: ['#FB923C', '#F59E0B'], // Orange 400 -> Amber 500
        shadow: 'rgba(245, 158, 11, 0.6)'
    },
    {
        id: 4,
        name: 'Phantom',
        colors: ['#2DD4BF', '#64748B'], // Teal 400 -> Slate 500
        shadow: 'rgba(100, 116, 139, 0.6)'
    },
];

export function getKipPalette(seed: string): KipPalette {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % KIP_PALETTES.length;
    return KIP_PALETTES[index];
}

export type KipState = 'healthy' | 'hungry' | 'critical' | 'ghost';

export function getKipState(healthPercentage: number, isReleased: boolean): KipState {
    if (isReleased) return 'ghost';
    if (healthPercentage < 25) return 'critical';
    if (healthPercentage < 50) return 'hungry';
    return 'healthy';
}
