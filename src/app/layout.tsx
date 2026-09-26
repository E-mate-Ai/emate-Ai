import { ClerkProvider } from '@clerk/nextjs';
import { shadcn } from '@clerk/ui/themes';
import React from 'react';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Outfit, JetBrains_Mono, Geist } from 'next/font/google';
import { Toaster } from 'sonner';
import '../styles/tailwind.css';
import RouteTracker from '@/components/RouteTracker';
import { AuthListener } from '@/components/AuthListener';
import CookieBanner from '@/components/CookieBanner';
import { cn } from '@/lib/utils';

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
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#09090B' },
  ],
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://emate-ai.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'e-Mate AI — Smart Study Copilot & Academic Topper Workspace',
    template: '%s — e-Mate AI',
  },
  description:
    'AI-powered study workspace for interactive flashcards, quizzes, PDF summarization, and hands-free voice studying.',
  keywords: [
    'AI study assistant',
    'e-Mate AI',
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
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
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
        url: '/opengraph-image',
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
    images: ['/opengraph-image'],
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
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn('overflow-x-hidden w-full max-w-[100vw]', 'font-sans', geist.variable)}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
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
        <ClerkProvider appearance={{ theme: shadcn }}>
          <AuthListener />
          <RouteTracker />
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
          <Script src="https://static.rocket.new/rocket-shot.js?v=0.0.2" strategy="lazyOnload" />
        </ClerkProvider>
      </body>
    </html>
  );
}
