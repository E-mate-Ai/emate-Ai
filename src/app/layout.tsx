import React from 'react';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Outfit, JetBrains_Mono, Geist } from 'next/font/google';
import { Toaster } from 'sonner';
import '../styles/tailwind.css';
import RouteTracker from '@/components/RouteTracker';
import { AuthListener } from '@/components/AuthListener';
import CookieBanner from '@/components/CookieBanner';
import { Analytics } from '@vercel/analytics/next';
import { cn } from "@/lib/utils";
import GoogleAnalytics from '@/components/GoogleAnalytics';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#252525' },
  ],
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://emate.live';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'e-Mate AI',
  title: {
    default: 'e-Mate AI — Smart Study Copilot & Academic Topper Workspace',
    template: '%s — e-Mate AI',
  },
  description:
    'AI-powered study workspace for interactive flashcards, quizzes, PDF summarization, and hands-free voice studying.',
  keywords: [
    'AI study assistant',
    'e-Mate AI',
    'emate.live',
    'flashcard generator',
    'AI topper',
    'quiz generator',
    'academic copilot',
    'syllabus notes',
    'exam preparation AI',
  ],
  authors: [{ name: 'e-Mate AI Team', url: siteUrl }],
  creator: 'e-Mate AI',
  publisher: 'e-Mate AI Technologies',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'e-Mate AI',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    other: [
      {
        rel: 'mask-icon',
        url: '/asset/images/e.svg',
        color: '#2563eb',
      },
    ],
  },
  openGraph: {
    title: 'e-Mate AI — Smart Study Copilot & Academic Topper Workspace',
    description:
      'AI-powered study workspace for interactive flashcards, quizzes, PDF summarization, and hands-free voice studying.',
    url: siteUrl,
    siteName: 'e-Mate AI',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'e-Mate AI — Smart Study Copilot & Academic Topper Workspace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'e-Mate AI — Smart Study Copilot & Academic Topper Workspace',
    description:
      'AI-powered study workspace for interactive flashcards, quizzes, PDF summarization, and hands-free voice studying.',
    creator: '@emate_ai',
    images: ['/opengraph-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your Google Search Console verification code in NEXT_PUBLIC_GSC_VERIFICATION env var
    // or replace the value below with your actual verification string.
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION || 'googlec8f09d5210bf4299',
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://emate.live/#website',
      url: 'https://emate.live/',
      name: 'e-Mate AI',
      alternateName: ['eMate AI', 'eMate', 'e-Mate', 'emate.live'],
      description:
        'AI-powered study assistant that helps students plan their preparation, understand concepts, practice with quizzes, revise effectively, and prepare for exams.',
      publisher: {
        '@id': 'https://emate.live/#organization',
      },
      inLanguage: 'en-US',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://emate.live/?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://emate.live/#organization',
      name: 'e-Mate AI',
      alternateName: ['eMate AI', 'emate.live'],
      url: 'https://emate.live/',
      logo: {
        '@type': 'ImageObject',
        '@id': 'https://emate.live/#logo',
        url: 'https://emate.live/android-chrome-512x512.png',
        contentUrl: 'https://emate.live/android-chrome-512x512.png',
        width: 512,
        height: 512,
        caption: 'e-Mate AI',
      },
      image: { '@id': 'https://emate.live/#logo' },
      sameAs: [
        'https://emate.live',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@emate.live',
        availableLanguage: ['English'],
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://emate.live/#software',
      name: 'e-Mate AI',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description:
        'AI-powered study workspace for interactive flashcards, quizzes, PDF summarization, and personalized revision workflows for students.',
      url: 'https://emate.live/',
      author: {
        '@id': 'https://emate.live/#organization',
      },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("overflow-x-hidden w-full max-w-[100vw]", "font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        {/* Favicons — explicit link tags alongside Next.js metadata for maximum compatibility */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        {/* Site-wide structured data — rendered synchronously so Googlebot sees it on first parse */}
        <script
          id="structured-data-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var savedTheme = localStorage.getItem('nk-theme') || 'light';
                document.documentElement.classList.add(savedTheme);
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning={true}
        className={`${geist.className} ${geist.variable} ${outfit.variable} ${jetbrainsMono.variable} overflow-x-hidden w-full max-w-[100vw] antialiased min-h-screen bg-background text-foreground`}
      >
        {/* Structured data is now in <head> above — no duplicate Script needed here */}
        <GoogleAnalytics />
        <AuthListener />
        <RouteTracker />
        <Analytics />
        {children}
        <CookieBanner />
        <Toaster
          position="bottom-right"
          theme="system"
          closeButton
          richColors
          toastOptions={{
            className: 'font-sans text-sm rounded-xl backdrop-blur-md border shadow-xl',
            style: {
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
            },
          }}
        />

        <Script
          src="https://static.rocket.new/rocket-web.js?_cfg=https%3A%2F%2Femate9631back.builtwithrocket.new&_be=https%3A%2F%2Fappanalytics.rocket.new&_v=0.1.20"
          strategy="lazyOnload"
        />
        <Script
          src="https://static.rocket.new/rocket-shot.js?v=0.0.2"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}

