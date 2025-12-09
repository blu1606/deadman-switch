'use client';

import { DemoProvider, useDemoVault } from '@/hooks/useDemoVault';
import DemoOverlay from '@/components/demo/DemoOverlay';
import DemoClaim from '@/components/demo/DemoClaim';
import DemoCreate from '@/components/demo/DemoCreate';
import DemoDashboard from '@/components/demo/DemoDashboard';
import { AnimatePresence, motion } from 'framer-motion';

function DemoContent() {
    const { state } = useDemoVault();

    return (
        <AnimatePresence mode="wait">
            {state === 'CLAIMING' && (
                <motion.div key="claim" exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                    <DemoClaim />
                </motion.div>
            )}

            {state === 'CREATING' && (
                <motion.div key="create" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <DemoCreate />
                </motion.div>
            )}

            {(state === 'LIVE' || state === 'RELEASED') && (
                <motion.div key="dashboard" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <DemoDashboard />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Wrapper to provide context since we can't use hook in the same component exporting Provider
export default function DemoPage() {
    return (
        <DemoProvider>
            <DemoContentWrapper />
        </DemoProvider>
    );
}

function DemoContentWrapper() {
    const { actions, state } = useDemoVault();

    // Auto-start demo if IDLE (first load)
    if (state === 'IDLE') {
        actions.startDemo();
    }

    return (
        <DemoOverlay>
            <DemoContent />
        </DemoOverlay>
    );
}
