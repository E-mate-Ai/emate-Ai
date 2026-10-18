import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import AppLayout from '@/components/AppLayout';
import PublicFooter from '@/components/PublicFooter';
import {
  Brain,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Layers,
  HelpCircle,
  BarChart3,
  Clock,
  GraduationCap,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Quiz Generator & Active Recall Practice',
  description:
    'Turn lecture notes, textbook PDFs, and syllabus topics into multiple-choice quizzes and active recall practice questions with instant diagnostic explanations.',
  keywords: [
    'AI quiz generator',
    'generate quiz from notes',
    'MCQ generator from PDF',
    'active recall quizzes',
    'exam practice quiz AI',
    'syllabus quiz generator',
    'e-Mate AI',
  ],
  alternates: {
    canonical: '/ai-quiz-generator',
  },
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://emate-ai.runs-on.dev';

const quizFormats = [
  {
    title: 'Multiple Choice Questions (MCQs)',
    desc: 'Formulates 4-option questions with high-yield distractors that test deep conceptual understanding rather than simple keyword matching.',
    icon: <Brain className="text-pink-600 dark:text-pink-400" size={20} />,
  },
  {
    title: 'Instant Diagnostic Explanations',
    desc: 'Provides immediate explanations after every answer, explaining why the correct choice is right and where common misconceptions occur.',
    icon: <Sparkles className="text-amber-600 dark:text-amber-400" size={20} />,
  },
  {
    title: 'Adaptive Difficulty Progression',
    desc: 'Starts with foundational recall and scales dynamically to complex multi-step application and analytical reasoning as you demonstrate mastery.',
    icon: <BarChart3 className="text-blue-600 dark:text-blue-400" size={20} />,
  },
  {
    title: 'Syllabus & Chapter Alignment',
    desc: 'Generate quizzes targeted to a single tricky unit or full cumulative review across all your uploaded Subject Notebook materials.',
    icon: <BookOpen className="text-emerald-600 dark:text-emerald-400" size={20} />,
  },
];

const faqs = [
  {
    q: 'How does the AI generate quizzes from my notes?',
    a: 'You can upload your PDF notes or specify a topic in your Subject Notebook. e-Mate AI analyzes the core facts, formulas, and relationships to construct realistic exam-style questions with accurate answer keys and explanations.',
  },
  {
    q: 'Can I choose how many questions to generate?',
    a: 'Yes. You can generate quick 5-question sprints for rapid revision or comprehensive 20+ question practice assessments before finals.',
  },
  {
    q: 'Does it track which questions I get wrong?',
    a: 'Yes. e-Mate AI registers your missed concepts and incorporates them into your personalized revision checklist and flashcard review queue.',
  },
];

export default function AIQuizGeneratorPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'e-Mate AI Quiz Generator',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    url: `${siteUrl}/ai-quiz-generator`,
    description:
      'AI tool that turns study notes and syllabus topics into interactive practice quizzes with immediate pedagogical feedback.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <AppLayout>
      <Script
        id="quiz-generator-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-pink-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">
            <Brain size={13} />
            <span>AI Quiz Generator</span>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl dark:text-white leading-[1.15]">
                Turn your notes into exam practice quizzes in seconds.
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Passive reading only produces false confidence. e-Mate AI creates targeted active recall quizzes from any topic, chapter, or PDF, verifying what you actually know before the exam.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-pink-600 px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-pink-500/20 transition hover:bg-pink-700 active:scale-95"
                >
                  <Sparkles size={15} />
                  <span>Generate Practice Quiz</span>
                </Link>
                <Link
                  href="/ai-exam-prep"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-5 py-3.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <GraduationCap size={14} />
                  <span>Exam Prep Hub</span>
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-800/40">
              <div className="rounded-2xl bg-gradient-to-br from-pink-600 via-rose-600 to-amber-600 p-5 text-white shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-wider text-pink-100">
                  Active Retrieval Cycle
                </p>
                <p className="mt-2 text-2xl font-bold">Question → Answer → Analysis → Retention</p>
              </div>
              <ul className="mt-5 space-y-3 text-xs text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-pink-600 shrink-0" />
                  <span>Instant step-by-step diagnostic explanations</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-pink-600 shrink-0" />
                  <span>Customizable question counts and difficulty tiers</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-pink-600 shrink-0" />
                  <span>Automatic weak-point logging for spaced review</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="mt-14">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Smarter self-testing engineered for retention
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Transforming raw academic text into rigorous, syllabus-aligned assessments.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {quizFormats.map((item) => (
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

        {/* Comparison: Passive Reading vs Active Quizzing */}
        <section className="mt-14 rounded-3xl border border-zinc-200 bg-zinc-50 p-6 sm:p-10 dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
            Why active quizzing outperforms re-reading notes
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-red-200/60 bg-white p-5 dark:border-red-950/40 dark:bg-zinc-900">
              <span className="text-xs font-bold uppercase text-red-600 dark:text-red-400">
                Traditional Rote Re-reading
              </span>
              <ul className="mt-3 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                <li>• Creates a false sense of fluency without real recall ability</li>
                <li>• No feedback on whether you would remember under test conditions</li>
                <li>• Leaves knowledge gaps hidden until after you receive exam scores</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-emerald-200/60 bg-white p-5 dark:border-emerald-950/40 dark:bg-zinc-900">
              <span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">
                e-Mate AI Active Quizzing
              </span>
              <ul className="mt-3 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                <li>• Forces mental retrieval, creating stronger neural pathway connections</li>
                <li>• Instant diagnostic feedback reinforces the underlying concept immediately</li>
                <li>• Directly targets syllabus weak points before you step into the exam hall</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Connected Tools Hub */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
            Complement your quiz practice with full study tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/ai-flashcard-generator"
              className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-blue-500 transition shadow-sm dark:border-zinc-800 dark:bg-zinc-900 group"
            >
              <Layers className="text-blue-600 mb-2.5" size={20} />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-blue-600 transition">
                AI Flashcards Engine →
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Review key definitions and formulas with visual spaced repetition.
              </p>
            </Link>

            <Link
              href="/ai-study-planner"
              className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-violet-500 transition shadow-sm dark:border-zinc-800 dark:bg-zinc-900 group"
            >
              <Clock className="text-violet-600 mb-2.5" size={20} />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-violet-600 transition">
                AI Study Planner →
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Schedule study sessions around your upcoming exam deadlines.
              </p>
            </Link>

            <Link
              href="/ai-study-assistant"
              className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-emerald-500 transition shadow-sm dark:border-zinc-800 dark:bg-zinc-900 group"
            >
              <Sparkles className="text-emerald-600 mb-2.5" size={20} />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-emerald-600 transition">
                AI Study Workspace →
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Upload notes and ask conceptual questions grounded in your syllabus.
              </p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-14 rounded-3xl border border-zinc-200 bg-white p-6 sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
            Quiz Generator FAQ
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
            Ready to test your knowledge?
          </h2>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-pink-600 px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-pink-500/20 transition hover:bg-pink-700 active:scale-95"
          >
            <Sparkles size={16} />
            <span>Generate Free AI Quiz Now</span>
          </Link>
        </section>

        <PublicFooter />
      </main>
    </AppLayout>
  );
}
