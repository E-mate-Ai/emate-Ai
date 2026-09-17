import React from 'react';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import '../styles/tailwind.css';
import RouteTracker from '@/components/RouteTracker';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

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

export const metadata: Metadata = {
  title: 'e-Mate AI — Smart Study Copilot & Workflow Assistant',
  description:
    'AI-powered study workspace for interactive flashcards, quizzes, PDF summarization, and hands-free voice studying.',
  keywords: [
    'AI study assistant',
    'e-Mate AI',
    'flashcard generator',
    'AI topper',
    'quiz generator',
    'academic copilot',
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'e-Mate AI',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/asset/images/e.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'e-Mate AI — Smart Study Copilot & Workflow Assistant',
    description:
      'AI-powered study workspace for interactive flashcards, quizzes, PDF summarization, and hands-free voice studying.',
    url: 'https://emate-ai.vercel.app',
    siteName: 'e-Mate AI',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'e-Mate AI — Smart Study Copilot & Workflow Assistant',
    description:
      'AI-powered study workspace for interactive flashcards, quizzes, PDF summarization, and hands-free voice studying.',
    creator: '@emate_ai',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="overflow-x-hidden w-full max-w-[100vw]" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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
        className={`${plusJakarta.className} ${plusJakarta.variable} ${outfit.variable} ${jetbrainsMono.variable} overflow-x-hidden w-full max-w-[100vw] antialiased min-h-screen bg-background text-foreground`}
      >
        <RouteTracker />
        {children}
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
