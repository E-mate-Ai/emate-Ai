'use client';

type EventParams = Record<string, string | number | boolean | undefined | null>;

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Universal client-side analytics tracker
 * Supports Google Analytics (gtag), custom Web Vitals, and local event telemetry.
 */
export function trackEvent(eventName: string, params?: EventParams) {
  if (typeof window === 'undefined') return;

  // Log in development for auditability
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Analytics] Event "${eventName}":`, params);
  }

  // 1. Google Analytics gtag if initialized
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }

  // 2. Custom window custom event for local observers / extensions
  try {
    const customEvt = new CustomEvent('nk-analytics-event', {
      detail: { eventName, params, timestamp: Date.now() },
    });
    window.dispatchEvent(customEvt);
  } catch (_) {}
}

/**
 * Page view tracking
 */
export function trackPageView(url: string) {
  if (typeof window === 'undefined') return;

  if (typeof window.gtag === 'function') {
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    if (gaId) {
      window.gtag('config', gaId, {
        page_path: url,
      });
    }
  }
}
