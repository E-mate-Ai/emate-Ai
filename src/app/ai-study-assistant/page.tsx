import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import AppLayout from '@/components/AppLayout';
import PublicFooter from '@/components/PublicFooter';
import {
  Sparkles,
  BookOpen,
  Brain,
  Layers,
  CheckCircle2,
  ArrowRight,
  Clock,
  Compass,
  GraduationCap,
  FileText,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Study Assistant for Students & Exam Prep',
  description:
    'Turn your syllabus, lecture notes, and textbook PDFs into a personalized AI study flow with active recall flashcards, practice quizzes, and adaptive learning support.',
  keywords: [
    'AI study assistant',
    'academic study assistant',
    'AI study copilot',
    'homework helper AI',
    'syllabus revision assistant',
    'active recall study tool',
    'e-Mate AI',
    'emate.live',
  ],
  alternates: {
    canonical: '/ai-study-assistant',
  },
  openGraph: {
    title: 'AI Study Assistant for Students & Exam Prep — e-Mate AI',
    description:
      'Turn your syllabus, lecture notes, and textbook PDFs into a personalized AI study flow with active recall flashcards, practice quizzes, and adaptive learning support.',
    url: '/ai-study-assistant',
    siteName: 'e-Mate AI',
    type: 'website',
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Study Assistant for Students & Exam Prep — e-Mate AI',
    description:
      'Turn your syllabus, lecture notes, and textbook PDFs into a personalized AI study flow with active recall flashcards, practice quizzes, and adaptive learning support.',
    images: ['/opengraph-image.png'],
  },
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://emate.live';

const workflows = [
  {
    step: '01',
    title: 'Anchor Your Syllabus',
    desc: 'Upload lecture slides, textbook PDFs, or enter your curriculum units. e-Mate grounds all reasoning strictly in your course material.',
    icon: <FileText className="text-blue-600 dark:text-blue-400" size={20} />,
  },
  {
    step: '02',
    title: 'Synthesize & Understand',
    desc: 'Ask complex conceptual questions, unpack difficult derivations, and explore analogies in Sprint (rapid recall) or Deep Dive mode.',
    icon: <Compass className="text-indigo-600 dark:text-indigo-400" size={20} />,
  },
  {
    step: '03',
    title: 'Reinforce With Flashcards & Quizzes',
    desc: 'Transform passive notes into illustrated active recall flashcards and adaptive MCQs to strengthen retention.',
    icon: <Layers className="text-purple-600 dark:text-purple-400" size={20} />,
  },
  {
    step: '04',
    title: 'Eliminate Weak Spots',
    desc: 'Track mastery across subjects and revisit topics where your quiz performance indicates knowledge gaps prior to test day.',
    icon: <GraduationCap className="text-emerald-600 dark:text-emerald-400" size={20} />,
  },
];

const capabilities = [
  {
    title: 'Contextual Document Retrieval',
    desc: 'No more hallucinations. e-Mate parses your specific textbook chapters and class notes to provide authoritative answers cited from your curriculum.',
  },
  {
    title: 'Active Recall vs. Passive Reading',
    desc: 'Reading notes repeatedly creates an illusion of competence. e-Mate prompts you with questions and flashcards to stimulate retrieval practice.',
  },
  {
    title: 'Multi-Model AI Intelligence',
    desc: 'Powered by state-of-the-art open and specialized models, offering step-by-step problem-solving for STEM, humanities, and professional examinations.',
  },
  {
    title: 'Study Habit Continuity',
    desc: 'Preserves chat history, flashcard review decks, and subject notebooks across sessions so your revision builds compounding momentum.',
  },
];

const faqItems = [
  {
    q: 'How does the AI Study Assistant help me study faster?',
    a: 'Instead of spending hours summarizing textbooks or searching through messy notes, e-Mate AI extracts key formulas, defines complex terms in plain language, and automatically creates revision exercises tailored to your syllabus.',
  },
  {
    q: 'Can I use e-Mate AI for competitive exams like JEE, NEET, USMLE, or GRE?',
    a: 'Yes. Students frequently use e-Mate to structure high-density revision for competitive exams by uploading specific syllabus units and practicing targeted topic quizzes.',
  },
  {
    q: 'Does it replace reading my textbooks?',
    a: 'No. e-Mate AI is an active study partner. It guides your comprehension, tests your recall, and highlights weak spots, turning textbook study into an interactive learning dialogue.',
  },
];

export default function AIStudyAssistantPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'e-Mate AI Study Assistant',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    url: `${siteUrl}/ai-study-assistant`,
    description:
      'AI-powered study assistant that helps students understand concepts, retain information with flashcards, practice quizzes, and prepare for exams.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <AppLayout>
      <Script
        id="study-assistant-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            <Sparkles size={13} />
            <span>AI Study Assistant</span>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl dark:text-white leading-[1.15]">
                The AI study assistant built for serious academic results.
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
                e-Mate AI turns your syllabus, lecture notes, and textbook PDFs into an active learning workspace. Study concepts deeply, build retention with flashcards, and test your exam readiness before test day.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 active:scale-95"
                >
                  <Sparkles size={15} />
                  <span>Start Studying Free</span>
                </Link>
                <Link
                  href="/ai-flashcard-generator"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-5 py-3.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <Layers size={14} />
                  <span>Flashcards Engine</span>
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-800/40">
              <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-5 text-white shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                  Adaptive Learning Cycle
                </p>
                <p className="mt-2 text-2xl font-bold">Syllabus → Flashcards → Quizzes → Mastery</p>
              </div>
              <ul className="mt-5 space-y-3 text-xs text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-blue-600 shrink-0" />
                  <span>RAG contextual document anchoring</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-blue-600 shrink-0" />
                  <span>Spaced repetition flashcards with SM-2 intervals</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-blue-600 shrink-0" />
                  <span>Instant active recall quizzes with diagnostic feedback</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4-Step Academic Workflow */}
        <section className="mt-14">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              How the AI study assistant guides your learning
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              A structured cognitive process designed to convert coursework into long-term recall.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {workflows.map((item) => (
              <div
                key={item.step}
                className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-extrabold font-mono text-zinc-400 dark:text-zinc-500">
                      {item.step}
                    </span>
                    <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800">{item.icon}</div>
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Core Capabilities */}
        <section className="mt-14 rounded-3xl border border-zinc-200 bg-zinc-50 p-6 sm:p-10 dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
            Why students choose e-Mate over generic AI chatbots
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {capabilities.map((cap) => (
              <div
                key={cap.title}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-800/60"
              >
                <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
                  {cap.title}
                </h3>
                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {cap.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Tool Hub Grid */}
        <section className="mt-14">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Specialized study tools in e-Mate AI
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Explore each dedicated component designed for your revision cycle.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/ai-flashcard-generator"
              className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-blue-500 transition shadow-sm dark:border-zinc-800 dark:bg-zinc-900 group"
            >
              <Layers className="text-blue-600 mb-3" size={22} />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-blue-600 transition">
                AI Flashcards Engine
              </h3>
              <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                Generate illustrated, physical-style cards with active recall rating.
              </p>
            </Link>

            <Link
              href="/ai-quiz-generator"
              className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-pink-500 transition shadow-sm dark:border-zinc-800 dark:bg-zinc-900 group"
            >
              <Brain className="text-pink-600 mb-3" size={22} />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-pink-600 transition">
                AI Quiz Generator
              </h3>
              <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                MCQs and diagnostic practice tests adaptive to your syllabus units.
              </p>
            </Link>

            <Link
              href="/ai-study-planner"
              className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-violet-500 transition shadow-sm dark:border-zinc-800 dark:bg-zinc-900 group"
            >
              <Clock className="text-violet-600 mb-3" size={22} />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-violet-600 transition">
                AI Study Planner
              </h3>
              <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                Organize revision blocks and exam countdown pacing effortlessly.
              </p>
            </Link>

            <Link
              href="/ai-exam-prep"
              className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-emerald-500 transition shadow-sm dark:border-zinc-800 dark:bg-zinc-900 group"
            >
              <GraduationCap className="text-emerald-600 mb-3" size={22} />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-emerald-600 transition">
                AI Exam Prep
              </h3>
              <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                Target high-yield topics and weak points under simulated test conditions.
              </p>
            </Link>
          </div>
        </section>

        {/* Study Assistant FAQ */}
        <section className="mt-14 rounded-3xl border border-zinc-200 bg-white p-6 sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqItems.map((f) => (
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

        {/* Final CTA */}
        <section className="mt-14 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Ready to upgrade your study sessions?
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-md mx-auto">
            Experience structured, syllabus-anchored AI study with e-Mate.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 active:scale-95"
          >
            <Sparkles size={16} />
            <span>Open Study Assistant Free</span>
          </Link>
        </section>

        <PublicFooter />
      </main>
    </AppLayout>
  );
}
