'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type KipMood = 'neutral' | 'happy' | 'sad' | 'excited' | 'scared';

interface KipMoodContextType {
    mood: KipMood;
    setMood: (mood: KipMood) => void;
}

const KipMoodContext = createContext<KipMoodContextType | undefined>(undefined);

export function KipMoodProvider({ children }: { children: ReactNode }) {
    const [mood, setMood] = useState<KipMood>('neutral');

    return (
        <KipMoodContext.Provider value={{ mood, setMood }}>
            {children}
        </KipMoodContext.Provider>
    );
}

export function useKipMood() {
    const context = useContext(KipMoodContext);
    if (context === undefined) {
        throw new Error('useKipMood must be used within a KipMoodProvider');
    }
    return context;
}
