import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

const siteUrl = 'https://emate.live';

/**
 * Breadcrumbs component with BreadcrumbList JSON-LD structured data.
 * - First item is always "Home" unless overridden.
 * - Last item (current page) is rendered as plain text, not a link.
 * Usage:
 *   <Breadcrumbs items={[{ label: 'AI Flashcard Generator', href: '/ai-flashcard-generator' }]} />
 */
export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const allItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    ...items,
  ];

  // JSON-LD BreadcrumbList
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${siteUrl}${item.href}` } : {}),
    })),
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Visual Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className={`flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap ${className}`}
      >
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <ChevronRight
                  size={12}
                  className="text-zinc-400 dark:text-zinc-600 flex-shrink-0"
                  aria-hidden="true"
                />
              )}
              {isLast || !item.href ? (
                <span
                  className="text-zinc-700 dark:text-zinc-300 font-medium truncate max-w-[180px]"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-0.5 truncate max-w-[180px]"
                >
                  {index === 0 && <Home size={11} className="flex-shrink-0" aria-hidden="true" />}
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </>
  );
}
