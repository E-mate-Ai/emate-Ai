import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, FileText, CheckCircle2, ShieldAlert, Mail, MapPin, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service — e-Mate AI',
  description:
    'Review the e-Mate AI Terms of Service. Understand subscription policies, student academic integrity, usage terms, and intellectual property guidelines.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsOfServicePage() {
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
            <FileText size={13} />
            <span>User Agreement & Academic Integrity Guidelines</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Effective Date: {lastUpdated} • Please read carefully before using the e-Mate AI application
          </p>
        </div>

        {/* Terms Body */}
        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using e-Mate AI, creating an account, or purchasing a subscription, you agree to be bound by these Terms of Service (&quot;Terms&quot;) and our Privacy Policy. If you do not agree to these Terms, please do not use the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              2. Student Academic Integrity & Acceptable Use
            </h2>
            <p>
              e-Mate AI is designed as an educational accelerator, study companion, and active recall practice tool. Users agree to use e-Mate AI ethically and responsibly:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You may use e-Mate AI to explain concepts, generate revision flashcards, synthesize notes, and take formative quizzes.</li>
              <li>You agree <strong>not</strong> to use e-Mate AI to engage in academic dishonesty, exam cheating, or violate the academic honor code of your educational institution.</li>
              <li>You must not reverse engineer, probe vulnerabilities, or flood our API endpoints with automated scrapers.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              3. Subscriptions, Payments & Cancellations
            </h2>
            <p>
              e-Mate AI offers free guest/authenticated usage tiers along with premium plans (e-Mate AI Plus, Pro, and Ultra).
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Billing:</strong> Subscriptions are billed in advance on a recurring monthly or annual basis via verified payment processors.</li>
              <li><strong>Cancellation:</strong> You may cancel recurring subscriptions at any time through your account settings. Access remains active through the end of the current billing cycle.</li>
              <li><strong>Refunds:</strong> We provide full refunds within 7 days of initial subscription purchase if you are dissatisfied with the service and have not excessively consumed automated compute resources.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              4. Intellectual Property & User Content
            </h2>
            <p>
              You retain ownership of any lecture notes, syllabus files, and documents you upload to e-Mate AI. By uploading content, you grant e-Mate AI a limited license solely to process and display that material back to you within the workspace. e-Mate AI and its visual branding, logo, code, and features remain the proprietary intellectual property of e-Mate AI Technologies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              5. AI Output Disclaimer
            </h2>
            <p>
              Artificial intelligence outputs (including flashcards, summaries, and test questions) are generated probabilistically. While e-Mate AI strives for high syllabus accuracy, answers should be verified against official course textbooks and professor guidelines. e-Mate AI is not liable for errors or exam outcomes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              6. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, e-Mate AI Technologies shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use the service.
            </p>
          </section>

          {/* Official Registered Office Contact */}
          <section className="mt-10 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-4">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Mail size={18} className="text-blue-600 dark:text-blue-400" />
              7. Official Contact Address & Notices
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Legal notices and formal inquiries should be addressed to our registered corporate office:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-zinc-900 dark:text-white block">Registered Office</span>
                <div className="flex items-start gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <MapPin size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <span>e-Mate AI Technologies<br />Plot 42, Sector 18, Institutional Area<br />Gurugram, Delhi NCR 122015, India</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-zinc-900 dark:text-white block">Support & Compliance</span>
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
                <span className="font-semibold text-zinc-900 dark:text-white block">Helpline</span>
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
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/thank-you" className="hover:underline">Thank You</Link>
            <Link href="/upgrade" className="hover:underline">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
