import { FC, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@coral-xyz/anchor';

interface MagicLinkSettingsProps {
    vault: {
        publicKey: PublicKey;
        recipient: PublicKey; // Required for key derivation/checks if needed, though not directly used in the toggle logic
    };
    initialEnabled: boolean;
    onError: (msg: string) => void;
}

const MagicLinkSettings: FC<MagicLinkSettingsProps> = ({ vault, initialEnabled, onError }) => {
    const { publicKey, signTransaction, signAllTransactions } = useWallet();
    const { connection } = useConnection();

    const [magicLinkEnabled, setMagicLinkEnabled] = useState(initialEnabled);
    const [updatingMagicLink, setUpdatingMagicLink] = useState(false);

    const toggleMagicLink = async () => {
        if (updatingMagicLink) return;

        // Ensure wallet is connected
        if (!publicKey || !signTransaction || !signAllTransactions) {
            onError("Please connect your wallet first");
            return;
        }

        setUpdatingMagicLink(true);

        try {
            const provider = new AnchorProvider(
                connection,
                { publicKey, signTransaction, signAllTransactions },
                { commitment: 'confirmed' }
            );

            // Dynamic import to avoid SSR issues with IDL loading if any
            const idl = await import('@/idl/deadmans_switch.json');
            const program = new Program(idl as any, provider);

            const newEnabled = !magicLinkEnabled;

            // Fetch platform key if enabling
            let delegateKey = null;
            if (newEnabled) {
                try {
                    const res = await fetch('/api/system/delegate-key');
                    if (!res.ok) throw new Error("Failed to fetch server key");
                    const data = await res.json();
                    delegateKey = new PublicKey(data.publicKey);
                } catch (err) {
                    console.error("Delegate fetch error", err);
                    throw new Error("Could not find Deadman Switch server key");
                }
            }

            // 1. Update Delegate on Contract
            await (program.methods as any)
                .setDelegate(delegateKey) // setDelegate accepts Option<Pubkey> so null is fine
                .accounts({
                    vault: vault.publicKey,
                    owner: publicKey,
                })
                .rpc();

            // 2. Update Local State & Storage
            setMagicLinkEnabled(newEnabled);
            if (typeof window !== 'undefined') {
                localStorage.setItem(`magic_link_${vault.publicKey.toBase58()}`, String(newEnabled));
            }

        } catch (e: any) {
            console.error("Failed to toggle magic link", e);
            onError("Failed to update Magic Link: " + e.message);
        } finally {
            setUpdatingMagicLink(false);
        }
    };

    return (
        <div className="border-t border-dark-700 pt-6 mb-6">
            <h3 className="text-sm font-bold text-dark-300 mb-4 uppercase tracking-wider">
                Frictionless Check-in
            </h3>

            <div className="flex items-center justify-between">
                <div>
                    <label className="text-sm text-white block">Email Magic Link</label>
                    <p className="text-xs text-dark-400 max-w-[200px] mt-1">
                        Allow checking in directly from your email reminder. No wallet connection required.
                    </p>
                </div>
                <button
                    onClick={toggleMagicLink}
                    className={`w-12 h-6 rounded-full transition-colors relative ${magicLinkEnabled ? 'bg-primary-600' : 'bg-dark-600'} ${updatingMagicLink ? 'opacity-50 cursor-wait' : ''}`}
                    disabled={updatingMagicLink}
                    type="button"
                >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${magicLinkEnabled ? 'left-7' : 'left-1'}`} />
                </button>
            </div>
        </div>
    );
};

export default MagicLinkSettings;
