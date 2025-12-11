'use client';

import { useKipMood } from '@/context/KipMoodContext';
import { ReactNode } from 'react';

export default function ProblemSectionWrapper({ children }: { children: ReactNode }) {
    const { setMood } = useKipMood();

    return (
        <div
            onMouseEnter={() => setMood('scared')}
            onMouseLeave={() => setMood('neutral')}
        >
            {children}
        </div>
    );
}
