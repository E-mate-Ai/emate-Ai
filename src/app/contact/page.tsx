import type { Metadata } from 'next';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import PublicFooter from '@/components/PublicFooter';
import Script from 'next/script';
import { Mail, Phone, MapPin, Sparkles, Clock, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us & Student Support',
  description:
    'Contact the e-Mate AI support team for assistance with student accounts, university partnerships, technical issues, or product inquiries.',
  alternates: {
    canonical: '/contact',
  },
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://emate-ai.runs-on.dev';

export default function ContactPage() {
  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'e-Mate AI Technologies',
    url: siteUrl,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+91-8860911070',
        contactType: 'customer support',
        email: 'support@emate-ai.com',
        areaServed: 'Worldwide',
        availableLanguage: ['English', 'Hindi'],
      },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Plot 42, Sector 18, Institutional Area',
      addressLocality: 'Gurugram',
      addressRegion: 'Delhi NCR',
      postalCode: '122015',
      addressCountry: 'IN',
    },
  };

  return (
    <AppLayout>
      <Script
        id="contact-org-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
            Support & Inquiries
          </div>

          <h1 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
            Contact e-Mate AI
          </h1>

          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Need help with your account, syllabus uploads, or institutional integration? Reach out to our team directly. We prioritize student learning and respond promptly.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-800/60">
              <div className="flex items-center gap-2.5 text-zinc-900 dark:text-white font-bold text-sm">
                <Mail size={16} className="text-blue-600 dark:text-blue-400" />
                <span>Email Support</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">For account, billing, and technical questions</p>
              <a
                href="mailto:support@emate-ai.com"
                className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                support@emate-ai.com
              </a>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-800/60">
              <div className="flex items-center gap-2.5 text-zinc-900 dark:text-white font-bold text-sm">
                <Phone size={16} className="text-blue-600 dark:text-blue-400" />
                <span>Phone Assistance</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">Monday to Saturday: 9:00 AM – 7:00 PM IST</p>
              <a
                href="tel:+918860911070"
                className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                +91 8860911070
              </a>
            </div>

            <div className="sm:col-span-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-800/60">
              <div className="flex items-center gap-2.5 text-zinc-900 dark:text-white font-bold text-sm">
                <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
                <span>Headquarters & Mailing Address</span>
              </div>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                e-Mate AI Technologies<br />
                Plot 42, Sector 18, Institutional Area<br />
                Gurugram, Delhi NCR 122015, India
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
            >
              <Sparkles size={15} />
              <span>Open Study Workspace</span>
            </Link>
            <Link
              href="/faq"
              className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 px-6 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              View FAQ
            </Link>
          </div>
        </section>

        <PublicFooter />
      </main>
    </AppLayout>
  );
}
