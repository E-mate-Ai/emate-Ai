import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import AppLayout from '@/components/AppLayout';
import PublicFooter from '@/components/PublicFooter';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Brain,
  Layers,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Target,
  Clock,
  Zap,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Exam Preparation & High-Yield Revision Assistant',
  description:
    'Master exam preparation with e-Mate AI. High-yield syllabus summaries, simulated question drills, weak-point detection, and active recall revision routines.',
  keywords: [
    'AI exam prep',
    'exam preparation AI assistant',
    'high yield exam revision',
    'test preparation AI',
    'final exam revision tool',
    'syllabus exam prep',
    'e-Mate AI',
    'emate.live',
  ],
  alternates: {
    canonical: '/ai-exam-prep',
  },
  openGraph: {
    title: 'AI Exam Preparation & High-Yield Revision Assistant — e-Mate AI',
    description:
      'Master exam preparation with e-Mate AI. High-yield syllabus summaries, simulated question drills, weak-point detection, and active recall revision routines.',
    url: '/ai-exam-prep',
    siteName: 'e-Mate AI',
    type: 'website',
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Exam Preparation & High-Yield Revision Assistant — e-Mate AI',
    description:
      'Master exam preparation with e-Mate AI. High-yield syllabus summaries, simulated question drills, weak-point detection, and active recall revision routines.',
    images: ['/opengraph-image.png'],
  },
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://emate.live';

const prepPillars = [
  {
    title: 'High-Yield Concept Prioritization',
    desc: 'Don’t treat every syllabus page equally. e-Mate AI identifies foundational principles, recurring formulas, and high-weightage topics.',
    icon: <Target className="text-emerald-600 dark:text-emerald-400" size={20} />,
  },
  {
    title: 'Active Question Drills',
    desc: 'Practice under simulated pressure with targeted MCQs, calculation derivations, and conceptual tests with instant pedagogical explanations.',
    icon: <Brain className="text-blue-600 dark:text-blue-400" size={20} />,
  },
  {
    title: 'Exam Trap & Error Analysis',
    desc: 'Highlights common cognitive misconceptions and distractor tricks so you avoid avoidable mistakes on high-stakes exams.',
    icon: <AlertTriangle className="text-amber-600 dark:text-amber-400" size={20} />,
  },
  {
    title: 'Rapid Last-Mile Revision',
    desc: 'Generate concise, bulleted high-yield cheat sheets and flashcard sprints designed for the crucial 48 hours before the exam.',
    icon: <Zap className="text-purple-600 dark:text-purple-400" size={20} />,
  },
];

const examCountdownTimeline = [
  {
    period: 'T-Minus 14 Days',
    focus: 'Comprehensive Syllabus Coverage',
    action: 'Upload all notebook chapters and build structured flashcard decks for each unit.',
  },
  {
    period: 'T-Minus 7 Days',
    focus: 'Active Quizzing & Diagnostic Audit',
    action: 'Run multiple 20-question quizzes to map out high-error topics requiring reinforcement.',
  },
  {
    period: 'T-Minus 3 Days',
    focus: 'Weak-Spot Sprints',
    action: 'Revisit flagged difficult flashcards and practice targeted multi-step derivations.',
  },
  {
    period: 'T-Minus 24 Hours',
    focus: 'Confidence Consolidation',
    action: 'Review concise formula sheets and rest without late-night cramming.',
  },
];

const faqs = [
  {
    q: 'How does e-Mate AI help when I have very little time left before an exam?',
    a: 'When time is tight, e-Mate AI switches to Sprint Mode: it synthesizes your notes into high-yield summaries, highlights definitions most likely to be tested, and drills you on core active recall flashcards.',
  },
  {
    q: 'Can e-Mate simulate competitive exams?',
    a: 'Yes. Whether preparing for university midterms, AP / IB tests, or national entrance exams (such as MCAT, USMLE, JEE, or NEET), e-Mate can generate conceptual questions formatted to your exam style.',
  },
  {
    q: 'How does it help with test anxiety?',
    a: 'Test anxiety often stems from uncertainty about what you actually know. Active recall quizzes and continuous mastery tracking show you tangible proof of your preparation, instilling genuine confidence.',
  },
];

