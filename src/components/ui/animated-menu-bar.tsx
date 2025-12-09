import React from 'react';
import { Home, LayoutDashboard, PlusCircle, Unlock, Info, Archive } from 'lucide-react';

export type NavKey = 'home' | 'dashboard' | 'create' | 'claim' | 'about' | 'archive';

interface MenuBarProps {
  active?: NavKey;
  onSelect?: (key: NavKey) => void;
}

const icons: Record<NavKey, React.ReactNode> = {
  home: <Home className="w-5 h-5" />,
  dashboard: <LayoutDashboard className="w-5 h-5" />,
  create: <PlusCircle className="w-5 h-5" />,
  claim: <Unlock className="w-5 h-5" />,
  archive: <Archive className="w-5 h-5" />,
  about: <Info className="w-5 h-5" />
};

interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const IconButton: React.FC<IconButtonProps> = ({ icon, label, active, onClick }) => {
  const [hovered, setHovered] = React.useState(false);
  const [showTooltip, setShowTooltip] = React.useState(false);
  const tooltipTimeout = React.useRef<NodeJS.Timeout | null>(null);

  // Calculate width based on label length (min 44px for icon, plus label)
  const expandedWidth = Math.max(44 + label.length * 8 + 24, 100);

  const isExpanded = (hovered || active);

  // Show tooltip on mobile tap
  const handleMobileTooltip = (e: React.MouseEvent) => {
    if (window.innerWidth < 640) {
      if (!isExpanded) {
        e.preventDefault();
        setShowTooltip(true);
        if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
        tooltipTimeout.current = setTimeout(() => setShowTooltip(false), 1200);
      }
    }
    if (onClick) onClick();
  };

  React.useEffect(() => () => {
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
  }, []);

  return (
    <button
      type="button"
      aria-label={label}
      className={`flex items-center rounded-xl border transition-all focus:outline-none relative overflow-visible
        ${active
          ? 'border-primary-500/50 bg-primary-500/10 text-primary-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] font-medium'
          : 'border-transparent text-dark-400 hover:text-white hover:bg-white/5'
        }
        duration-300
        h-11
      `}
      style={{
        width: isExpanded ? expandedWidth : 44,
        paddingLeft: isExpanded ? 5 : 0,
        paddingRight: isExpanded ? 16 : 0,
        justifyContent: isExpanded ? 'flex-start' : 'center'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleMobileTooltip}
    >
      {/* Tooltip for mobile */}
      <span
        className={`sm:hidden absolute -top-8 left-1/2 -translate-x-1/2 bg-dark-800 text-white text-xs rounded px-2 py-1 shadow-lg border border-white/10 transition-opacity duration-200 pointer-events-none z-20 whitespace-nowrap
          ${showTooltip ? 'opacity-100' : 'opacity-0'}`}
      >
        {label}
      </span>

      <span className="flex items-center justify-center w-11 h-11 flex-shrink-0">
        {icon}
      </span>

      <span
        className={`text-sm transition-opacity duration-300 whitespace-nowrap overflow-hidden
          ${isExpanded ? 'opacity-100 delay-100' : 'opacity-0'}
        `}
      >
        {label}
      </span>
    </button>
  );
};

export const MenuBar = ({ active = 'home', onSelect }: MenuBarProps) => {
  return (
    <nav className="flex items-center gap-1 bg-dark-900/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 w-fit">
      <IconButton icon={icons.home} label="Home" active={active === 'home'} onClick={() => onSelect?.('home')} />
      <div className="w-px h-5 bg-white/10 mx-1" />
      <IconButton icon={icons.dashboard} label="My Vaults" active={active === 'dashboard'} onClick={() => onSelect?.('dashboard')} />
      <IconButton icon={icons.create} label="Create" active={active === 'create'} onClick={() => onSelect?.('create')} />
      <IconButton icon={icons.claim} label="Claim" active={active === 'claim'} onClick={() => onSelect?.('claim')} />
      <IconButton icon={icons.archive} label="Archive" active={active === 'archive'} onClick={() => onSelect?.('archive')} />
    </nav>
  );
};
