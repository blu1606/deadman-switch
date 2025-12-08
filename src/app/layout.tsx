import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import dynamic from 'next/dynamic';

// Dynamic import wallet provider to avoid SSR issues
const WalletContextProvider = dynamic(
    () => import('@/components/wallet/WalletContextProvider'),
    { ssr: false }
);

const Header = dynamic(
    () => import('@/components/layout/Header'),
    { ssr: false }
);

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });

export const metadata: Metadata = {
    title: "Deadman's Switch | Digital Legacy Protocol",
    description: 'A decentralized dead man\'s switch protocol on Solana for secure digital inheritance.',
    keywords: ['solana', 'dead man switch', 'digital legacy', 'crypto inheritance', 'web3'],
    manifest: '/manifest.json',
};

export const viewport: Viewport = {
    themeColor: '#020617',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-void-black text-signal-white`}>
                <WalletContextProvider>
                    <Header />
                    <div className="pt-16 md:pt-16">
                        {children}
                    </div>
                </WalletContextProvider>
            </body>
        </html>
    );
}