export default function AIExamPrepPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'e-Mate AI Exam Preparation Assistant',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    url: `${siteUrl}/ai-exam-prep`,
    description:
      'AI exam preparation assistant that provides high-yield revision summaries, practice question drills, and weak-point detection for students.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <AppLayout>
      <Script
        id="exam-prep-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'AI Exam Prep', href: '/ai-exam-prep' }]} className="mb-6" />
        {/* Hero Section */}
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10 dark:border-zinc-700 dark:bg-[#303030]">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            <GraduationCap size={13} />
            <span>AI Exam Preparation</span>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl dark:text-white leading-[1.15]">
                AI exam preparation engineered for real study pressure.
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
                e-Mate AI filters the noise, surfaces high-yield concepts, tests your recall with realistic questions, and eliminates knowledge gaps before test day arrives.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/">
                  <Sparkles size={15} />
                  <span>Start Exam Prep Free</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/ai-study-planner">
                  <Calendar size={14} />
                  <span>Study Planner</span>
                  </Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-[#353535]">
              <div className="rounded-2xl bg-[#1477f2] p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
                  Exam Readiness Protocol
                </p>
                <p className="mt-2 text-2xl font-bold">Focus. Practice. Conquer.</p>
              </div>
              <ul className="mt-5 space-y-3 text-xs text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>High-yield syllabus synthesis & formula sheets</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Active retrieval question drills under timed conditions</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Diagnostic review of common traps and errors</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4 Pillars of Readiness */}
        <section className="mt-14">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Systematic exam readiness features
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Designed to optimize revision efficiency in the weeks and days before high-stakes exams.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {prepPillars.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-4 inline-flex p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Countdown Sprint Protocol */}
        <section className="mt-14 rounded-3xl border border-zinc-200 bg-zinc-50 p-6 sm:p-10 dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
            The Exam Countdown Revision Cycle
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-6">
            How e-Mate structures your study progression as test day approaches.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {examCountdownTimeline.map((item) => (
              <div
                key={item.period}
                className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {item.period}
                  </span>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white mt-1.5 mb-2">
                    {item.focus}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {item.action}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tool Hub Grid */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
            Complete your exam prep toolkit
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/ai-quiz-generator"
              className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-pink-500 transition shadow-sm dark:border-zinc-800 dark:bg-zinc-900 group"
            >
              <Brain className="text-pink-600 mb-2.5" size={20} />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-pink-600 transition">
                AI Practice Quizzes →
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Test yourself with adaptive MCQs and instant diagnostic feedback.
              </p>
            </Link>

            <Link
              href="/ai-flashcard-generator"
              className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-blue-500 transition shadow-sm dark:border-zinc-800 dark:bg-zinc-900 group"
            >
              <Layers className="text-blue-600 mb-2.5" size={20} />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-blue-600 transition">
                AI Flashcards Engine →
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Visual cards and spaced repetition for fast active recall drills.
              </p>
            </Link>

            <Link
              href="/ai-study-planner"
              className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-violet-500 transition shadow-sm dark:border-zinc-800 dark:bg-zinc-900 group"
            >
              <Calendar className="text-violet-600 mb-2.5" size={20} />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-violet-600 transition">
                AI Study Planner →
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Map out daily study blocks around your exam countdown dates.
              </p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-14 rounded-3xl border border-zinc-200 bg-white p-6 sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
            Exam Prep FAQ
          </h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div
                key={f.q}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-800/50"
              >
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{f.q}</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-2 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-14 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Walk into your exam with total confidence.
          </h2>
          <Button asChild size="lg" className="mt-6">
            <Link href="/">
            <Sparkles size={16} />
            <span>Launch Exam Prep Workspace</span>
            </Link>
          </Button>
        </section>

        <PublicFooter />
      </main>
    </AppLayout>
  );
}
