import Link from 'next/link';
import Image from 'next/image';
import HeaderNav from './HeaderNav';
import HeaderActions from './HeaderActions';

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 pt-4 px-4 md:px-8 pointer-events-none">
            <div className="max-w-7xl mx-auto flex items-start justify-between pointer-events-auto">

                {/* 1. Logo Section (Left) - Fully SSR Static */}
                <div className="flex-shrink-0 pt-2">
                    <Link href="/" className="flex items-center gap-3 group backdrop-blur-md bg-dark-900/50 p-2 pr-4 rounded-xl border border-white/5 hover:border-primary-500/30 transition-all">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/20 overflow-hidden relative">
                            <Image
                                src="/icon_1.png"
                                alt="KipSwitch Logo"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <span className="font-bold text-sm tracking-tight text-white group-hover:text-primary-200 transition-colors hidden sm:block">
                            KipSwitch
                        </span>
                    </Link>
                </div>

                {/* 2. Navigation Section (Center) - Client Island */}
                <HeaderNav />

                {/* 3. Wallet Section (Right) - Client Island */}
                <HeaderActions />
            </div>
        </header>
    );
}
