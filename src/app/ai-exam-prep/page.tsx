import type { Metadata } from 'next';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';

export const metadata: Metadata = {
  title: 'AI Exam Preparation Assistant | e-Mate',
  description:
    'Prepare for exams with AI-generated revision prompts, question practice, summaries, and strategic study workflows designed for exam readiness.',
  alternates: {
    canonical: '/ai-exam-prep',
  },
};

const bullets = [
  'Build practice questions around your current syllabus',
  'Get concise revision summaries before each test',
  'Review common weak points and exam traps',
  'Turn revision into a repeatable exam-prep system',
];

export default function AIExamPrepPage() {
  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
            AI exam prep
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h1 className="max-w-xl text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl">
                AI exam preparation assistant built for real study pressure.
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-zinc-600">
                e-Mate helps you practice the right concepts, revisit weak topics, and build confidence before your next exam with structured preparation.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/ai-topper-chat"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Start exam prep
                </Link>
                <Link
                  href="/ai-study-planner"
                  className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                >
                  View study planner
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-5">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-4 text-white shadow-lg">
                <p className="text-sm font-medium text-emerald-100">Exam readiness</p>
                <p className="mt-3 text-2xl font-bold">Practice. Review. Repeat.</p>
              </div>
              <ul className="mt-5 space-y-3 text-sm text-zinc-700">
                {bullets.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900">Revision-first</h2>
            <p className="mt-3 text-zinc-600">Focus on the concepts most likely to appear in tests and finals instead of rereading everything equally.</p>
          </article>
          <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900">Practice blocks</h2>
            <p className="mt-3 text-zinc-600">Turn notes into targeted question practice and quick-answer recall exercises.</p>
          </article>
          <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900">Confidence support</h2>
            <p className="mt-3 text-zinc-600">Build a more disciplined exam routine by reviewing your weak areas before the test day arrives.</p>
          </article>
        </section>
      </main>
    </AppLayout>
  );
}
