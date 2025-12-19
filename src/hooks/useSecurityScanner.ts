'use client';

import { useState } from 'react';
import { scanForSecrets, ScanResult } from '@/utils/safetyScanner';

export function useSecurityScanner() {
    const [securityAlert, setSecurityAlert] = useState<{
        isOpen: boolean;
        result: ScanResult;
    }>({ isOpen: false, result: { detected: false } });

    const scan = (value: string) => {
        const result = scanForSecrets(value);
        if (result.detected) {
            setSecurityAlert({ isOpen: true, result });
            return true;
        }
        return false;
    };

    const closeAlert = () => {
        setSecurityAlert(prev => ({ ...prev, isOpen: false }));
    };

    const ignoreAlert = () => {
        setSecurityAlert(prev => ({ ...prev, isOpen: false }));
    };

    return {
        securityAlert,
        scan,
        closeAlert,
        ignoreAlert
    };
}
