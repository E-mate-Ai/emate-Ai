import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import AppLayout from '@/components/AppLayout';
import PublicFooter from '@/components/PublicFooter';
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  Layers,
  Brain,
  GraduationCap,
  ShieldCheck,
  Target,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Study Planner & Exam Schedule Builder',
  description:
    'Build realistic, syllabus-grounded daily study plans with e-Mate AI. Pace your exam revision, schedule active recall sessions, and hit your academic milestones.',
  keywords: [
    'AI study planner',
    'exam study schedule AI',
    'revision timetable generator',
    'study schedule builder',
    'syllabus revision planner',
    'exam countdown planner',
    'e-Mate AI',
    'emate.live',
  ],
  alternates: {
    canonical: '/ai-study-planner',
  },
  openGraph: {
    title: 'AI Study Planner & Exam Schedule Builder — e-Mate AI',
    description:
      'Build realistic, syllabus-grounded daily study plans with e-Mate AI. Pace your exam revision, schedule active recall sessions, and hit your academic milestones.',
    url: '/ai-study-planner',
    siteName: 'e-Mate AI',
    type: 'website',
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Study Planner & Exam Schedule Builder — e-Mate AI',
    description:
      'Build realistic, syllabus-grounded daily study plans with e-Mate AI. Pace your exam revision, schedule active recall sessions, and hit your academic milestones.',
    images: ['/opengraph-image.png'],
  },
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://emate.live';

const planningPillars = [
  {
    title: 'Countdown Exam Pacing',
    desc: 'Input your exam date and syllabus units. e-Mate AI calculates exactly how many hours and sessions you need per topic to achieve thorough coverage.',
    icon: <Calendar className="text-violet-600 dark:text-violet-400" size={20} />,
  },
  {
    title: 'Adaptive Weak-Spot Rebalancing',
    desc: 'As you practice quizzes and flashcards, the planner dynamically allocates more review blocks to subjects where your recall accuracy is lowest.',
    icon: <Target className="text-amber-600 dark:text-amber-400" size={20} />,
  },
  {
    title: 'Active Learning Blocks',
    desc: 'Never waste time on passive reading. Each scheduled study block balances syllabus comprehension, flashcard drills, and quiz assessments.',
    icon: <Layers className="text-blue-600 dark:text-blue-400" size={20} />,
  },
  {
    title: 'Buffer Days & Burnout Prevention',
    desc: 'Incorporates realistic catch-up buffers and rest cycles so unexpected delays do not derail your entire revision trajectory.',
    icon: <Clock className="text-emerald-600 dark:text-emerald-400" size={20} />,
  },
];

const sampleSchedule = [
  {
    time: 'Block 1 • 45 Mins',
    type: 'Concept Deep Dive',
    detail: 'Targeted syllabus reading and notes upload in Subject Notebook',
  },
  {
    time: 'Block 2 • 20 Mins',
    type: 'Active Flashcard Recall',
    detail: 'Visual diagram recall and rating cards (Easy / Good / Hard)',
  },
  {
    time: 'Block 3 • 25 Mins',
    type: 'Diagnostic Quiz Practice',
    detail: '10-question adaptive assessment with immediate reasoning feedback',
  },
  {
    time: 'Review • 15 Mins',
    type: 'Weak-Point Synthesis',
    detail: 'Summary checklist update and logging topics for tomorrow',
  },
];

const faqs = [
  {
    q: 'How does the AI Study Planner build my schedule?',
    a: 'You provide your subjects, exam date, and daily study availability. e-Mate AI structures a syllabus roadmap that divides units into high-yield daily study sprints and scheduled revision passes.',
  },
  {
    q: 'Can I adjust the plan if I fall behind?',
    a: 'Yes. The planner dynamically recalculates your remaining study pace whenever you finish a session or adjust your schedule.',
  },
  {
    q: 'Does it work for multiple subjects at once?',
    a: 'Yes. e-Mate AI balances multiple coursework topics so you maintain consistent progress across all classes without cramming at the end.',
  },
];

export default function AIStudyPlannerPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'e-Mate AI Study Planner',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    url: `${siteUrl}/ai-study-planner`,
    description:
      'AI-powered study planner that turns syllabi and exam deadlines into realistic, active recall study schedules.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <AppLayout>
      <Script
        id="study-planner-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
            <Calendar size={13} />
            <span>AI Study Planner</span>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl dark:text-white leading-[1.15]">
                Plan your syllabus revision with zero guesswork.
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
                e-Mate AI takes your exam dates, subject list, and target goals to generate a realistic study roadmap. Stop cramming the night before and build a disciplined, repeatable revision system.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition hover:bg-violet-700 active:scale-95"
                >
                  <Sparkles size={15} />
                  <span>Build My Study Plan</span>
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
              <div className="rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-5 text-white shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-100">
                  Revision Strategy
                </p>
                <p className="mt-2 text-2xl font-bold">Paced Study. Zero Cramming.</p>
              </div>
              <ul className="mt-5 space-y-3 text-xs text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-violet-600 shrink-0" />
                  <span>Syllabus units mapped to calendar milestones</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-violet-600 shrink-0" />
                  <span>Dynamic rebalancing for weak subject areas</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-violet-600 shrink-0" />
                  <span>Integrated flashcard & quiz assessment blocks</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Core Pillars */}
        <section className="mt-14">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Features engineered for disciplined learning
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              A study schedule that adapts to your speed rather than forcing rigid, unrealistic goals.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {planningPillars.map((item) => (
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

        {/* Sample Pacing Architecture */}
        <section className="mt-14 rounded-3xl border border-zinc-200 bg-zinc-50 p-6 sm:p-10 dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
            The Optimal Daily Revision Block
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-6">
            How e-Mate divides study sessions into high-retention cognitive intervals.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sampleSchedule.map((s, idx) => (
              <div
                key={s.time}
                className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  {s.time}
                </span>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mt-2">
                  {s.type}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  {s.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Interconnected Study Tools */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
            Seamlessly integrated with e-Mate study tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/ai-study-assistant"
              className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-blue-500 transition shadow-sm dark:border-zinc-800 dark:bg-zinc-900 group"
            >
              <Sparkles className="text-blue-600 mb-2.5" size={20} />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-blue-600 transition">
                AI Study Assistant →
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Ask questions anchored in your syllabus and textbook notes.
              </p>
            </Link>

            <Link
              href="/ai-flashcard-generator"
              className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-violet-500 transition shadow-sm dark:border-zinc-800 dark:bg-zinc-900 group"
            >
              <Layers className="text-violet-600 mb-2.5" size={20} />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-violet-600 transition">
                AI Flashcards Engine →
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Reinforce definitions, terms, and diagrams with active recall.
              </p>
            </Link>

            <Link
              href="/ai-quiz-generator"
              className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-pink-500 transition shadow-sm dark:border-zinc-800 dark:bg-zinc-900 group"
            >
              <Brain className="text-pink-600 mb-2.5" size={20} />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-pink-600 transition">
                AI Practice Quizzes →
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Test concept mastery with adaptive MCQs and instant feedback.
              </p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-14 rounded-3xl border border-zinc-200 bg-white p-6 sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
            Study Planner FAQ
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
            Take control of your exam timeline.
          </h2>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition hover:bg-violet-700 active:scale-95"
          >
            <Sparkles size={16} />
            <span>Create Your Study Plan</span>
          </Link>
        </section>

        <PublicFooter />
      </main>
    </AppLayout>
  );
}
