'use client';

import { usePathname, useRouter } from 'next/navigation';
import { MenuBar, NavKey } from '@/components/ui/animated-menu-bar';

export default function HeaderNav() {
    const pathname = usePathname();
    const router = useRouter();

    // Map pathname to nav key
    const getActiveKey = (): NavKey => {
        if (pathname === '/') return 'home';
        if (pathname.startsWith('/dashboard')) return 'dashboard';
        if (pathname.startsWith('/create')) return 'create';
        if (pathname.startsWith('/claim')) return 'claim';
        if (pathname.startsWith('/archive')) return 'archive';
        return 'home'; // default
    };

    const handleNavSelect = (key: NavKey) => {
        switch (key) {
            case 'home': router.push('/'); break;
            case 'dashboard': router.push('/dashboard'); break;
            case 'create': router.push('/create'); break;
            case 'claim': router.push('/claim'); break;
            case 'archive': router.push('/archive'); break;
            default: router.push('/');
        }
    };

    return (
        <div className="flex-grow flex justify-center -ml-12 md:ml-0">
            <MenuBar
                active={getActiveKey()}
                onSelect={handleNavSelect}
            />
        </div>
    );
}
