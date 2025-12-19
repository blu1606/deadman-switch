import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import dynamic from 'next/dynamic';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

// Dynamic import wallet provider to avoid SSR issues
const WalletContextProvider = dynamic(
    () => import('@/components/wallet/WalletContextProvider'),
    { ssr: false }
);

if (typeof window !== 'undefined') {
    // Polyfill global for libraries that expect it
    (window as any).global = window;
    import('buffer').then(({ Buffer }) => {
        window.Buffer = window.Buffer || Buffer;
    });
}

import Header from '@/components/layout/Header';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });

export const metadata: Metadata = {
    title: 'KipSwitch | Digital Guardian on Solana',
    description: 'KipSwitch is an automated dead man\'s switch on Solana. It monitors your activity and executes your improved will or transfers assets if you go inactive.',
    openGraph: {
        title: 'KipSwitch | Digital Guardian on Solana',
        description: 'Secure your legacy on-chain. Automated, keyless, and reliable.',
        url: 'https://kipswitch.vercel.app/',
        siteName: 'KipSwitch',
    },
    keywords: ['solana', 'digital legacy', 'crypto inheritance', 'dead man switch', 'whistleblower switch', 'key recovery', 'self-custody backup', 'web3 estate planning'],
    manifest: '/manifest.json',
    icons: {
        icon: '/icon_1.png',
        shortcut: '/icon_1.png',
        apple: '/icon_1.png',
    },
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
                <script
                    id="polyfill-global"
                    dangerouslySetInnerHTML={{
                        __html: `
                            if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
                                window.global = window;
                            }
                        `
                    }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "SoftwareApplication",
                            "name": "KipSwitch Protocol",
                            "applicationCategory": "FinanceApplication",
                            "operatingSystem": "Web",
                            "description": "A decentralized dead man's switch on Solana for secure digital inheritance and crypto self-custody backup.",
                            "offers": {
                                "@type": "Offer",
                                "price": "0",
                                "priceCurrency": "USD"
                            }
                        })
                    }}
                />
                <WalletContextProvider>
                    <Header />
                    <div className="pt-16 md:pt-16">
                        {children}
                    </div>
                </WalletContextProvider>
                <SpeedInsights />
                <Analytics />
            </body>
        </html>
    );
}
