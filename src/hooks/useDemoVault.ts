import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type DemoState = 'IDLE' | 'CLAIMING' | 'CREATING' | 'LIVE' | 'RELEASED';

interface DemoVaultData {
    name: string;
    balanceSol: number;
    balanceUsdc: number;
    timerTotal: number;
    timeRemaining: number;
    health: number; // 0-100
    isReleased: boolean;
}

interface DemoContextType {
    state: DemoState;
    step: number; // 1, 2, 3
    vault: DemoVaultData;
    actions: {
        startDemo: () => void;
        claimVault: () => void;
        createVault: (name: string, recipient: string) => void;
        checkIn: () => void;
        fastForward: () => void;
        resetDemo: () => void;
    };
}

const DemoContext = createContext<DemoContextType | null>(null);

const INITIAL_VAULT: DemoVaultData = {
    name: 'Agent 007 Vault',
    balanceSol: 0,
    balanceUsdc: 0,
    timerTotal: 10, // 10 seconds for demo
    timeRemaining: 0,
    health: 0,
    isReleased: false,
};

export function DemoProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<DemoState>('IDLE');
    const [step, setStep] = useState(0);
    const [vault, setVault] = useState<DemoVaultData>(INITIAL_VAULT);

    // Timer Logic for LIVE state
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (state === 'LIVE' && !vault.isReleased && vault.timeRemaining > 0) {
            interval = setInterval(() => {
                setVault(prev => {
                    const nextTime = Math.max(0, prev.timeRemaining - 1);
                    const health = Math.floor((nextTime / prev.timerTotal) * 100);

                    if (nextTime === 0) {
                        // Vault dies
                        return { ...prev, timeRemaining: 0, health: 0, isReleased: true };
                    }
                    return { ...prev, timeRemaining: nextTime, health };
                });
            }, 1000);
        } else if (state === 'LIVE' && vault.timeRemaining === 0 && !vault.isReleased) {
            // Transition to Released if naturally expired
            setVault(prev => ({ ...prev, isReleased: true }));
            setState('RELEASED');
        }

        return () => clearInterval(interval);
    }, [state, vault.timeRemaining, vault.isReleased, vault.timerTotal]);

    // Check for state transition when released
    useEffect(() => {
        if (state === 'LIVE' && vault.isReleased) {
            setState('RELEASED');
        }
    }, [vault.isReleased, state]);


    const actions = {
        startDemo: () => {
            setState('CLAIMING');
            setStep(1);
            setVault({
                ...INITIAL_VAULT,
                balanceSol: 0.1, // Airdrop 0.1 SOL mock
                timeRemaining: 0, // Claim phase: vault is dead/expired usually? Or just ready? 
                // Narrative: "You found a vault". It's ready to claim.
                isReleased: true // Usually claiming implies it's released/expired? 
                // Actually step 1 is "Claim Vault". 
            });
        },
        claimVault: () => {
            // User claims the loot.
            // Transition to CREATING
            setVault(prev => ({
                ...prev,
                balanceUsdc: 100, // Found 100 USDC
                isReleased: false // Reset for creation
            }));
            setState('CREATING');
            setStep(2);
        },
        createVault: (name: string, recipient: string) => {
            // User creates their own vault
            setVault(prev => ({
                ...prev,
                name: name || 'My Secret Vault',
                balanceSol: prev.balanceSol - 0.01, // Gas fee
                timeRemaining: 10,
                timerTotal: 10,
                health: 100,
                isReleased: false
            }));
            setState('LIVE');
            setStep(3);
        },
        checkIn: () => {
            setVault(prev => ({
                ...prev,
                timeRemaining: prev.timerTotal,
                health: 100
            }));
        },
        fastForward: () => {
            setVault(prev => ({
                ...prev,
                timeRemaining: 0,
                health: 0,
                isReleased: true // Force release
            }));
            setState('RELEASED');
        },
        resetDemo: () => {
            setState('IDLE');
            setStep(0);
            setVault(INITIAL_VAULT);
        }
    };

    return (
        <DemoContext.Provider value= {{ state, step, vault, actions }
}>
    { children }
    </DemoContext.Provider>
    );
    );
}

export function useDemoVault() {
    const context = useContext(DemoContext);
    if (!context) {
        throw new Error('useDemoVault must be used within a DemoProvider');
    }
    return context;
}
