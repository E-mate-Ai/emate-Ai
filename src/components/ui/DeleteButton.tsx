'use client';

import React from 'react';
import './DeleteButton.css';

export interface DeleteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  iconClassName?: string;
}

export default function DeleteButton({
  label = 'Delete',
  size = 'md',
  className = '',
  iconClassName = '',
  onClick,
  title,
  type = 'button',
  ...props
}: DeleteButtonProps) {
  const sizeClass = size === 'sm' ? 'size-sm' : size === 'lg' ? 'size-lg' : 'size-md';

  return (
    <button
      type={type}
      onClick={onClick}
      title={title || label}
      aria-label={props['aria-label'] || label}
      className={`uiverse-delete-btn ${sizeClass}${className ? ` ${className}` : ''}`}
      {...props}
    >
      <span className="btn-label" aria-hidden="true">
        {label}
      </span>
      <svg
        viewBox="0 0 448 512"
        className={`svgIcon${iconClassName ? ` ${iconClassName}` : ''}`}
        aria-hidden="true"
      >
        <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
      </svg>
    </button>
  );
}

