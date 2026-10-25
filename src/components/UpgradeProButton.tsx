'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface UpgradeProButtonProps {
  className?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Capsule "Upgrade Pro" button matching the sleek pill design:
 * - Solid vibrant blue pill button
 * - Clean white "Upgrade" label
 * - Inner translucent rounded pill container displaying "Pro"
 */
export default function UpgradeProButton({
  className = '',
  onClick,
  size = 'md',
}: UpgradeProButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      router.push('/upgrade');
    }
  };

  const sizeClasses = {
    sm: 'h-7 pl-3 pr-1 text-[11px] gap-1',
    md: 'h-8 sm:h-8.5 pl-3.5 sm:pl-4 pr-1.5 py-1 text-xs sm:text-[13px] gap-1.5',
    lg: 'h-10 pl-5 pr-2 py-1.5 text-sm gap-2',
  }[size];

  const badgeSizeClasses = {
    sm: 'px-1.5 py-0.2 text-[9px]',
    md: 'px-2 py-0.5 text-[10px] sm:text-[11px]',
    lg: 'px-2.5 py-0.5 text-xs',
  }[size];

  return (
    <Button
      type="button"
      onClick={handleClick}
      className={`font-medium shadow-sm shrink-0 ${sizeClasses} ${className}`}
      title="Upgrade to Pro"
    >
      <span>Upgrade</span>
      <span
        className={`rounded-full bg-white/22 backdrop-blur-[2px] font-semibold text-white leading-tight ${badgeSizeClasses}`}
      >
        Pro
      </span>
    </Button>
  );
}
