import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Shield, Lock, FileText, Mail, MapPin, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy — e-Mate AI',
  description:
    'Read the e-Mate AI Privacy Policy. Learn how we handle student data, syllabus uploads, session transcripts, cookies, and strict data security protocols.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'September 2026';

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/asset/images/e.svg" alt="e-Mate AI logo" width={28} height={28} priority />
            <span className="font-extrabold text-base tracking-tight">e-Mate AI</span>
          </Link>

          <Link
            href="/ai-topper-chat"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition"
          >
            <ArrowLeft size={14} /> Back to Study
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full">
        {/* Title & Badge */}
        <div className="mb-10 text-left border-b border-zinc-200 dark:border-zinc-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3 border border-blue-200 dark:border-blue-800">
            <Shield size={13} />
            <span>Student Privacy Protection Standards</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Effective Date: {lastUpdated} • Applicable globally to all e-Mate AI platforms and services
          </p>
        </div>

        {/* Policy Body */}
        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              1. Overview & Commitment
            </h2>
            <p>
              e-Mate AI Technologies (&quot;e-Mate AI&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is deeply committed to safeguarding student and educator privacy. This Privacy Policy details our practices concerning data collection, storage, processing, and protection when you interact with our AI study workspace, flashcard generator, practice tests, and notebook services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Account Credentials:</strong> Email address, display name, and authentication tokens (via Supabase Authentication or Google OAuth).
              </li>
              <li>
                <strong>Academic Study Inputs:</strong> Syllabus documents, textbook notes, uploaded PDF materials, user chat prompts, and active recall quiz results.
              </li>
              <li>
                <strong>Technical Telemetry:</strong> Device type, browser characteristics, IP address, general geographic region, session duration, and latency metrics.
              </li>
              <li>
                <strong>Transaction Records:</strong> For paid tiers, payment identifiers and transaction receipts managed via our certified payment gateway partners (e.g. Razorpay). We do not store raw credit/debit card numbers.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              3. How We Use Academic Data & AI Training Policy
            </h2>
            <p>
              <strong>We do not sell your personal data or study notes to third parties.</strong> Your uploaded notes, transcripts, and quiz histories are utilized solely to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Synthesize relevant study flashcards and practice test questions.</li>
              <li>Anchor AI responses directly to your university syllabus unit.</li>
              <li>Maintain your cross-device notebook synchronization.</li>
              <li>Diagnose operational errors and protect against abuse.</li>
            </ul>
            <p>
              Uploaded study materials are processed securely via encrypted API endpoints through partner AI models (e.g., OpenRouter, Gemini, Claude) with zero data-retention agreements for model training.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              4. Cookies and Local Storage
            </h2>
            <p>
              e-Mate AI uses essential cookies and browser LocalStorage to retain your logged-in state, active subject notebook, selected UI theme (light/dark mode), and cookie consent preferences. You can manage or revoke cookie choices at any time via the cookie banner or your browser settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              5. Data Security & Retention
            </h2>
            <p>
              We implement industry-standard AES-256 bit encryption at rest and TLS 1.3 in transit. You retain the absolute right to delete individual notebooks, chat history sessions, or request complete account erasure at any time via Settings or by reaching out to our support team.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              6. Student Rights & International Compliance
            </h2>
            <p>
              Depending on your jurisdiction, you may have rights under GDPR (Europe), CCPA (California), or the Digital Personal Data Protection Act (India), including rights to access, rectify, port, or erase your personal information.
            </p>
          </section>

          {/* Official Contact Address Box */}
          <section className="mt-10 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-4">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Mail size={18} className="text-blue-600 dark:text-blue-400" />
              7. Contact Us & Data Protection Officer
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              For any questions regarding this Privacy Policy, your study data, or to exercise your privacy rights, please contact our legal and support team:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-zinc-900 dark:text-white block">Corporate Office</span>
                <div className="flex items-start gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <MapPin size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <span>e-Mate AI Technologies<br />Plot 42, Sector 18, Institutional Area<br />Gurugram, Delhi NCR 122015, India</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-zinc-900 dark:text-white block">Official Email</span>
                <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <Mail size={14} className="text-blue-600 shrink-0" />
                  <a href="mailto:support@emate-ai.com" className="hover:underline text-blue-600 dark:text-blue-400">
                    support@emate-ai.com
                  </a>
                </div>
                <div className="text-[11px] text-zinc-500">
                  Direct: isachinbisht@gmail.com
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-zinc-900 dark:text-white block">Direct Phone</span>
                <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <Phone size={14} className="text-blue-600 shrink-0" />
                  <a href="tel:+918860911070" className="hover:underline text-zinc-800 dark:text-zinc-200">
                    +91 8860911070
                  </a>
                </div>
                <div className="text-[11px] text-zinc-500">
                  Mon – Sat: 9:00 AM – 7:00 PM IST
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} e-Mate AI Technologies. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/thank-you" className="hover:underline">Thank You</Link>
            <Link href="/ai-topper-chat" className="hover:underline">AI Workspace</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
