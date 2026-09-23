'use client';

import React, { memo, useMemo } from 'react';

interface AppLogoProps {
  src?: string; // Image source (optional)
  iconName?: string; // Icon name when no image
  size?: number; // Size for icon/image
  className?: string; // Additional classes
  onClick?: () => void; // Click handler
}

const AppLogo = memo(function AppLogo({
  src,
  iconName,
  size = 36,
  className = '',
  onClick,
}: AppLogoProps) {
  const containerClassName = useMemo(() => {
    const classes = ['flex items-center'];
    if (onClick) classes.push('cursor-pointer hover:opacity-80 transition-opacity');
    if (className) classes.push(className);
    return classes.join(' ');
  }, [onClick, className]);

  if (src) {
    return (
      <div className={containerClassName} onClick={onClick}>
        <img src={src} alt="e-Mate AI Logo" width={size} height={size} className="flex-shrink-0 rounded-md" />
      </div>
    );
  }

  return (
    <div className={containerClassName} onClick={onClick}>
      <div
        className="flex items-center justify-center rounded-xl font-black tracking-[-0.04em] text-white shadow-sm"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #10a37f 0%, #2563eb 100%)',
          fontSize: Math.max(14, size * 0.5),
        }}
      >
        eM
      </div>
    </div>
  );
});

export default AppLogo;
