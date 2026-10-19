import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ShieldCheck, BookOpen, Brain, CheckCircle2 } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="mt-20 border-t border-zinc-200/80 bg-white/70 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/70">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand & Mission */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image src="/asset/images/e.svg" alt="e-Mate AI" width={28} height={28} priority />
              <span className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">
                e-Mate AI
              </span>
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              AI-powered academic study workspace. Transform notes into interactive flashcards, practice quizzes, and syllabus-aligned revision roadmaps.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              <ShieldCheck size={14} className="shrink-0" />
              <span>Strict student data privacy & encrypted storage</span>
            </div>
          </div>

          {/* AI Study Tools */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              AI Study Tools
            </p>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link
                  href="/ai-study-assistant"
                  className="text-zinc-600 transition hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                >
                  AI Study Assistant
                </Link>
              </li>
              <li>
                <Link
                  href="/ai-flashcard-generator"
                  className="text-zinc-600 transition hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                >
                  AI Flashcard Generator
                </Link>
              </li>
              <li>
                <Link
                  href="/ai-quiz-generator"
                  className="text-zinc-600 transition hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                >
                  AI Quiz Generator
                </Link>
              </li>
              <li>
                <Link
                  href="/ai-study-planner"
                  className="text-zinc-600 transition hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                >
                  AI Study Planner
                </Link>
              </li>
              <li>
                <Link
                  href="/ai-exam-prep"
                  className="text-zinc-600 transition hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                >
                  AI Exam Preparation
                </Link>
              </li>
            </ul>
          </div>

          {/* Product & Support */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Explore & Support
            </p>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link
                  href="/about"
                  className="text-zinc-600 transition hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                >
                  About e-Mate
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-zinc-600 transition hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                >
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link
                  href="/upgrade"
                  className="text-zinc-600 transition hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                >
                  Plans & Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-zinc-600 transition hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                >
                  Contact & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Trust & Legal
            </p>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link
                  href="/privacy"
                  className="text-zinc-600 transition hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-zinc-600 transition hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                >
                  Terms of Service
                </Link>
              </li>
              <li className="pt-2 text-[11px] text-zinc-500">
                Institutional queries:{' '}
                <a href="mailto:support@emate.live" className="text-blue-600 underline dark:text-blue-400">
                  support@emate.live
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-zinc-200/80 pt-6 text-xs text-zinc-500 sm:flex-row dark:border-zinc-800/80">
          <p>© {new Date().getFullYear()} e-Mate AI Technologies. Built for focused student learning.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200">
              Study Workspace
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-zinc-800 dark:hover:text-zinc-200">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-zinc-800 dark:hover:text-zinc-200">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
