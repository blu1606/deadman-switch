'use client';

import { FC } from 'react';
import { motion } from 'framer-motion';
import VaultSafe from '../VaultSafe';

interface Props {
    isDecrypting: boolean;
}

export const ClaimUnlockingState: FC<Props> = ({ isDecrypting }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
        >
            <VaultSafe state={isDecrypting ? 'unlocking' : 'open'} />
            <motion.p
                className="mt-6 text-primary-400 font-mono text-sm uppercase tracking-wider"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: isDecrypting ? Infinity : 0 }}
            >
                {isDecrypting ? 'DECRYPTING VAULT...' : 'ACCESS GRANTED'}
            </motion.p>
        </motion.div>
    );
};
