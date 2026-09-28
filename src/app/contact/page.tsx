import type { Metadata } from 'next';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';

export const metadata: Metadata = {
  title: 'Contact e-Mate AI | Support & Inquiries',
  description:
    'Contact the e-Mate AI team for support, partnership questions, and product inquiries about the AI study assistant.',
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactPage() {
  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
            Contact
          </div>

          <h1 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl">
            Contact e-Mate
          </h1>

          <div className="mt-8 space-y-5 text-zinc-600">
            <p>
              For support, questions, partnerships, or student-related issues, reach out to the e-Mate team directly.
            </p>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="font-semibold text-zinc-900">Email</p>
              <a href="mailto:support@emate-ai.com" className="mt-2 inline-block text-blue-600 hover:underline">
                support@emate-ai.com
              </a>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="font-semibold text-zinc-900">Phone</p>
              <a href="tel:+918860911070" className="mt-2 inline-block text-blue-600 hover:underline">
                +91 8860911070
              </a>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="font-semibold text-zinc-900">Business address</p>
              <p className="mt-2 text-zinc-700">
                e-Mate AI Technologies<br />
                Plot 42, Sector 18, Institutional Area<br />
                Gurugram, Delhi NCR 122015, India
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/ai-topper-chat"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Open e-Mate
            </Link>
            <Link
              href="/privacy"
              className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
              Privacy Policy
            </Link>
          </div>
        </section>
      </main>
    </AppLayout>
  );
}
