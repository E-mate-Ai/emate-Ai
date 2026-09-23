import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Sparkles, ArrowRight, BookOpen, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Thank You — e-Mate AI',
  description:
    'Thank you for joining e-Mate AI. Your AI study workspace, flashcard engine, and personalized study tools are ready.',
  alternates: {
    canonical: '/thank-you',
  },
};

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/asset/images/e.svg" alt="e-Mate AI" width={30} height={30} priority />
            <span className="font-extrabold text-lg tracking-tight">e-Mate AI</span>
          </Link>

          <Link
            href="/ai-topper-chat"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all shadow-sm"
          >
            Open Workspace <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-16 text-center flex-1 flex flex-col items-center justify-center">
        {/* Celebration Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xl shadow-emerald-500/10">
            <CheckCircle2 size={44} className="stroke-[2.2]" />
          </div>
          <div className="absolute -top-1 -right-1 p-1 rounded-full bg-blue-600 text-white shadow-md">
            <Sparkles size={14} />
          </div>
        </div>

        <span className="text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-4">
          All Systems Ready
        </span>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 text-zinc-900 dark:text-white">
          Thank you for choosing e-Mate AI!
        </h1>

        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed mb-8">
          Your AI study workspace is configured and ready. Start uploading notes, generating high-yield flashcards, or practicing active recall quizzes immediately.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center mb-12">
          <Link
            href="/ai-topper-chat"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/25 active:scale-95"
          >
            <Sparkles size={16} />
            Launch AI Study Workspace
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-sm font-semibold transition-all active:scale-95"
          >
            Explore Dashboard
          </Link>
        </div>

        {/* Value Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left mb-12">
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
            <BookOpen className="text-blue-600 dark:text-blue-400 mb-2.5" size={20} />
            <h3 className="text-sm font-bold mb-1">Subject Notebooks</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Upload textbook PDFs, lecture notes, and syllabus units.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
            <Sparkles className="text-blue-600 dark:text-blue-400 mb-2.5" size={20} />
            <h3 className="text-sm font-bold mb-1">Active Recall Quizzes</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Instant practice questions adapted to your syllabus targets.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
            <ShieldCheck className="text-emerald-600 dark:text-emerald-400 mb-2.5" size={20} />
            <h3 className="text-sm font-bold mb-1">Guaranteed Privacy</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Your study notes and exam data are strictly encrypted.
            </p>
          </div>
        </div>

        {/* Support & Registered Contact Info */}
        <div className="w-full p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 text-xs text-zinc-600 dark:text-zinc-400 text-left">
          <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-2">Need any assistance?</h4>
          <p className="mb-4">
            Our engineering and student support team is here to assist with account access, billing receipts, or university integrations.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <a href="mailto:support@emate-ai.com" className="hover:underline font-medium text-zinc-800 dark:text-zinc-200">
                support@emate-ai.com
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <a href="tel:+918860911070" className="hover:underline font-medium text-zinc-800 dark:text-zinc-200">
                +91 8860911070
              </a>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={15} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <span>Plot 42, Sector 18, Gurugram, Delhi NCR 122015</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} e-Mate AI Technologies. All rights reserved.</p>
      </footer>
    </div>
  );
}
