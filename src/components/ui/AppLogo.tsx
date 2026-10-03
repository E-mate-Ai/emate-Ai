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
  src = '/asset/images/e.svg',
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

  return (
    <div className={containerClassName} onClick={onClick}>
      <img
        src={src || '/asset/images/e.svg'}
        alt="e-Mate AI Logo"
        width={size}
        height={size}
        className="flex-shrink-0 rounded-md object-contain"
      />
    </div>
  );
});

export default AppLogo;
