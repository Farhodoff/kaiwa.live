import React from 'react';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  collapsed?: boolean;
  showText?: boolean;
  className?: string;
}

export const ToriiGateIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Subtle Sun Disc Behind Gate */}
    <circle cx="24" cy="19" r="8" fill="#E8483A" opacity="0.25" />
    {/* Top Kasagi (Curved Upper Crossbeam) */}
    <path
      d="M4 10C14 8.5 34 8.5 44 10C45.5 10.2 45.5 12.5 44 13C34 11.5 14 11.5 4 13C2.5 12.5 2.5 10.2 4 10Z"
      fill="currentColor"
    />
    {/* Shimaki (Secondary Upper Beam) */}
    <path d="M7 14H41V16.8H7V14Z" fill="currentColor" />
    {/* Gakuzuka (Center Plaque Tablet) */}
    <rect x="22" y="16.8" width="4" height="5.2" rx="0.5" fill="#C9A961" />
    {/* Nuki (Lower Penetrating Crossbeam) */}
    <path d="M5 22H43V24.8H5V22Z" fill="currentColor" />
    {/* Left Hashira (Left Pillar - slightly tapered) */}
    <path d="M12.5 16.8L11 41H15L16 16.8H12.5Z" fill="currentColor" />
    {/* Right Hashira (Right Pillar - slightly tapered) */}
    <path d="M32 16.8L33 41H37L35.5 16.8H32Z" fill="currentColor" />
    {/* Left Base Stone (Daiishi) */}
    <rect x="9" y="40" width="7" height="3" rx="1" fill="#C9A961" opacity="0.85" />
    {/* Right Base Stone (Daiishi) */}
    <rect x="32" y="40" width="7" height="3" rx="1" fill="#C9A961" opacity="0.85" />
  </svg>
);

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  collapsed = false,
  showText = true,
  className = '',
}) => {
  const sizeConfig = {
    sm: {
      box: 'w-8 h-8 rounded-xl',
      iconSize: 18,
      title: 'text-base',
      sub: 'text-[9px]',
    },
    md: {
      box: 'w-10 h-10 rounded-2xl',
      iconSize: 22,
      title: 'text-lg',
      sub: 'text-[10px]',
    },
    lg: {
      box: 'w-13 h-13 rounded-2xl',
      iconSize: 28,
      title: 'text-xl',
      sub: 'text-[11px]',
    },
  };

  const currentSize = sizeConfig[size];

  return (
    <div className={`flex select-none items-center gap-3 ${className}`}>
      {/* Japanese Torii Emblem Container */}
      <div
        className={`group relative flex shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/60 text-[#E8483A] shadow-xs transition-all duration-300 hover:border-[#E8483A]/50 ${currentSize.box}`}
      >
        <ToriiGateIcon
          size={currentSize.iconSize}
          className="drop-shadow-xs relative z-10 transition-transform duration-200 group-hover:scale-105"
        />
      </div>

      {/* Brand Title with Sumi-e & Hanko Typography */}
      {showText && !collapsed && (
        <div className="flex flex-col justify-center duration-200 animate-in fade-in">
          <div className="flex items-center gap-0.5 leading-none">
            <span
              className={`font-display font-black tracking-tight text-foreground ${currentSize.title}`}
            >
              kaiwa
            </span>
            <span
              className={`font-display font-black tracking-tight text-[#E8483A] ${currentSize.title}`}
            >
              .live
            </span>
          </div>
          <span
            className={`font-japanese mt-0.5 tracking-widest text-muted-foreground/80 ${currentSize.sub}`}
          >
            会話 • AI 日本語
          </span>
        </div>
      )}
    </div>
  );
};

export default AppLogo;
