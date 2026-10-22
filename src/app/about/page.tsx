import type { Metadata } from 'next';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import PublicFooter from '@/components/PublicFooter';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Sparkles, Brain, BookOpen, Layers, CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us — Purpose-Driven AI Study Assistant',
  description:
    'Learn what e-Mate AI is, who it is built for, and how our AI-powered study workspace helps students study smarter with active recall, flashcards, and exam preparation.',
  keywords: [
    'about e-Mate AI',
    'AI study copilot mission',
    'student learning platform',
    'e-Mate AI',
    'emate.live',
  ],
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About Us — Purpose-Driven AI Study Assistant — e-Mate AI',
    description:
      'Learn what e-Mate AI is, who it is built for, and how our AI-powered study workspace helps students study smarter.',
    url: '/about',
    siteName: 'e-Mate AI',
    type: 'website',
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us — Purpose-Driven AI Study Assistant — e-Mate AI',
    description:
      'Learn what e-Mate AI is, who it is built for, and how our AI-powered study workspace helps students study smarter.',
    images: ['/opengraph-image.png'],
  },
};

const points = [
  'Built for students who want a structured, syllabus-grounded learning workflow instead of generic chat.',
  'Engineered around active recall, spaced repetition, weak-area detection, and verified syllabus materials.',
  'Converts lecture notes, textbook PDFs, and test schedules into measurable revision roadmaps.',
  'Supports long-term memory formation and authentic exam readiness, not just superficial shortcut answers.',
];

const pillars = [
  {
    title: 'Syllabus Context Anchoring',
    desc: 'Generic AI often hallucinates or wanders off-topic. e-Mate AI anchors study conversations strictly to your syllabus units and uploaded materials.',
    icon: <BookOpen className="text-blue-600" size={20} />,
  },
  {
    title: 'Cognitive Science Principles',
    desc: 'We incorporate active recall, Leitner-style spaced flashcards, and practice quizzes so you retain concepts under high exam pressure.',
    icon: <Brain className="text-indigo-600" size={20} />,
  },
  {
    title: 'Adaptive Weak-Spot Detection',
    desc: 'As you practice flashcards and quizzes, e-Mate identifies topics you struggle with and automatically resurfaces them before exam day.',
    icon: <Sparkles className="text-amber-600" size={20} />,
  },
  {
    title: 'Privacy & Academic Integrity',
    desc: 'Your study notebooks and personal notes are strictly private, encrypted, and never used to train public models without consent.',
    icon: <CheckCircle2 className="text-emerald-600" size={20} />,
  },
];

export default function AboutPage() {
  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'About', href: '/about' }]} className="mb-6" />
        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            About e-Mate AI
          </div>

          <h1 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
            e-Mate helps students study with structure, not guesswork.
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
            e-Mate is an AI-powered study assistant designed for learners who want a more organized way to prepare for exams. It brings together syllabus context, revision planning, practice questions, visual flashcards, and continuous feedback so students can study with less stress and greater confidence.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {points.map((point) => (
              <div
                key={point}
                className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300"
              >
                <span className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Pillars */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
            Core Principles Behind Our Study System
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {pillars.map((pillar) => (
              <article
                key={pillar.title}
                className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-3.5 inline-flex p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                  {pillar.icon}
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{pillar.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {pillar.desc}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Explore Tools Hub */}
        <section className="mt-10 rounded-3xl border border-zinc-200 bg-zinc-50 p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            Explore e-Mate AI Study Tools
          </h2>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            Dedicated tools crafted for each stage of your revision cycle.
          </p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-semibold">
            <Link
              href="/ai-study-assistant"
              className="p-3.5 rounded-2xl border border-zinc-200 bg-white hover:border-blue-500 hover:text-blue-600 transition shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-400"
            >
              AI Study Assistant →
            </Link>
            <Link
              href="/ai-flashcard-generator"
              className="p-3.5 rounded-2xl border border-zinc-200 bg-white hover:border-blue-500 hover:text-blue-600 transition shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-400"
            >
              AI Flashcards Engine →
            </Link>
            <Link
              href="/ai-quiz-generator"
              className="p-3.5 rounded-2xl border border-zinc-200 bg-white hover:border-blue-500 hover:text-blue-600 transition shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-400"
            >
              AI Practice Quizzes →
            </Link>
            <Link
              href="/ai-study-planner"
              className="p-3.5 rounded-2xl border border-zinc-200 bg-white hover:border-blue-500 hover:text-blue-600 transition shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-400"
            >
              AI Study Planner →
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 active:scale-95"
          >
            <Sparkles size={16} />
            <span>Open Study Workspace</span>
          </Link>
        </section>

        <PublicFooter />
      </main>
    </AppLayout>
  );
}
